<?php
/**
 * PHP Tracks Client
 * @autounit nosara tracks-client
 * Example Usage:
 *
```php
	include( plugin_dir_path( __FILE__ ) . 'lib/tracks/client.php');
	$result = jetpack_tracks_record_event( $user, $event_name, $properties );

	if ( is_wp_error( $result ) ) {
		// Handle the error in your app
	}
```
 */

// Load the client classes
require_once( dirname(__FILE__) . '/class.tracks-event.php' );
require_once( dirname(__FILE__) . '/class.tracks-client.php' );

// Now, let's export a sprinkling of syntactic sugar!

/**
 * Procedurally (vs. Object-oriented), track an event object (or flat array)
 * NOTE: Use this only when the simpler jetpack_tracks_record_event() function won't work for you.
 * @param \Jetpack_Tracks_Event $event The event object.
 * @return \Jetpack_Tracks_Event|\WP_Error
 */
function jetpack_tracks_record_event_raw( $event ) {
	return Jetpack_Tracks_Client::record_event( $event );
}

/**
 * Procedurally build a Tracks Event Object.
 * NOTE: Use this only when the simpler jetpack_tracks_record_event() function won't work for you.
 * @param $identity WP_user object
 * @param string $event_name The name of the event
 * @param array $properties Custom properties to send with the event
 * @param int $event_timestamp_millis The time in millis since 1970-01-01 00:00:00 when the event occurred
 * @return \Jetpack_Tracks_Event|\WP_Error
 */
function jetpack_tracks_build_event_obj( $user, $event_name, $properties = array(), $event_timestamp_millis = false ) {

	$identity = jetpack_tracks_get_identity( $user->ID );

	$properties['user_lang'] = $user->get( 'WPLANG' );

	$blog_details = array(
		'blog_lang' => isset( $properties['blog_lang'] ) ? $properties['blog_lang'] : get_bloginfo( 'language' )
	);

	$timestamp = ( $event_timestamp_millis !== false ) ? $event_timestamp_millis : round( microtime( true ) * 1000 );
	$timestamp_string = is_string( $timestamp ) ? $timestamp : number_format( $timestamp, 0, '', '' );

	return new Jetpack_Tracks_Event( array_merge( $blog_details, (array) $properties, $identity, array(
		'_en' => $event_name,
		'_ts' => $timestamp_string
	) ) );
}

/*
 * Get the identity to send to tracks.
 *
 * @param int $user_id The user id of the local user
 * @return array $identity
 */
function jetpack_tracks_get_identity( $user_id ) {

	// Meta is set, and user is still connected.  Use WPCOM ID
	$wpcom_id = get_user_meta( $user_id, 'jetpack_tracks_wpcom_id', true );
	if ( $wpcom_id && Jetpack::is_user_connected( $user_id ) ) {
		return array(
			'_ut' => 'wpcom:user_id',
			'_ui' => $wpcom_id
		);
	}

	// User is connected, but no meta is set yet.  Use WPCOM ID and set meta.
	if ( Jetpack::is_user_connected( $user_id ) ) {
		$wpcom_user_data = Jetpack::get_connected_user_data( $user_id );
		update_user_meta( $user_id, 'jetpack_tracks_wpcom_id', $wpcom_user_data['ID'] );

		return array(
			'_ut' => 'wpcom:user_id',
			'_ui' => $wpcom_user_data['ID']
		);
	}

	// User isn't linked at all.  Fall back to anonymous ID.
	$anon_id = get_user_meta( $user_id, 'jetpack_tracks_anon_id', true );
	if ( ! $anon_id ) {
		$anon_id = Jetpack_Tracks_Client::get_anon_id();
		add_user_meta( $user_id, 'jetpack_tracks_anon_id', $anon_id, false );
	}

	if ( ! isset( $_COOKIE[ 'tk_ai' ] ) && ! headers_sent() ) {
		setcookie( 'tk_ai', $anon_id );
	}

	return array(
		'_ut' => 'anon',
		'_ui' => $anon_id
	);

}

/**
 * Record an event in Tracks - this is the preferred way to record events from PHP.
 *
 * @param mixed $identity username, user_id, or WP_user object
 * @param string $event_name The name of the event
 * @param array $properties Custom properties to send with the event
 * @param int $event_timestamp_millis The time in millis since 1970-01-01 00:00:00 when the event occurred
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
