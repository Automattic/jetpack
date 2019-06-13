<?php
namespace Automattic\Jetpack\Tracking;

use Automattic\Jetpack\Tracking;

class Jetpack_Usage {

	private $tracking;

	function init() {
		$this->tracking = new Tracking( 'jetpack' );

		// For tracking stuff via js/ajax
		add_action( 'admin_enqueue_scripts', array( $this->tracking, 'enqueue_tracks_scripts' ) );

		add_action( 'jetpack_activate_module', array( $this, 'track_activate_module' ), 1, 1 );
		add_action( 'jetpack_deactivate_module', array( $this, 'track_deactivate_module' ), 1, 1 );
		add_action( 'jetpack_user_authorized', array( $this, 'track_user_linked' ) );
		add_action( 'wp_login_failed', array( $this, 'track_failed_login_attempts' ) );

		// Track that we've begun verifying the previously generated secret.
		add_action( 'jetpack_verify_secrets_begin', array( $this, 'track_jetpack_verify_secrets_begin' ), 10, 2 );
		add_action( 'jetpack_verify_secrets_success', array( $this, 'track_jetpack_verify_secrets_success' ), 10, 2 );
		add_action( 'jetpack_verify_secrets_fail', array( $this, 'track_jetpack_verify_secrets_fail' ), 10, 3 );

		// Universal ajax callback for all tracking events triggered via js
		add_action( 'wp_ajax_jetpack_tracks', array( $this, 'jetpack_admin_ajax_tracks_callback' ) );

		add_action( 'jetpack_verify_api_authorization_request_error_double_encode', array( $this, 'jetpack_verify_api_authorization_request_error_double_encode' ) );
		add_action( 'jpc_register_fail', array( $this, 'jpc_register_fail' ) );
		add_action( 'jpc_register_success', array( $this, 'jpc_register_success' ) );
	}

	/* Activated module */
	public function track_activate_module( $module ) {
		$this->tracking->record_user_event( 'module_activated', array( 'module' => $module ) );
	}

	/* Deactivated module */
	public function track_deactivate_module( $module ) {
		$this->tracking->record_user_event( 'module_deactivated', array( 'module' => $module ) );
	}

	/* User has linked their account */
	public function track_user_linked() {
		$user_id = get_current_user_id();
		$anon_id = get_user_meta( $user_id, 'jetpack_tracks_anon_id', true );

		if ( $anon_id ) {
			$this->tracking->record_user_event( '_aliasUser', array( 'anonId' => $anon_id ) );
			delete_user_meta( $user_id, 'jetpack_tracks_anon_id' );
			if ( ! headers_sent() ) {
				setcookie( 'tk_ai', 'expired', time() - 1000 );
			}
		}

		$wpcom_user_data = self::get_connected_user_data( $user_id );
		update_user_meta( $user_id, 'jetpack_tracks_wpcom_id', $wpcom_user_data['ID'] );

		$this->tracking->record_user_event( 'wpa_user_linked', array() );
	}

	/**
	 * Track that we've begun verifying the secrets.
	 *
	 * @access public
	 *
	 * @param string $action Type of secret (one of 'register', 'authorize', 'publicize').
	 * @param \WP_User $user The user object.
	 */
	public function track_jetpack_verify_secrets_begin( $action, $user ) {
		$this->tracking->record_user_event( "jpc_verify_{$action}_begin", array(), $user );
	}

	/**
	 * Track that we've succeeded in verifying the secrets.
	 *
	 * @access public
	 *
	 * @param string $action Type of secret (one of 'register', 'authorize', 'publicize').
	 * @param \WP_User $user The user object.
	 */
	public function track_jetpack_verify_secrets_success( $action, $user ) {
		$this->tracking->record_user_event( "jpc_verify_{$action}_success", array(), $user );
	}

	/**
	 * Track that we've failed verifying the secrets.
	 *
	 * @access public
	 *
	 * @param string $action Type of secret (one of 'register', 'authorize', 'publicize').
	 * @param \WP_User $user The user object.
	 * @param \WP_Error $error Error object.
	 */
	public function track_jetpack_verify_secrets_fail( $action, $user, $error ) {
		$this->tracking->record_user_event(
			"jpc_verify_{$action}_fail",
			array(
				'error_code'    => $error->get_error_code(),
				'error_message' => $error->get_error_message(),
			),
			$user
		);
	}

	/* Failed login attempts */
	public function track_failed_login_attempts( $login ) {
		require_once JETPACK__PLUGIN_DIR . 'modules/protect/shared-functions.php';
		$this->tracking->record_user_event(
			'failed_login',
			array(
				'origin_ip' => jetpack_protect_get_ip(),
				'login'     => $login,
			)
		);
	}

	function jpc_register_fail( $error, $registered ) {
		$this->tracking->record_user_event( 'jpc_register_fail', array(
			'error_code'    => $error,
			'error_message' => $registered->get_error_message()
		) );
	}

	function jpc_register_success( $from ) {
		$this->tracking->record_user_event( 'jpc_register_success', array(
			'from' => $from
		) );
	}

	function jetpack_verify_api_authorization_request_error_double_encode() {
		$this->tracking->record_user_event( 'error_double_encode' );
	}

	function jetpack_admin_ajax_tracks_callback() {
		// Check for nonce
		if ( ! isset( $_REQUEST['tracksNonce'] ) || ! wp_verify_nonce( $_REQUEST['tracksNonce'], 'jp-tracks-ajax-nonce' ) ) {
			wp_die( 'Permissions check failed.' );
		}

		if ( ! isset( $_REQUEST['tracksEventName'] ) || ! isset( $_REQUEST['tracksEventType'] ) ) {
			wp_die( 'No valid event name or type.' );
		}

		$tracks_data = array();
		if ( 'click' === $_REQUEST['tracksEventType'] && isset( $_REQUEST['tracksEventProp'] ) ) {
			if ( is_array( $_REQUEST['tracksEventProp'] ) ) {
				$tracks_data = $_REQUEST['tracksEventProp'];
			} else {
				$tracks_data = array( 'clicked' => $_REQUEST['tracksEventProp'] );
			}
		}

		$this->tracking->record_user_event( $_REQUEST['tracksEventName'], $tracks_data );
		wp_send_json_success();
		wp_die();
	}
}
