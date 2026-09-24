<?php
/**
 * REST route that installs and switches the plugins behind the Features tab.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Plugins_Installer;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Installs, activates and deactivates the plugins and modules in the feature map.
 */
class REST_Main_Features {

	/**
	 * The namespace these routes live in.
	 *
	 * `wpcom/v2` rather than `my-jetpack/v1`, which WordPress.com Simple does not serve —
	 * and the Features tab runs there too.
	 */
	const ROUTE_NAMESPACE = 'wpcom/v2';

	/**
	 * User meta that keeps the Features tab banner hidden for the user who dismissed it.
	 */
	const BANNER_DISMISSED_META = 'jetpack_my_jetpack_features_banner_dismissed';

	/**
	 * Register the route.
	 *
	 * @return void
	 */
	public function register_rest_routes() {
		register_rest_route(
			self::ROUTE_NAMESPACE,
			'my-jetpack/site/features',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_state',
				'permission_callback' => __CLASS__ . '::permissions_callback',
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'my-jetpack/site/features/banner/dismiss',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => __CLASS__ . '::dismiss_banner',
				// Anyone who can see My Jetpack sees the banner, so anyone who can see it may dismiss it.
				'permission_callback' => array( Initializer::class, 'permissions_callback' ),
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'my-jetpack/site/features/plugin',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => __CLASS__ . '::switch_plugin',
				'permission_callback' => __CLASS__ . '::permissions_callback',
				'args'                => array(
					'plugin' => array(
						'type'     => 'string',
						'required' => true,
						// Only plugins the feature map names, never an arbitrary slug.
						'enum'     => Main_Features::get_switchable_plugins(),
					),
					'action' => array(
						'type'     => 'string',
						'required' => true,
						'enum'     => array( 'install', 'activate', 'deactivate' ),
					),
				),
			)
		);

