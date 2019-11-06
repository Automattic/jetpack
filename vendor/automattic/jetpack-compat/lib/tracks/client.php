<?php
/**
 * Deprecated Tracks client.
 *
 * @package automattic/jetpack-compat
 */

/**
 * Get tracks identity for an user.
 *
 * @deprecated 7.5.0 use Automattic\Jetpack\Tracking->tracks_get_identity instead
 *
 * @param int $user_id User id.
 *
 * @return mixed tracks identity.
 */
function jetpack_tracks_get_identity( $user_id ) {
	_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Tracking->tracks_get_identity' );

	$tracking = new Automattic\Jetpack\Tracking( 'jetpack', Jetpack::connection() );
	return $tracking->tracks_get_identity( $user_id );
}

/**
 * Record Jetpack Tracks Event
 *
 * @deprecated 7.5.0 use Automattic\Jetpack\Tracking->tracks_record_event instead
 *
 * @param object      $user User acting.
 * @param string      $event_name Event name.
 * @param array       $properties Properties.
 * @param string|bool $event_timestamp_millis Timestamp.
 *
 * @return bool
 */
function jetpack_tracks_record_event( $user, $event_name, $properties = array(), $event_timestamp_millis = false ) {
	_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Tracking->tracks_record_event' );

	$tracking = new Automattic\Jetpack\Tracking( 'jetpack', Jetpack::connection() );
	return $tracking->tracks_record_event( $user, $event_name, $properties, $event_timestamp_millis );
}
