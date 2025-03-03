<?php
/**
 * Sets up the Historically Active Modules rest api endpoint and helper functions
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use WP_Error;

/**
 * Registers REST route for updating historically active modules
 * and includes all helper functions for triggering an update elsewhere
 */
class Historically_Active_Modules {
	public const UPDATE_HISTORICALLY_ACTIVE_JETPACK_MODULES_KEY = 'update-historically-active-jetpack-modules';

	/**
	 * Constructor
	 */
	public function __construct() {
		register_rest_route(
			'my-jetpack/v1',
			'site/update-historically-active-modules',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::rest_trigger_historically_active_modules_update',
				'permission_callback' => __CLASS__ . '::permissions_callback',
			)
		);
	}

	/**
	 * Check user capabilities to access historically active modules.
	 *
	 * @access public
	 * @static
	 *
	 * @return true|WP_Error
	 */
	public static function permissions_callback() {
		return current_user_can( 'edit_posts' );
	}

	/**
	 * Update historically active Jetpack plugins
	 * Historically active is defined as the Jetpack plugins that are installed and active with the required connections
	 * This array will consist of any plugins that were active at one point in time and are still enabled on the site
	 *
	 * @return void
	 */
	public static function update_historically_active_jetpack_modules() {
		$historically_active_modules = \Jetpack_Options::get_option( 'historically_active_modules', array() );
		$products                    = Products::get_products();
		$product_classes             = Products::get_products_classes();

		foreach ( $products as $product ) {
			$product_slug = $product['slug'];
			$status       = $product_classes[ $product_slug ]::get_status();
			// We want to leave modules in the array if they've been active in the past
			// and were not manually disabled by the user.
			if ( in_array( $status, Products::$broken_module_statuses, true ) ) {
				continue;
			}

			// If the module is active and not already in the array, add it
			if (
				in_array( $status, Products::$active_module_statuses, true ) &&
				! in_array( $product_slug, $historically_active_modules, true )
			) {
					$historically_active_modules[] = $product_slug;
			}

			// If the module has been disabled due to a manual user action,
			// or because of a missing plan error, remove it from the array
			if ( in_array( $status, Products::$disabled_module_statuses, true ) ) {
				$historically_active_modules = array_values( array_diff( $historically_active_modules, array( $product_slug ) ) );
			}
		}

		\Jetpack_Options::update_option( 'historically_active_modules', array_unique( $historically_active_modules ) );
	}

	/**
	 * REST API endpoint to trigger an update to the historically active Jetpack modules
	 *
	 * @return WP_Error|\WP_REST_Response
	 */
	public static function rest_trigger_historically_active_modules_update() {
		self::update_historically_active_jetpack_modules();
		$historically_active_modules = \Jetpack_Options::get_option( 'historically_active_modules', array() );
		return rest_ensure_response( $historically_active_modules );
	}

	/**
	 * Set transient to queue an update to the historically active Jetpack modules on the next wp-admin load
	 *
	 * @param string $plugin The plugin that triggered the update. This will be present if the function was queued by a plugin activation.
	 *
	 * @return void
	 */
	public static function queue_historically_active_jetpack_modules_update( $plugin = null ) {
		$plugin_filenames = Products::get_all_plugin_filenames();

		if ( ! $plugin || in_array( $plugin, $plugin_filenames, true ) ) {
			set_transient( self::UPDATE_HISTORICALLY_ACTIVE_JETPACK_MODULES_KEY, true );
		}
	}
}
