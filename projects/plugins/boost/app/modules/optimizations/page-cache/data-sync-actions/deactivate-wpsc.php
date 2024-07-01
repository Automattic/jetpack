<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Data_Sync_Actions;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Data_Sync_Action;

/**
 * Cache Action: Disable Super Cache
 */
class Deactivate_WPSC implements Data_Sync_Action {

	/**
	 * Handles the action logic.
	 *
	 * @param mixed                 $_data    JSON Data passed to the action.
	 * @param null|\WP_REST_Request $_request The request object.
	 */
	public function handle( $_data = null, $_request = null ) {
		// Super Cache will define WPCACHEHOME if it's active.
		if ( ! defined( 'WPCACHEHOME' ) ) {
			return true;
		}

		// Find the plugin base path for super cache.
		$super_cache_dir = basename( WPCACHEHOME );
		$plugin          = $super_cache_dir . '/wp-cache.php';

		// Load the necessary files to deactivate the plugin.
		require_once ABSPATH . 'wp-admin/includes/misc.php';
		require_once ABSPATH . 'wp-admin/includes/file.php';
		deactivate_plugins( $plugin );

		$success = ! is_plugin_active( $plugin );

		return $success;
	}
}
