<?php
/**
 * REST route that installs and switches the plugins behind the Features tab.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Plugins_Installer;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Installs, activates and deactivates the plugins in the feature map.
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

		// Switching off the last plugin carrying My Jetpack would pull this page out from
		// under itself. Which plugin that is varies: the autoloader picks one of however
		// many are active, so being the one serving the page is not enough to refuse —
		// another active plugin will simply take over on the next load.
		if ( 'deactivate' === $action
			&& ( Product::JETPACK_PLUGIN_SLUG === $slug
				|| ( Main_Features::is_hosting_plugin( $slug )
					&& Main_Features::is_only_my_jetpack_provider( Main_Features::get_hosting_plugin_slug() ) ) ) ) {
			return new WP_Error(
				'not_allowed',
				__( 'This plugin runs the page you are on, so it cannot be deactivated from here.', 'jetpack-my-jetpack' ),
				array( 'status' => 400 )
			);
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
