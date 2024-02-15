<?php

namespace Automattic\Jetpack_Boost\Modules\Page_Cache\Data_Sync_Actions;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Data_Sync_Action;
use Automattic\Jetpack_Boost\Modules\Page_Cache\Page_Cache_Setup;

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
		return Page_Cache_Setup::run_setup();
	}
}
