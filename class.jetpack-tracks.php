<?php
/**
 * Nosara Tracks for Jetpack
 */

require_once( dirname( __FILE__ ) . '/_inc/lib/tracks/client.php' );

class JetpackTracking {
	static $product_name = 'jetpack';
	static $track_redirects = [];

	static function track_jetpack_usage() {
		if ( ! Jetpack::is_active() ) {
			return;
		}

		// For tracking stuff via js/ajax
		add_action( 'admin_enqueue_scripts',     array( __CLASS__, 'enqueue_tracks_scripts' ) );

		add_action( 'jetpack_activate_module', array( __CLASS__, 'track_activate_module'), 1, 1 );
		add_action( 'jetpack_deactivate_module', array( __CLASS__, 'track_deactivate_module'), 1, 1 );
		add_action( 'jetpack_user_authorized',   array( __CLASS__, 'track_user_linked' ) );
		add_action( 'wp_login_failed',           array( __CLASS__, 'track_failed_login_attempts' ) );
	}

	static function enqueue_tracks_scripts() {
		wp_enqueue_script( 'jptracks', plugins_url( '_inc/lib/tracks/tracks-ajax.js', JETPACK__PLUGIN_FILE ), array(), JETPACK__VERSION, true );
		wp_localize_script( 'jptracks', 'jpTracksAJAX', array(
			'ajaxurl'            => admin_url( 'admin-ajax.php' ),
			'jpTracksAJAX_nonce' => wp_create_nonce( 'jp-tracks-ajax-nonce' ),
		) );
	}

	public function add_query_vars( $query_vars ) {
		$query_vars[] = 'tracks_and_bounce';
		$query_vars[] = 'tracks_and_bounce_nonce';
		return $query_vars;
	}

	public function allow_wpcom_domain( $domains ) {
		if ( empty( $domains ) ) {
			$domains = array();
		}
		$domains[] = 'wordpress.com';
		return array_unique( $domains );
	}

	public function parse_request( $query ) {
		if ( ! array_key_exists( 'tracks_and_bounce', $query->query_vars ) ) {
			return;
		}

		if ( ! wp_verify_nonce( $query->query_vars[ 'tracks_and_bounce_nonce' ], 'jp-tracks-masterbar-nonce' ) ) {
			// no nonce, wrong link or missing tracking information, push back to settings page
			wp_safe_redirect(
				add_query_arg(
					array( 'page' => 'jetpack-settings' ),
					network_admin_url( 'admin.php' )
				)
			);
			die();
		}

		$trackId = $query->query_vars[ 'tracks_and_bounce' ];
		if ( ! array_key_exists( $trackId, self::$track_redirects ) ) {
			return;
		}

		$track_target = self::$track_redirects[ $trackId ];

		self::record_user_event(
			'track_and_bounce',
			array(
				'source' => $trackId,
				'target' => $track_target
			)
		);
		wp_safe_redirect( $track_target );
		die();
	}

	static function add_redirect( $events ) {
		self::$track_redirects = array_merge( self::$track_redirects, $events );
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
		require_once( JETPACK__PLUGIN_DIR . 'modules/protect/shared-functions.php' );
		self::record_user_event( 'failed_login', array( 'origin_ip' => jetpack_protect_get_ip(), 'login' => $login ) );
	}

	static function record_user_event( $event_type, $data= array(), $user = null ) {

		if ( ! $user ) {
			$user = wp_get_current_user();
		}
		$site_url = get_option( 'siteurl' );

		$data['_via_ua']  = isset( $_SERVER['HTTP_USER_AGENT'] ) ? $_SERVER['HTTP_USER_AGENT'] : '';
		$data['_via_ip']  = isset( $_SERVER['REMOTE_ADDR'] ) ? $_SERVER['REMOTE_ADDR'] : '';
		$data['_lg']      = isset( $_SERVER['HTTP_ACCEPT_LANGUAGE'] ) ? $_SERVER['HTTP_ACCEPT_LANGUAGE'] : '';
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
