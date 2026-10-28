<?php
/**
 * Stands in for the recorder WordPress.com defines on Simple, which the design screen calls there
 * because Jetpack's own refuses for want of a connection to ask about.
 *
 * @package automattic/jetpack
 */

if ( ! function_exists( 'wpcom_record_tracks_event' ) ) {
	/**
	 * Record what was asked for, for a test to read back.
	 *
	 * @param string $event_name       The event.
	 * @param array  $event_properties Its properties.
	 */
	function wpcom_record_tracks_event( $event_name, $event_properties ) {
		$GLOBALS['jetpack_test_wpcom_tracks_events'][] = array( $event_name, $event_properties );
	}
}
