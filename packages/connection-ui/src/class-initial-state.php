<?php
/**
 * The React initial state.
 *
 * @package automattic/jetpack-connection-ui
 */

namespace Automattic\Jetpack\ConnectionUI;

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Connection\Plugin_Storage;
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
			'connectionStatus' => REST_Connector::connection_status( false ) + array( 'isRefreshing' => false ),
			'plugins'          => array(
				'all' => $this->get_plugins(),
			),
		);
	}

	/**
	 * Retrieve the list of plugins, and mark them as connected/disconnected.
	 *
	 * @return array
	 */
	private function get_plugins() {
		$plugins          = Plugin_Storage::get_all();
		$disabled_plugins = Plugin_Storage::get_all_disabled_plugins();

		if ( is_wp_error( $plugins ) ) {
			$plugins = array();
		}

		array_walk(
			$plugins,
			function ( &$plugin, $slug ) use ( $disabled_plugins ) {
				$plugin = array(
					'slug'        => $slug,
					'name'        => empty( $plugin['name'] ) ? $slug : $plugin['name'],
					'urlInfo'     => empty( $plugin['url_info'] ) ? null : $plugin['url_info'],
					'isConnected' => ! in_array( $slug, $disabled_plugins, true ),
				);
			}
		);

		return array_values( $plugins );
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
