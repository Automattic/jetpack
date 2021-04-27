<?php
/**
 * The React initial state.
 *
 * @package automattic/jetpack-connection-ui
 */

namespace Automattic\Jetpack\ConnectionUI;

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Connection\REST_Connector;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Device_Detection\User_Agent_Info;

/**
 * The React initial state.
 */
class Initial_State {

	/**
	 * The connection manager object.
	 *
	 * @var Manager
	 */
	private $manager;

	/**
	 * The constructor.
	 */
	public function __construct() {
		$this->manager = new Manager();
	}

	/**
	 * Get the initial state data.
	 *
	 * @return array
	 */
	private function get_data() {
		global $is_safari;

		return array(
			'connectionStatus' => REST_Connector::connection_status( false ),
			'API'              => array(
				'WP_API_root'       => esc_url_raw( rest_url() ),
				'WP_API_nonce'      => wp_create_nonce( 'wp_rest' ),
				'registrationNonce' => wp_create_nonce( 'jetpack-registration-nonce' ),
			),
			'connectionData'   => array(
				'doNotUseConnectionIframe' => $is_safari || User_Agent_Info::is_opera_desktop() || Constants::is_true( 'JETPACK_SHOULD_NOT_USE_CONNECTION_IFRAME' ),
				'authorizationUrl'         => ( $this->manager->is_connected() && ! $this->manager->is_user_connected() )
					? $this->manager->get_authorization_url( null, admin_url( 'tools.php?page=wpcom-connection-manager' ) )
					: null,
			),
		);
	}

	/**
	 * Render the initial state into a JavaScript variable.
	 *
	 * @return string
	 */
	public function render() {
		return 'var CUI_INITIAL_STATE=JSON.parse(decodeURIComponent("' . rawurlencode( wp_json_encode( $this->get_data() ) ) . '"));';
	}

}
