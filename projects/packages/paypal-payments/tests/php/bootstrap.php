<?php
/**
 * Bootstrap.
 *
 * Stubs wpcom's Simple-only `tracks_record_event()` to collect events in
 * `$GLOBALS['jetpack_paypal_test_captured_events']`, or throw when
 * `jetpack_paypal_test_tracks_throws` is set.
 *
 * @phan-file-suppress PhanRedefineFunction
 *
 * @package automattic/
 */

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

define( 'WP_DEBUG', true );

if ( ! defined( 'AUTH_KEY' ) ) {
	define( 'AUTH_KEY', 'test-auth-key-for-phpunit-not-for-production' );
}

// Initialize WordPress test environment
\Automattic\Jetpack\Test_Environment::init();

if ( ! function_exists( 'tracks_record_event' ) ) {
	function tracks_record_event( $user, $event_name, $properties = array() ) {
		if ( ! empty( $GLOBALS['jetpack_paypal_test_tracks_throws'] ) ) {
			throw new \RuntimeException( 'Tracks failed.' );
		}

		$GLOBALS['jetpack_paypal_test_captured_events'][] = array(
			'user'       => $user,
			'event_name' => $event_name,
			'properties' => $properties,
		);
		return true;
	}
}
