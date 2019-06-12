<?php
/**
 * Nosara Tracks for Jetpack
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Tracks\Client;

class Tracking {
	static $product_name  = 'jetpack';
	const PACKAGE_VERSION = '1.0';

	static function track_jetpack_usage() {
		if ( ! \Jetpack::jetpack_tos_agreed() ) {
			return;
		}

		// For tracking stuff via js/ajax
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_tracks_scripts' ) );

		add_action( 'jetpack_activate_module', array( __CLASS__, 'track_activate_module' ), 1, 1 );
		add_action( 'jetpack_deactivate_module', array( __CLASS__, 'track_deactivate_module' ), 1, 1 );
		add_action( 'jetpack_user_authorized', array( __CLASS__, 'track_user_linked' ) );
		add_action( 'wp_login_failed', array( __CLASS__, 'track_failed_login_attempts' ) );
	}

	static function enqueue_tracks_scripts() {
		wp_enqueue_script( 'jptracks', plugins_url( 'assets/tracks-ajax.js', __DIR__ ), array(), self::PACKAGE_VERSION, true );
		wp_localize_script(
			'jptracks',
			'jpTracksAJAX',
			array(
				'ajaxurl'            => admin_url( 'admin-ajax.php' ),
				'jpTracksAJAX_nonce' => wp_create_nonce( 'jp-tracks-ajax-nonce' ),
			)
		);
	}

	/* User has linked their account */
	static function track_user_linked() {
		$user_id = get_current_user_id();
		$anon_id = get_user_meta( $user_id, 'jetpack_tracks_anon_id', true );

		if ( $anon_id ) {
			self::record_user_event( '_aliasUser', array( 'anonId' => $anon_id ) );
			delete_user_meta( $user_id, 'jetpack_tracks_anon_id' );
			if ( ! headers_sent() ) {
				setcookie( 'tk_ai', 'expired', time() - 1000 );
			}
		}

		$wpcom_user_data = Jetpack::get_connected_user_data( $user_id );
		update_user_meta( $user_id, 'jetpack_tracks_wpcom_id', $wpcom_user_data['ID'] );

		self::record_user_event( 'wpa_user_linked', array() );
	}

	/* Activated module */
	static function track_activate_module( $module ) {
		self::record_user_event( 'module_activated', array( 'module' => $module ) );
	}

	/* Deactivated module */
	static function track_deactivate_module( $module ) {
		self::record_user_event( 'module_deactivated', array( 'module' => $module ) );
	}

	/* Failed login attempts */
	static function track_failed_login_attempts( $login ) {
		require_once JETPACK__PLUGIN_DIR . 'modules/protect/shared-functions.php';
		self::record_user_event(
			'failed_login',
			array(
				'origin_ip' => jetpack_protect_get_ip(),
				'login'     => $login,
			)
		);
	}

	static function record_user_event( $event_type, $data = array(), $user = null ) {

		if ( ! $user ) {
			$user = wp_get_current_user();
		}
		$site_url = get_option( 'siteurl' );

		$data['_via_ua']  = isset( $_SERVER['HTTP_USER_AGENT'] ) ? $_SERVER['HTTP_USER_AGENT'] : '';
		$data['_via_ip']  = isset( $_SERVER['REMOTE_ADDR'] ) ? $_SERVER['REMOTE_ADDR'] : '';
		$data['_lg']      = isset( $_SERVER['HTTP_ACCEPT_LANGUAGE'] ) ? $_SERVER['HTTP_ACCEPT_LANGUAGE'] : '';
		$data['blog_url'] = $site_url;
		$data['blog_id']  = \Jetpack_Options::get_option( 'id' );

		// Top level events should not be namespaced
		if ( '_aliasUser' != $event_type ) {
			$event_type = self::$product_name . '_' . $event_type;
		}

		$data['jetpack_version'] = defined( 'JETPACK__VERSION' ) ? JETPACK__VERSION : '0';

		return jetpack_tracks_record_event( $user, $event_type, $data );
	}

	/**
	 * Procedurally build a Tracks Event Object.
	 * NOTE: Use this only when the simpler jetpack_tracks_record_event() function won't work for you.
	 *
	 * @param $identity WP_user object
	 * @param string                  $event_name The name of the event
	 * @param array                   $properties Custom properties to send with the event
	 * @param int                     $event_timestamp_millis The time in millis since 1970-01-01 00:00:00 when the event occurred
	 * @return \Jetpack_Tracks_Event|\WP_Error
	 */
	function jetpack_tracks_build_event_obj( $user, $event_name, $properties = array(), $event_timestamp_millis = false ) {

		$identity = jetpack_tracks_get_identity( $user->ID );

		$properties['user_lang'] = $user->get( 'WPLANG' );

		$blog_details = array(
			'blog_lang' => isset( $properties['blog_lang'] ) ? $properties['blog_lang'] : get_bloginfo( 'language' ),
		);

		$timestamp        = ( $event_timestamp_millis !== false ) ? $event_timestamp_millis : round( microtime( true ) * 1000 );
		$timestamp_string = is_string( $timestamp ) ? $timestamp : number_format( $timestamp, 0, '', '' );

		return new Jetpack_Tracks_Event(
			array_merge(
				$blog_details,
				(array) $properties,
				$identity,
				array(
					'_en' => $event_name,
					'_ts' => $timestamp_string,
				)
			)
		);
	}

	/*
	 * Get the identity to send to tracks.
	 *
	 * @param int $user_id The user id of the local user
	 * @return array $identity
	 */
	static function jetpack_tracks_get_identity( $user_id, $connection_manager ) {

		// Meta is set, and user is still connected.  Use WPCOM ID
		$wpcom_id = get_user_meta( $user_id, 'jetpack_tracks_wpcom_id', true );
		if ( $wpcom_id && $connection_manager->is_user_connected( $user_id ) ) {
			return array(
				'_ut' => 'wpcom:user_id',
				'_ui' => $wpcom_id,
			);
		}

		// User is connected, but no meta is set yet.  Use WPCOM ID and set meta.
		if ( Jetpack::is_user_connected( $user_id ) ) {
			$wpcom_user_data = $connection_manager->get_connected_user_data( $user_id );
			update_user_meta( $user_id, 'jetpack_tracks_wpcom_id', $wpcom_user_data['ID'] );

			return array(
				'_ut' => 'wpcom:user_id',
				'_ui' => $wpcom_user_data['ID'],
			);
		}

		// User isn't linked at all.  Fall back to anonymous ID.
		$anon_id = get_user_meta( $user_id, 'jetpack_tracks_anon_id', true );
		if ( ! $anon_id ) {
			$anon_id = Client::get_anon_id();
			add_user_meta( $user_id, 'jetpack_tracks_anon_id', $anon_id, false );
		}

		if ( ! isset( $_COOKIE['tk_ai'] ) && ! headers_sent() ) {
			setcookie( 'tk_ai', $anon_id );
		}

		return array(
			'_ut' => 'anon',
			'_ui' => $anon_id,
		);

	}

	/**
	 * Record an event in Tracks - this is the preferred way to record events from PHP.
	 *
	 * @param mixed  $identity username, user_id, or WP_user object
	 * @param string $event_name The name of the event
	 * @param array  $properties Custom properties to send with the event
	 * @param int    $event_timestamp_millis The time in millis since 1970-01-01 00:00:00 when the event occurred
	 * @return bool true for success | \WP_Error if the event pixel could not be fired
	 */
	function jetpack_tracks_record_event( $user, $event_name, $properties = array(), $event_timestamp_millis = false ) {

		// We don't want to track user events during unit tests/CI runs.
		if ( $user instanceof WP_User && 'wptests_capabilities' === $user->cap_key ) {
			return false;
		}

		$event_obj = jetpack_tracks_build_event_obj( $user, $event_name, $properties, $event_timestamp_millis );

		if ( is_wp_error( $event_obj->error ) ) {
			return $event_obj->error;
		}

		return $event_obj->record();
	}

	/**
	 * Gets the WordPress.com user's Tracks identity, if connected.
	 *
	 * @return array|bool
	 */
	static function get_connected_user_tracks_identity( $connection_manager ) {
		if ( ! $user_data = $connection_manager->get_connected_user_data() ) {
			return false;
		}

		return array(
			'blogid'   => Jetpack_Options::get_option( 'id', 0 ),
			'userid'   => $user_data['ID'],
			'username' => $user_data['login'],
		);
	}
}

add_action( 'init', array( 'Tracking', 'track_jetpack_usage' ) );
