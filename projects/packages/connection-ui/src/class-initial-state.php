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
			'IDC'    => $this->get_idc_data(),
		);
	}

	/**
	 * Get the IDC data for initial state.
	 *
	 * @return array
	 */
	private function get_idc_data() {
		$has_idc = Identity_Crisis::has_identity_crisis();

		$idc_data = array(
			'hasIDC' => $has_idc,
		);

		if ( ! $has_idc ) {
			return $idc_data;
		}

		$data = Identity_Crisis::check_identity_crisis();

		$idc_data['wpcomHomeUrl'] = $data['wpcom_home'];
		$idc_data['currentUrl']   = $data['home'];
		$idc_data['redirectUri']  = static::CONNECTION_MANAGER_URI;

		return $idc_data;
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
