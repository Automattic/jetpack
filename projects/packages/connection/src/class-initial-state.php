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
			'connectionErrors'   => Error_Handler::get_instance()->get_displayable_errors(),
			'isOfflineMode'      => $status->is_offline_mode(),
			'calypsoEnv'         => ( new Status\Host() )->get_calypso_env(),
		);
	}

	/**
	 * Set the connection script data.
	 *
	 * @param array $data The script data.
	 */
	public static function set_connection_script_data( $data ) {

		$data['connection'] = self::get_data();

		if ( empty( $data['site']['wpcom']['blog_id'] ) ) {
			$data['site']['wpcom']['blog_id'] = absint( \Jetpack_Options::get_option( 'id', 0 ) );
		}

		return $data;
	}

	/**
	 * Render the initial state into a JavaScript variable.
	 *
	 * @return string
	 */
	public static function render() {
		/*
		 * `window.jpTracksContext` is an intentionally minimal, Tracks-specific global used by the
		 * @automattic/jetpack-analytics package to read `blog_id` at event-fire time. It exists
		 * separately from `window.JetpackScriptData` because the analytics package is consumed in
		 * contexts (e.g. Boost frontend) where `JetpackScriptData` is not reliably available, and
		 * coupling the analytics package to that schema would widen its surface unnecessarily.
		 * When both are present, `JetpackScriptData.site.wpcom.blog_id` is populated via
		 * `set_connection_script_data()` above for other consumers.
		 */
		return 'var JP_CONNECTION_INITIAL_STATE; typeof JP_CONNECTION_INITIAL_STATE === "object" || (JP_CONNECTION_INITIAL_STATE = ' . wp_json_encode( self::get_data(), JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ) . ');'
			. sprintf( 'window.jpTracksContext = window.jpTracksContext || {}; window.jpTracksContext.blog_id = %s;', absint( \Jetpack_Options::get_option( 'id', 0 ) ) );
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
