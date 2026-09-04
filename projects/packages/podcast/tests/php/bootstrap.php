<?php
/**
 * Bootstrap.
 *
 * Shadows the wpcom Simple `tracks_record_event` and `bump_stats_extras`
 * from wpcom-stubs at test runtime so dispatches land in per-test buffers.
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

if ( ! function_exists( 'bump_stats_extras' ) ) {
	function bump_stats_extras( $name, $value ) {
		$GLOBALS['jetpack_podcast_test_captured_stats'][] = array(
			'group' => $name,
			'bin'   => $value,
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

if ( ! function_exists( 'jetpack_podcast_test_reset_plan_cache' ) ) {
	/**
	 * `Current_Plan::get()` memoizes for the request, leaking option writes between tests.
	 */
	function jetpack_podcast_test_reset_plan_cache() {
		$property = ( new \ReflectionClass( \Automattic\Jetpack\Current_Plan::class ) )->getProperty( 'active_plan_cache' );
		// @todo Remove once we drop PHP < 8.1 support. `setAccessible()` is
		// deprecated in 8.5 (a no-op since 8.1), so only call it where it's needed.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, null );
	}
}
