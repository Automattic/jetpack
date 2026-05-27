<?php
/**
 * Bootstrap.
 *
 * Shadows the wpcom Simple `tracks_record_event` from wpcom-stubs at test
 * runtime so dispatched events land in a per-test buffer.
 *
 * @phan-file-suppress PhanRedefineFunction
 *
 * @package automattic/jetpack-podcast
 */

require_once __DIR__ . '/../../vendor/autoload.php';

define( 'WP_DEBUG', true );

\Automattic\Jetpack\Test_Environment::init();

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

/**
 * Shim WordPress multisite `get_blog_details` for non-multisite test runs.
 */
if ( ! function_exists( 'get_blog_details' ) ) {
	function get_blog_details( $blog_id = 0 ) {
		$details = $GLOBALS['jetpack_podcast_test_blog_details'][ $blog_id ] ?? null;
		return $details ? (object) $details : false;
	}
}