		register_rest_route(
			self::ROUTE_NAMESPACE,
			'my-jetpack/site/features/bulk',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => __CLASS__ . '::switch_many',
				'permission_callback' => __CLASS__ . '::permissions_callback',
				'args'                => array(
					'active'  => array(
						'type'     => 'boolean',
						'required' => true,
					),
					'plugins' => array(
						'type'    => 'array',
						'default' => array(),
						'items'   => array(
							'type' => 'string',
							'enum' => Main_Features::get_switchable_plugins(),
						),
					),
					'modules' => array(
						'type'    => 'array',
						'default' => array(),
						'items'   => array( 'type' => 'string' ),
					),
				),
			)
		);
	}

	/**
	 * Whoever may activate plugins here may use the route, as with the products routes.
	 *
	 * @return bool
	 */
	public static function permissions_callback() {
		return REST_Products::edit_permissions_callback();
	}

	/**
	 * Whether the current user has dismissed the Features tab banner.
	 *
	 * @return bool
	 */
	public static function is_banner_dismissed() {
		return (bool) get_user_meta( get_current_user_id(), self::BANNER_DISMISSED_META, true );
	}

	/**
	 * Hide the Features tab banner for the current user, for good.
	 *
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function dismiss_banner() {
		// Checked first: update_user_meta() also returns false when the value is unchanged.
		if ( ! self::is_banner_dismissed() && ! update_user_meta( get_current_user_id(), self::BANNER_DISMISSED_META, 1 ) ) {
			return new WP_Error( 'banner_not_dismissed', __( 'The banner could not be dismissed.', 'jetpack-my-jetpack' ), array( 'status' => 500 ) );
		}

		return rest_ensure_response( true );
	}

	/**
	 * The Features tab's state, read fresh from the site.
	 *
	 * The page is rendered with a copy of this, but that copy ages: it is a snapshot from
	 * the load, and anything switched since — here or anywhere else — has moved past it.
	 *
	 * @return \WP_REST_Response
	 */
	public static function get_state() {
		return rest_ensure_response( Main_Features::get_state() );
	}

	/**
	 * Install, activate or deactivate one plugin from the feature map.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return \WP_REST_Response|WP_Error The Features tab's fresh state, or an error.
	 */
	public static function switch_plugin( $request ) {
		$slug   = $request->get_param( 'plugin' );
		$action = $request->get_param( 'action' );

		$refused = self::refuse_deactivation( $slug, $action );
		if ( $refused ) {
			return $refused;
		}

		if ( 'install' === $action && ! current_user_can( 'install_plugins' ) ) {
			return new WP_Error( 'not_allowed', __( 'You are not allowed to install plugins on this site.', 'jetpack-my-jetpack' ), array( 'status' => 403 ) );
		}

		$result = self::run( $slug, $action );

		if ( is_wp_error( $result ) ) {
			$data = $result->get_error_data();

			if ( ! is_array( $data ) || ! isset( $data['status'] ) ) {
				$result->add_data( array( 'status' => 400 ), $result->get_error_code() );
			}

			return $result;
		}

		return rest_ensure_response( Main_Features::get_state() );
	}

	/**
	 * Switch several plugins and modules on or off in one request.
	 *
	 * Each is tried in turn and a failure does not stop the rest, so the response carries the
	 * fresh state together with what could not be switched and why.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return \WP_REST_Response The Features tab's fresh state, and a list of failures.
	 */
	public static function switch_many( $request ) {
		$active = (bool) $request->get_param( 'active' );
		$action = $active ? 'activate' : 'deactivate';
		$failed = array();

		// Jetpack carries My Jetpack and is never switched off here, so while it is active no
		// batch can take this page with it. Without it, any plugin in the batch might be the last
		// carrier, and checking them one by one lets a batch switch off every carrier in turn.
		$plugins_refused = ! $active && Main_Features::PLUGIN_ACTIVE !== Main_Features::get_plugin_status( Product::JETPACK_PLUGIN_SLUG )
			? new WP_Error( 'not_allowed', __( 'Plugins can only be deactivated together while the Jetpack plugin is active. Deactivate them one at a time instead.', 'jetpack-my-jetpack' ) )
			: null;

		foreach ( array_unique( (array) $request->get_param( 'plugins' ) ) as $slug ) {
			$result = $plugins_refused ? $plugins_refused : self::refuse_deactivation( $slug, $action );
			$result = $result ? $result : self::run( $slug, $action );

			if ( is_wp_error( $result ) ) {
				$failed[] = array(
					'type'    => 'plugin',
					'slug'    => $slug,
					'message' => $result->get_error_message(),
				);
			}
		}

		$modules_refused = current_user_can( 'jetpack_manage_modules' )
			? null
			: new WP_Error( 'not_allowed', __( 'You are not allowed to manage Jetpack modules on this site.', 'jetpack-my-jetpack' ) );

		foreach ( array_unique( (array) $request->get_param( 'modules' ) ) as $slug ) {
			$result = $modules_refused ? $modules_refused : self::switch_module( $slug, $active );

			if ( is_wp_error( $result ) ) {
				$failed[] = array(
					'type'    => 'module',
					'slug'    => $slug,
					'message' => $result->get_error_message(),
				);
			}
		}

		return rest_ensure_response(
			array(
				'state'  => Main_Features::get_state(),
				'failed' => $failed,
			)
		);
	}

	/**
	 * Switch one Jetpack module, with the checks Jetpack's own module route makes.
	 *
	 * @param string $slug   Module slug.
	 * @param bool   $active Whether to switch it on.
	 * @return true|WP_Error
	 */
	private static function switch_module( $slug, $active ) {
		$modules = new Modules();

		// Not is_module(): with no modules on offer, its allow-list is skipped and any slug passes.
		if ( ! in_array( $slug, (array) $modules->get_available(), true ) ) {
			return new WP_Error( 'not_found', __( 'That Jetpack module was not found.', 'jetpack-my-jetpack' ) );
		}

		// Already where it was asked to be: nothing to do, as with plugins above.
		if ( $modules->is_active( $slug ) === $active ) {
			return true;
		}

		// Gotcha: activate() still redirects and exits when a legacy plugin it replaces (such as
		// stats/stats.php) is active, which ends this request, as it does Jetpack's own route.
		$switched = $active ? $modules->activate( $slug, false, false ) : $modules->deactivate( $slug );

		// Saved, but a jetpack_active_modules callback can still hold it where it was.
		if ( ( $switched || ! $active ) && $modules->is_active( $slug ) !== $active ) {
			return $active
				? new WP_Error( 'module_forced', __( 'Stays off: disabled by your host or site administrator.', 'jetpack-my-jetpack' ) )
				: new WP_Error( 'module_forced', __( 'Stays on: enabled by your host or site administrator.', 'jetpack-my-jetpack' ) );
		}

		// Read after a feature name, alone or in a list; a retry rarely helps, so none is offered.
		if ( ! $switched ) {
			return $active
				? new WP_Error( 'switch_failed', __( 'Could not be switched on. It may need a Jetpack connection, or a plan that includes it.', 'jetpack-my-jetpack' ) )
				: new WP_Error( 'switch_failed', __( 'Could not be switched off.', 'jetpack-my-jetpack' ) );
		}

		return true;
	}

	/**
	 * Refuse to switch off Jetpack, or the plugin serving this page when nothing else carries My Jetpack.
	 *
	 * @param string $slug   WordPress.org plugin slug.
	 * @param string $action One of install, activate or deactivate.
	 * @return WP_Error|null The refusal, or null when the action may go ahead.
	 */
	private static function refuse_deactivation( $slug, $action ) {
		if ( 'deactivate' !== $action ) {
			return null;
		}

		// The autoloader picks one of the active carriers, so the one serving this request is
		// refused only when nothing else could take over on the next load.
		if ( Product::JETPACK_PLUGIN_SLUG === $slug
			|| ( Main_Features::is_hosting_plugin( $slug )
				&& Main_Features::is_only_my_jetpack_provider( Main_Features::get_hosting_plugin_slug() ) ) ) {
			return new WP_Error(
				'not_allowed',
				__( 'This plugin runs the page you are on, so it cannot be deactivated from here.', 'jetpack-my-jetpack' ),
				array( 'status' => 400 )
			);
		}

		return null;
	}

	/**
	 * Carry out the action on the plugin, through the product that owns it where there is one.
	 *
	 * @param string $slug   WordPress.org plugin slug.
	 * @param string $action One of install, activate or deactivate.
	 * @return true|WP_Error
	 */
	private static function run( $slug, $action ) {
		if ( ! function_exists( 'activate_plugin' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		$product_class = Main_Features::get_product_class_for_plugin( $slug );
		$file          = Main_Features::get_plugin_file( $slug, $product_class );

		if ( 'deactivate' === $action ) {
			if ( ! $file ) {
				return new WP_Error( 'not_installed', __( 'That plugin is not installed.', 'jetpack-my-jetpack' ) );
			}

			// The product knows what else it switched on, such as the Jetpack module behind it.
			if ( $product_class ) {
				$deactivated = $product_class::deactivate();
				return is_wp_error( $deactivated ) ? $deactivated : true;
			}

			deactivate_plugins( $file );
			return true;
		}

		// Already on: nothing to do, and re-running the product's activation step would
		// reset what it set the first time — Boost's jb_get_started, Search's Instant
		// Search. Reachable whenever a request is retried.
		if ( $file && Main_Features::PLUGIN_ACTIVE === Main_Features::get_plugin_status( $slug, $product_class ) ) {
			return true;
		}

		// Installing what is already here would put a second copy beside it, which is what
		// a plugin in a -dev folder looks like to a lookup by slug.
		if ( 'install' === $action && ! $file ) {
			$installed = Plugins_Installer::install_and_activate_plugin( $slug );

			if ( is_wp_error( $installed ) ) {
				return $installed;
			}
		} else {
			if ( ! $file ) {
				return new WP_Error( 'not_installed', __( 'That plugin is not installed.', 'jetpack-my-jetpack' ) );
			}

			$activated = activate_plugin( $file );

			if ( is_wp_error( $activated ) ) {
				return $activated;
			}
		}

		// A plugin alone is not the whole product: Search still has to switch Instant Search
		// on, Boost to mark itself started, and the Hybrid products to enable their module.
		// A refusal is not fatal here — the plugin is on either way, so failing the request
		// would contradict the state it returns and invite a retry of what already happened.
		if ( $product_class ) {
			$product_class::do_product_specific_activation( true );
		}

		return true;
	}
}
