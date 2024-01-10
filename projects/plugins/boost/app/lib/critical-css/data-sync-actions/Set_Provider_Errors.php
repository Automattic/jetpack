<?php

namespace Automattic\Jetpack_Boost\Lib\Critical_CSS\Data_Sync_Actions;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Data_Sync_Action;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_State;

/**
 * Critical CSS Action: Store errors for a provider.
 */
class Set_Provider_Errors implements Data_Sync_Action {
	/**
	 * Handles the action logic.
	 *
	 * @param mixed            $data    JSON Data passed to the action.
	 * @param \WP_REST_Request $request The request object.
	 */
	public function handle( $data, $_request ) {
		if ( empty( $data['key'] ) || empty( $data['errors'] ) ) {
			return WP_Error( 'invalid_data', 'Invalid data' );
		}

		$provider_key = sanitize_key( $data['key'] );
		$errors       = $data['errors'];

		$state = new Critical_CSS_State();
		$state->set_provider_errors( $provider_key, $errors );
		$state->save();

		return array(
			'success' => true,
			'state'   => jetpack_boost_ds_get( 'critical_css_state' ),
		);
	}
}
