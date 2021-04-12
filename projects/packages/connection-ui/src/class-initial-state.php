<?php
/**
 * The React initial state.
 *
 * @package automattic/jetpack-connection-ui
 */

namespace Automattic\Jetpack\ConnectionUI;

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Connection\REST_Connector;

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
		return array(
			'connectionStatus' => REST_Connector::connection_status( false ),
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
