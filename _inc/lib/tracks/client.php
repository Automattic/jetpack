<?php
/**
 * PHP Tracks Client
 * @autounit nosara tracks-client
 * Example Usage:
 *
```php
	include( plugin_dir_path( __FILE__ ) . 'lib/tracks/client.php');
	$result = tracks_record_event( $user, $event_name, $properties );

	if ( is_wp_error( $result ) ) {
		// Handle the error in your app
	}
```
 */

// Load the client classes
require_once( dirname(__FILE__).'/class.tracks-event.php' );
require_once( dirname(__FILE__).'/class.tracks-client.php' );

// Now, let's export a sprinkling of syntactic sugar!

/**
 * Procedurally (vs. Object-oriented), track an event object (or flat array)
 * NOTE: Use this only when the simpler tracks_record_event() function won't work for you.
 * @param \Tracks_Event $event The event object.
 * @return \Tracks_Event|\WP_Error
 */
function tracks_record_event_raw( $event ) {
	return Tracks_Client::record_event( $event );
}

/**
 * Procedurally build a Tracks Event Object.
 * NOTE: Use this only when the simpler tracks_record_event() function won't work for you.
 * @param $identity WP_user object
 * @param string $event_name The name of the event
 * @param array $properties Custom properties to send with the event
 * @param int $event_timestamp_millis The time in millis since 1970-01-01 00:00:00 when the event occurred
 * @return \Tracks_Event|\WP_Error
 */
function tracks_build_event_obj( $user
								, $event_name
								, $properties = array()
								, $event_timestamp_millis = false ) {

	$anon_id = get_user_meta($user->ID, 'jetpack_tracks_anon_id', true);

	if ( ! $anon_id ) {
		$anon_id = Tracks_Client::get_anon_id();
		add_user_meta($user->ID, 'jetpack_tracks_anon_id', $anon_id, false);
	}

	if ( !isset( $_COOKIE[ 'tk_ai' ] ) && !headers_sent() ) {
		setcookie( 'tk_ai', $anon_id );
	}

	$identity = array(
		'_ut' => 'anon',
		'_ui' => $anon_id
	);
	
	$properties['user_lang'] = $user->get('WPLANG');

	$blog_details = array(
		'blog_lang' => isset( $properties['blog_lang'] ) ? $properties['blog_lang'] : get_bloginfo( 'language' )
	);

	$timestamp = ( $event_timestamp_millis !== false ) ? $event_timestamp_millis : round( microtime( true ) * 1000 );
	$timestamp_string = is_string($timestamp) ? $timestamp : number_format($timestamp, 0, '', '');

	return new Tracks_Event( array_merge( $blog_details, (array) $properties, $identity, array(
		'_en' => $event_name,
		'_ts' => $timestamp_string
	) ) );
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
function tracks_record_event( $user
							, $event_name
							, $properties = array()
							, $event_timestamp_millis = false ) {
	$event_obj = tracks_build_event_obj( $user, $event_name, $properties, $event_timestamp_millis );
	if ( is_wp_error( $event_obj->error ) ) {
		return $event_obj->error;
	}

	return $event_obj->record();
}
