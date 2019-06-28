<?php

/**
 * @deprecated 7.5.0 use Automattic\Jetpack\Tracking->tracks_get_identity instead
 */
function jetpack_tracks_get_identity( $user_id ) {
	_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Tracking->tracks_get_identity' );

	$tracking = new Automattic\Jetpack\Tracking( 'jetpack', Jetpack::connection() );
	return $tracking->tracks_get_identity( $user_id );
}

/**
 * @deprecated 7.5.0 use Automattic\Jetpack\Tracking->tracks_record_event instead
 */
function jetpack_tracks_record_event( $user, $event_name, $properties = array(), $event_timestamp_millis = false ) {
	_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Tracking->tracks_record_event' );

	$tracking = new Automattic\Jetpack\Tracking( 'jetpack', Jetpack::connection() );
	return $tracking->tracks_record_event( $user, $event_name, $properties, $event_timestamp_millis );
}
