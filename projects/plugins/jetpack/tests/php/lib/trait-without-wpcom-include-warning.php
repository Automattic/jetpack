<?php
/**
 * Swallows the warning from a wpcom-only include that the test environment lacks.
 *
 * @package automattic/jetpack
 */

/**
 * Shared by tests that call WPCOM_Online_Subscription_Service.
 */
trait Without_WPCOM_Include_Warning {
	/**
	 * Runs the callback while ignoring the warning from the include_once() of
	 * email-subscriptions/subscriptions.php, which exists only on WordPress.com.
	 *
	 * @param callable $callback The code to run.
	 *
	 * @return mixed
	 */
	private function run_without_wpcom_include_warning( callable $callback ) {
		$previous = set_error_handler( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.prevent_path_disclosure_set_error_handler
			static function ( $errno, $errstr, ...$rest ) use ( &$previous ) {
				if ( E_WARNING === $errno && str_contains( $errstr, 'email-subscriptions/subscriptions.php' ) ) {
					return true;
				}
				// Anything else goes to the handler that was in place, so it still fails the test.
				return $previous ? $previous( $errno, $errstr, ...$rest ) : false;
			}
		);
		try {
			return $callback();
		} finally {
			restore_error_handler();
		}
	}
}
