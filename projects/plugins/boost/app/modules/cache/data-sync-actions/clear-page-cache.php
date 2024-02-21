<?php

namespace Automattic\Jetpack_Boost\Modules\Page_Cache\Data_Sync_Actions;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Data_Sync_Action;
use Automattic\Jetpack_Boost\Modules\Page_Cache\Pre_WordPress\Boost_Cache;

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
		$cache = new Boost_Cache();
		return $cache->delete_cache();
	}
}
