<?php

/**
 * @deprecated 7.5.0 use Automattic\Jetpack\Tracking->tracks_record_event_raw instead
 */
function jetpack_tracks_record_event_raw( $event ) {
	$tracking = new Automattic\Jetpack\Tracking( 'jetpack', Jetpack::connection() );
	return $tracking->jetpack_tracks_record_event_raw( $event );
}

/**
 * @deprecated 7.5.0 use Automattic\Jetpack\Tracking->tracks_get_identity instead
 */
function jetpack_tracks_get_identity( $user_id ) {
	$tracking = new Automattic\Jetpack\Tracking( 'jetpack', Jetpack::connection() );
	return $tracking->jetpack_tracks_get_identity( $user_id );
}

/**
 * @deprecated 7.5.0 use Automattic\Jetpack\Tracking->tracks_record_event instead
 */
function jetpack_tracks_record_event( $user, $event_name, $properties = array(), $event_timestamp_millis = false ) {
	$tracking = new Automattic\Jetpack\Tracking( 'jetpack', Jetpack::connection() );
	return $tracking->jetpack_tracks_record_event( $user, $event_name, $properties, $event_timestamp_millis );
}
