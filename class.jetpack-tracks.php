<?php
/**
 * Nosara Tracks for Jetpack
 */

require_once( dirname( __FILE__ ) . '/_inc/lib/tracks/client.php' );

class JetpackTracking {
	static $product_name = 'jetpack';

	static function track_jetpack_usage() {
		if ( ! Jetpack::is_active() ) {
			return;
		}

		add_action( 'jetpack_pre_activate_module',   array( __CLASS__, 'track_activate_module'), 1, 1 );
		add_action( 'jetpack_pre_deactivate_module', array( __CLASS__, 'track_deactivate_module'), 1, 1 );
		add_action( 'jetpack_user_authorized',       array( __CLASS__, 'track_user_linked' ) );
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

		self::record_user_event( 'user_linked', array() );
	}

	/* Activated module */
	static function track_activate_module( $module ) {
		self::record_user_event( 'module_activated', array( 'module' => $module ) );
	}

	/* Deactivated module */
	static function track_deactivate_module( $module ) {
		self::record_user_event( 'module_deactivated', array( 'module' => $module ) );
	}

	static function record_user_event( $event_type, $data ) {

		$user = wp_get_current_user();
		$site_url = get_option( 'siteurl' );

		$data['_via_ua']  = $_SERVER['HTTP_USER_AGENT'];
		$data['_via_ip']  = $_SERVER['REMOTE_ADDR'];
		$data['_lg']      = $_SERVER['HTTP_ACCEPT_LANGUAGE'];
		$data['blog_url'] = $site_url;
		$data['blog_id']  = Jetpack_Options::get_option( 'id' );

		// Top level events should not be namespaced
		if ( '_aliasUser' != $event_type ) {
			$event_type = self::$product_name . '_' . $event_type;
		}

		$data['jetpack_version'] = defined( 'JETPACK__VERSION' ) ? JETPACK__VERSION : '0';

		jetpack_tracks_record_event( $user, $event_type, $data );
	}
}

add_action( 'init',  array( 'JetpackTracking', 'track_jetpack_usage' ) );
