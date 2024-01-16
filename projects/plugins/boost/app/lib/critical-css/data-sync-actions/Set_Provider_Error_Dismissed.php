<?php

namespace Automattic\Jetpack_Boost\Lib\Critical_CSS\Data_Sync_Actions;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Data_Sync_Action;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_State;

/**
 * Critical CSS Action: Update whether or not to show a provider which is in an error state.
 */
class Set_Provider_Error_Dismissed implements Data_Sync_Action {
	/**
	 * Handles the action logic.
	 *
	 * @param mixed            $data     JSON Data passed to the action.
	 * @param \WP_REST_Request $_request The request object.
	 */
	public function handle( $data, $_request ) {
		$state = new Critical_CSS_State();

		if ( empty( $data['key'] ) ) {
			return array(
				'success' => false,
				'state'   => $state->get(),
				'error'   => 'Invalid data',
			);
		}

		$provider_key = sanitize_key( $data['key'] );
		$dismissed    = ! empty( $data['dismissed'] );

		$state->set_provider_error_dismissed( $provider_key, $dismissed );
		$state->save();

		return array(
			'success' => true,
			'state'   => $state->get(),
		);
	}
}
