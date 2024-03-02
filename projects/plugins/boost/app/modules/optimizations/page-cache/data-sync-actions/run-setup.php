<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Data_Sync_Actions;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Data_Sync_Action;
use Automattic\Jetpack_Boost\Lib\Analytics;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Garbage_Collection;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Page_Cache_Setup;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Boost_Cache_Settings;

/**
 * Critical CSS Action: request regeneration.
 */
class Run_Setup implements Data_Sync_Action {

	/**
	 * Handles the action logic.
	 *
	 * @param mixed            $_data    JSON Data passed to the action.
	 * @param \WP_REST_Request $_request The request object.
	 */
	public function handle( $_data, $_request ) {
		$setup_result = Page_Cache_Setup::run_setup();

		if ( is_wp_error( $setup_result ) ) {
			Analytics::record_user_event( 'page_cache_setup_failed', array( 'error_code' => $setup_result->get_error_code() ) );
			return $setup_result;
		}

		Analytics::record_user_event( 'page_cache_setup_succeeded' );

		Garbage_Collection::activate();
		Boost_Cache_Settings::get_instance()->set( array( 'enabled' => true ) );
		return true;
	}
}
