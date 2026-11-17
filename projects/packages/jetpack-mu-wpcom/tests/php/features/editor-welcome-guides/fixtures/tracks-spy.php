<?php
/**
 * Stand-in for the Atomic Tracks recorder. Other features read its presence as "on Atomic",
 * so load it only from a test that runs in a separate process.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Collects each event in `$GLOBALS['wpcom_tracks_events']`.
 *
 * @param string $event_name       Event name.
 * @param array  $event_properties Event properties.
 */
function wpcomsh_record_tracks_event( $event_name, $event_properties ) {
	$GLOBALS['wpcom_tracks_events'][] = array( $event_name, $event_properties );
}
