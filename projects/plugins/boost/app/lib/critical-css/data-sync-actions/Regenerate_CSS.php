<?php

namespace Automattic\Jetpack_Boost\Lib\Critical_CSS\Data_Sync_Actions;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Data_Sync_Action;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Regenerate;

/**
 * Critical CSS Action: request regeneration.
 */
class Regenerate_CSS implements Data_Sync_Action {

	/**
	 * Handles the action logic.
	 *
	 * @param mixed            $_data    JSON Data passed to the action.
	 * @param \WP_REST_Request $_request The request object.
	 */
	public function handle( $_data, $_request ) {
		$regenerate = new Regenerate();
		$regenerate->start();

		$state = $regenerate->get_state();

		return array(
			'success' => ! $state->has_errors(),
			'state'   => $state->get(),
			'errors'  => $state->get_error_message(),
		);
	}
}
