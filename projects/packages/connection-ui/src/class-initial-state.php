<?php
/**
 * The React initial state.
 *
 * @package automattic/jetpack-connection-ui
 */

namespace Automattic\Jetpack\ConnectionUI;

use Automattic\Jetpack\Identity_Crisis;

/**
 * The React initial state.
 */
class Initial_State {

	const CONNECTION_MANAGER_URI = '/tools.php?page=wpcom-connection-manager';

	/**
	 * Get the initial state data.
	 *
	 * @return array
	 */
	private function get_data() {
		return array(
			'API'    => array(
				'WP_API_root'       => esc_url_raw( rest_url() ),
				'WP_API_nonce'      => wp_create_nonce( 'wp_rest' ),
				'registrationNonce' => wp_create_nonce( 'jetpack-registration-nonce' ),
			),
			'assets' => array(
				'buildUrl' => plugins_url( 'build/', __DIR__ ),
			),
			'IDC'    => array(
				'hasIDC'              => Identity_Crisis::has_identity_crisis(),
				'isSafeModeConfirmed' => Identity_Crisis::safe_mode_is_confirmed(),
				'canManageConnection' => current_user_can( 'jetpack_disconnect' ),
			),
		);
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
