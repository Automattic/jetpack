<?php

namespace Automattic\Jetpack_Boost\Lib\Critical_CSS;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Data_Sync_Action;

/**
 * Critical CSS Action: request regeneration.
 */
class Critical_CSS_Regenerate_Action implements Data_Sync_Action {

	/**
	 * Handles the action logic.
	 *
	 * @param mixed            $data    JSON Data passed to the action.
	 * @param \WP_REST_Request $request The request object.
	 */
	public function handle( $_data, $_request ) {
		$regenerate = new Regenerate();
		$regenerate->start();

		$state = $regenerate->get_state();

		return array(
			'success' => ! $state->has_errors(),
			'state'   => $state,
		);
	}
}
