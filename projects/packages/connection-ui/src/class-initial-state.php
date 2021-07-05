<?php
/**
 * The React initial state.
 *
 * @package automattic/jetpack-connection-ui
 */

namespace Automattic\Jetpack\ConnectionUI;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Device_Detection\User_Agent_Info;

/**
 * The React initial state.
 */
class Initial_State {

	/**
	 * Get the initial state data.
	 *
	 * @return array
	 */
	private function get_data() {
		return array(
			'API' => array(
				'WP_API_root'       => esc_url_raw( rest_url() ),
				'WP_API_nonce'      => wp_create_nonce( 'wp_rest' ),
				'registrationNonce' => wp_create_nonce( 'jetpack-registration-nonce' ),
			),
		);
	}

	/**
	 * Whether we can the connection iframe.
	 *
	 * @return bool
	 */
	private function can_use_connection_iframe() {
		global $is_safari;

		/**
		 * Filters whether the connection manager should use the iframe authorization
		 * flow instead of the regular redirect-based flow.
		 *
		 * @since 8.3.0
		 *
		 * @param Boolean $is_iframe_flow_used should the iframe flow be used, defaults to false.
		 */
		$iframe_flow = apply_filters( 'jetpack_use_iframe_authorization_flow', false );

		if ( ! $iframe_flow ) {
			return false;
		}

		return ! $is_safari && ! User_Agent_Info::is_opera_desktop() && ! Constants::is_true( 'JETPACK_SHOULD_NOT_USE_CONNECTION_IFRAME' );
	}

	/**
	 * Render the initial state into a JavaScript variable.
	 *
	 * @return string
	 */
	public function render() {
		add_action( 'jetpack_use_iframe_authorization_flow', '__return_true' );

		return 'var CUI_INITIAL_STATE=JSON.parse(decodeURIComponent("' . rawurlencode( wp_json_encode( $this->get_data() ) ) . '"));';
	}

}
