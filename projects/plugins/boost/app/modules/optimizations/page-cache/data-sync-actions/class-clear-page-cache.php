<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Data_Sync_Actions;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Data_Sync_Action;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Boost_Cache;

/**
 * Page Cache: Clear page cache
 */
class Clear_Page_Cache implements Data_Sync_Action {

	/**
	 * Handles the action logic.
	 *
	 * @param mixed            $_data    JSON Data passed to the action.
	 * @param \WP_REST_Request $_request The request object.
	 */
	public function handle( $_data, $_request ) {
		$cache  = new Boost_Cache();
		$delete = $cache->delete_recursive( home_url() );

		if ( $delete === null || is_wp_error( $delete ) ) {
			return array(
				'message' => __( 'Cache already cleared.', 'jetpack-boost' ),
			);
		}

		if ( $delete ) {
			return array(
				'message' => __( 'Cache cleared.', 'jetpack-boost' ),
			);
		}

		return new \WP_Error( 'unable-to-clear-cache', __( 'Unable to clear cache.', 'jetpack-boost' ) );
	}
}
