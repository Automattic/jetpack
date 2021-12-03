<?php
/**
 * The React initial state.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

/**
 * The React initial state.
 */
class Initial_State {

	/**
	 * Whether the initial state was already rendered
	 *
	 * @var boolean
	 */
	private static $rendered = false;

	/**
	 * Get the initial state data.
	 *
	 * @return array
	 */
	private static function get_data() {
		return array(
			'WP_API_root'       => esc_url_raw( rest_url() ),
			'WP_API_nonce'      => wp_create_nonce( 'wp_rest' ),
			'registrationNonce' => wp_create_nonce( 'jetpack-registration-nonce' ),
			'connectionStatus'  => REST_Connector::connection_status( false ),
		);
	}

	/**
	 * Render the initial state into a JavaScript variable.
	 *
	 * @return string
	 */
	public static function render() {
		if ( self::$rendered ) {
			return null;
		}
		self::$rendered = true;
		return 'var JP_CONNECTION_INITIAL_STATE=JSON.parse(decodeURIComponent("' . rawurlencode( wp_json_encode( self::get_data() ) ) . '"));';
	}

}
