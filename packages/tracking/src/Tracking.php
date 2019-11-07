<?php
/**
 * Nosara Tracks for Jetpack
 *
 * @package automattic/jetpack-tracking
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Terms_Of_Service;

/**
 * The Tracking class, used to record events in wpcom
 */
class Tracking {
	/**
	 * Slug of the product that we are tracking.
	 *
	 * @var string
	 */
	private $product_name;

	/**
	 * Connection manager object.
	 *
	 * @var Object
	 */
	private $connection;

	/**
	 * Creates the Tracking object.
	 *
	 * @param String                                $product_name the slug of the product that we are tracking.
	 * @param Automattic\Jetpack\Connection\Manager $connection   the connection manager object.
	 */
	public function __construct( $product_name = 'jetpack', $connection = null ) {
		$this->product_name = $product_name;
		$this->connection   = $connection;
		if ( is_null( $this->connection ) ) {
			// TODO We should always pass a Connection.
			$this->connection = new Connection\Manager();
		}
	}

	/**
	 * Enqueue script necessary for tracking.
	 */
	public function enqueue_tracks_scripts() {
		wp_enqueue_script( 'jptracks', plugins_url( '_inc/lib/tracks/tracks-ajax.js', JETPACK__PLUGIN_FILE ), array(), JETPACK__VERSION, true );
		wp_localize_script(
			'jptracks',
			'jpTracksAJAX',
			array(
				'ajaxurl'            => admin_url( 'admin-ajax.php' ),
				'jpTracksAJAX_nonce' => wp_create_nonce( 'jp-tracks-ajax-nonce' ),
			)
		);
	}

	/**
	 * Send an event in Tracks.
	 *
	 * @param string $event_type Type of the event.
	 * @param array  $data       Data to send with the event.
	 * @param mixed  $user       username, user_id, or WP_user object.
	 */
	public function record_user_event( $event_type, $data = array(), $user = null ) {
		if ( ! $user ) {
			$user = wp_get_current_user();
		}
		$site_url = get_option( 'siteurl' );

		$data['_via_ua']  = isset( $_SERVER['HTTP_USER_AGENT'] ) ? $_SERVER['HTTP_USER_AGENT'] : '';
		$data['_via_ip']  = isset( $_SERVER['REMOTE_ADDR'] ) ? $_SERVER['REMOTE_ADDR'] : '';
		$data['_lg']      = isset( $_SERVER['HTTP_ACCEPT_LANGUAGE'] ) ? $_SERVER['HTTP_ACCEPT_LANGUAGE'] : '';
		$data['blog_url'] = $site_url;
		$data['blog_id']  = \Jetpack_Options::get_option( 'id' );

		// Top level events should not be namespaced.
		if ( '_aliasUser' !== $event_type ) {
			$event_type = $this->product_name . '_' . $event_type;
		}

		$data['jetpack_version'] = defined( 'JETPACK__VERSION' ) ? JETPACK__VERSION : '0';

		return $this->tracks_record_event( $user, $event_type, $data );
	}

	/**
	 * Record an event in Tracks - this is the preferred way to record events from PHP.
	 *
	 * @param mixed  $user                   username, user_id, or WP_user object.
	 * @param string $event_name             The name of the event.
	 * @param array  $properties             Custom properties to send with the event.
	 * @param int    $event_timestamp_millis The time in millis since 1970-01-01 00:00:00 when the event occurred.
	 *
	 * @return bool true for success | \WP_Error if the event pixel could not be fired
	 */
	public function tracks_record_event( $user, $event_name, $properties = array(), $event_timestamp_millis = false ) {

		// We don't want to track user events during unit tests/CI runs.
		if ( $user instanceof \WP_User && 'wptests_capabilities' === $user->cap_key ) {
			return false;
		}
		$terms_of_service = new Terms_Of_Service();
		// Don't track users who have opted out or not agreed to our TOS, or are not running an active Jetpack.
		if ( ! $terms_of_service->has_agreed() ) {
			return false;
		}

		$event_obj = $this->tracks_build_event_obj( $user, $event_name, $properties, $event_timestamp_millis );

		if ( is_wp_error( $event_obj->error ) ) {
			return $event_obj->error;
		}

		return $event_obj->record();
	}

	/**
	 * Procedurally build a Tracks Event Object.
	 * NOTE: Use this only when the simpler Automattic\Jetpack\Tracking->jetpack_tracks_record_event() function won't work for you.
	 *
	 * @param WP_user $user                   WP_user object.
	 * @param string  $event_name             The name of the event.
	 * @param array   $properties             Custom properties to send with the event.
	 * @param int     $event_timestamp_millis The time in millis since 1970-01-01 00:00:00 when the event occurred.
	 *
	 * @return \Jetpack_Tracks_Event|\WP_Error
	 */
	private function tracks_build_event_obj( $user, $event_name, $properties = array(), $event_timestamp_millis = false ) {
		$identity = $this->tracks_get_identity( $user->ID );

		$properties['user_lang'] = $user->get( 'WPLANG' );

		$blog_details = array(
			'blog_lang' => isset( $properties['blog_lang'] ) ? $properties['blog_lang'] : get_bloginfo( 'language' ),
		);

		$timestamp        = ( false !== $event_timestamp_millis ) ? $event_timestamp_millis : round( microtime( true ) * 1000 );
		$timestamp_string = is_string( $timestamp ) ? $timestamp : number_format( $timestamp, 0, '', '' );

		return new \Jetpack_Tracks_Event(
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

	/**
	 * Get the identity to send to tracks.
	 *
	 * @param int $user_id The user id of the local user.
	 *
	 * @return array $identity
	 */
	public function tracks_get_identity( $user_id ) {

		// Meta is set, and user is still connected.  Use WPCOM ID.
		$wpcom_id = get_user_meta( $user_id, 'jetpack_tracks_wpcom_id', true );
		if ( $wpcom_id && $this->connection->is_user_connected( $user_id ) ) {
			return array(
				'_ut' => 'wpcom:user_id',
				'_ui' => $wpcom_id,
			);
		}

		// User is connected, but no meta is set yet.  Use WPCOM ID and set meta.
		if ( $this->connection->is_user_connected( $user_id ) ) {
			$wpcom_user_data = $this->connection->get_connected_user_data( $user_id );
			update_user_meta( $user_id, 'jetpack_tracks_wpcom_id', $wpcom_user_data['ID'] );

			return array(
				'_ut' => 'wpcom:user_id',
				'_ui' => $wpcom_user_data['ID'],
			);
		}

		// User isn't linked at all.  Fall back to anonymous ID.
		$anon_id = get_user_meta( $user_id, 'jetpack_tracks_anon_id', true );
		if ( ! $anon_id ) {
			$anon_id = \Jetpack_Tracks_Client::get_anon_id();
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
}
