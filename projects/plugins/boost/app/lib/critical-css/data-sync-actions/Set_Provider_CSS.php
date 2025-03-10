<?php

namespace Automattic\Jetpack_Boost\Lib\Critical_CSS\Data_Sync_Actions;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Data_Sync_Action;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_State;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_Storage;

/**
 * Critical CSS Action: Set CSS for a provider.
 */
class Set_Provider_CSS implements Data_Sync_Action {

	/**
	 * Handles the action logic.
	 *
	 * @param mixed            $data     JSON Data passed to the action.
	 * @param \WP_REST_Request $_request The request object.
	 */
	public function handle( $data, $_request ) {
		$state = new Critical_CSS_State();

		if ( empty( $data['key'] ) || empty( $data['css'] ) ) {
			return array(
				'success' => false,
				'state'   => $state->get(),
				'error'   => 'Invalid data',
			);
		}

		$provider_key = sanitize_key( $data['key'] );
		$css          = $this->desanitize_css( $data['css'] );

		$storage = new Critical_CSS_Storage();
		$storage->store_css( $provider_key, $css );

		$state->set_provider_success( $provider_key );
		$state->save();

		return array(
			'success' => true,
			'state'   => $state->get(),
		);
	}

	/**
	 * Desanitizes the CSS.
	 *
	 * @param string $css The CSS to desanitize.
	 * @return string The desanitized CSS.
	 */
	private function desanitize_css( $css ) {
		return str_replace( '__JB_XMLNS__', 'xmlns', $css );
	}
}
