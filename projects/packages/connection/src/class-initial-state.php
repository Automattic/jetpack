<?php
/**
 * The React initial state.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Status;

/**
 * The React initial state.
 */
class Initial_State {

	/**
	 * Get the initial state data.
	 *
	 * @return array
	 */
	private static function get_data() {
		global $wp_version;

		$status = new Status();

		return array(
			'apiRoot'            => esc_url_raw( rest_url() ),
			'apiNonce'           => wp_create_nonce( 'wp_rest' ),
			'registrationNonce'  => wp_create_nonce( 'jetpack-registration-nonce' ),
			'connectionStatus'   => REST_Connector::connection_status( false ),
			'userConnectionData' => REST_Connector::get_user_connection_data( false ),
			'connectedPlugins'   => REST_Connector::get_connection_plugins( false ),
			'wpVersion'          => $wp_version,
			'siteSuffix'         => $status->get_site_suffix(),
			'connectionErrors'   => Error_Handler::get_instance()->get_verified_errors(),
			'isOfflineMode'      => $status->is_offline_mode(),
			'calypsoEnv'         => ( new Status\Host() )->get_calypso_env(),
		);
	}

	/**
	 * Render the initial state into a JavaScript variable.
	 *
	 * @return string
	 */
	public static function render() {
		return 'var JP_CONNECTION_INITIAL_STATE; typeof JP_CONNECTION_INITIAL_STATE === "object" || (JP_CONNECTION_INITIAL_STATE = JSON.parse(decodeURIComponent("' . rawurlencode( wp_json_encode( self::get_data() ) ) . '")));';
	}

	/**
	 * Render the initial state using an inline script.
	 *
	 * @param string $handle The JS script handle.
	 *
	 * @return void
	 */
	public static function render_script( $handle ) {
		wp_add_inline_script( $handle, static::render(), 'before' );
	}
}
