<?php
/**
 * The React initial state.
 *
 * @package automattic/jetpack-connection-ui
 */

namespace Automattic\Jetpack\ConnectionUI;

use Automattic\Jetpack\Identity_Crisis;
use Jetpack_Tracks_Client;

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
		$current_screen = get_current_screen();

		return array(
			'API'                 => array(
				'WP_API_root'       => esc_url_raw( rest_url() ),
				'WP_API_nonce'      => wp_create_nonce( 'wp_rest' ),
				'registrationNonce' => wp_create_nonce( 'jetpack-registration-nonce' ),
			),
			'assets'              => array(
				'buildUrl' => plugins_url( 'build/', __DIR__ ),
			),
			'IDC'                 => $this->get_idc_data(),
			'tracksUserData'      => Jetpack_Tracks_Client::get_connected_user_tracks_identity(),
			'tracksEventData'     => array(
				'isAdmin'       => current_user_can( 'jetpack_disconnect' ),
				'currentScreen' => $current_screen ? $current_screen->id : false,
			),
			'canManageConnection' => current_user_can( 'jetpack_disconnect' ),
		);
	}

	/**
	 * Get the IDC data for initial state.
	 *
	 * @return array
	 */
	private function get_idc_data() {
		$return_data = array(
			'hasIDC'              => Identity_Crisis::has_identity_crisis(),
			'isAdmin'             => current_user_can( 'jetpack_disconnect' ),
			'isSafeModeConfirmed' => Identity_Crisis::safe_mode_is_confirmed(),
		);

		if ( ! $return_data['hasIDC'] || ! $return_data['isAdmin'] ) {
			return $return_data;
		}

		$idc_data = Identity_Crisis::check_identity_crisis();
		$idc_urls = Identity_Crisis::get_mismatched_urls();

		if ( ! $idc_data || ! $idc_urls ) {
			return $return_data;
		}

		$return_data['wpcomHomeUrl'] = $idc_urls['wpcom_url'];
		$return_data['currentUrl']   = $idc_urls['current_url'];
		$return_data['redirectUri']  = static::CONNECTION_MANAGER_URI;

		return $return_data;
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
