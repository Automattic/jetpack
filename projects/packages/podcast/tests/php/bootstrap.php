<?php
/**
 * Bootstrap.
 *
 * @package automattic/jetpack-podcast
 */

require_once __DIR__ . '/../../vendor/autoload.php';

define( 'WP_DEBUG', true );

\Automattic\Jetpack\Test_Environment::init();

// Capture tracks events into a per-test buffer instead of dispatching them.
if ( ! function_exists( 'tracks_record_event' ) ) {
	function tracks_record_event( $user, $event_name, $properties = array() ) {
		$GLOBALS['jetpack_podcast_test_captured_events'][] = array(
			'user'       => $user,
			'event_name' => $event_name,
			'properties' => $properties,
		);
		return true;
	}
}
