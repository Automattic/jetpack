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
	 * Register the route.
	 */
	public function __construct() {
		register_rest_route(
			'my-jetpack/v1',
			'site/features/plugin',
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
	 * Install, activate or deactivate one plugin from the feature map.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return \WP_REST_Response|WP_Error The Features tab's fresh state, or an error.
	 */
	public static function switch_plugin( $request ) {
		$slug   = $request->get_param( 'plugin' );
		$action = $request->get_param( 'action' );

		// The Features tab runs inside Jetpack's own admin; switching Jetpack off from it
		// would pull the page out from under itself.
		if ( Product::JETPACK_PLUGIN_SLUG === $slug && 'deactivate' === $action ) {
			return new WP_Error( 'not_allowed', __( 'Jetpack cannot be deactivated from here.', 'jetpack-my-jetpack' ), array( 'status' => 400 ) );
		}

		if ( 'install' === $action && ! current_user_can( 'install_plugins' ) ) {
			return new WP_Error( 'not_allowed', __( 'You are not allowed to install plugins on this site.', 'jetpack-my-jetpack' ), array( 'status' => 403 ) );
		}

		$result = self::run( $slug, $action );

		if ( is_wp_error( $result ) ) {
			$result->add_data( array( 'status' => 400 ) );
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
		if ( $product_class ) {
			$result = $product_class::do_product_specific_activation( true );

			if ( is_wp_error( $result ) ) {
				return $result;
			}
		}

		return true;
	}
}
