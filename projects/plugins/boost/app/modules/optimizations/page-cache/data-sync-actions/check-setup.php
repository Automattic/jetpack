<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Data_Sync_Actions;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Data_Sync_Action;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Page_Cache_Setup;

/**
 * Critical CSS Action: request regeneration.
 */
class Check_Setup implements Data_Sync_Action {

	/**
	 * Handles the action logic.
	 *
	 * @param mixed            $_data    JSON Data passed to the action.
	 * @param \WP_REST_Request $_request The request object.
	 */
	public function handle( $_data, $_request ) {
		$setup_result = Page_Cache_Setup::is_setup_working();

		if ( is_wp_error( $setup_result ) ) {
			return $setup_result;
		}

		return true;
	}
}
