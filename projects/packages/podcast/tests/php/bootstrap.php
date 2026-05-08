<?php
/**
 * Bootstrap.
 *
 * @package automattic/jetpack-podcast
 */

require_once __DIR__ . '/../../vendor/autoload.php';

define( 'WP_DEBUG', true );

\Automattic\Jetpack\Test_Environment::init();

/**
 * Tracks dispatcher shim. The package's `Tracks::record_event()` looks up
 * `\tracks_record_event` by name; defining it here makes events land in a
 * test-readable buffer instead of attempting a real HTTP dispatch. Cleared
 * per-test via `$GLOBALS['jetpack_podcast_test_captured_events']`.
 */
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
