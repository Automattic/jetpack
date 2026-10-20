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
	private function without_wpcom_include_warning( callable $callback ) {
		set_error_handler( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.prevent_path_disclosure_set_error_handler
			static function ( $errno, $errstr ) {
				return str_contains( $errstr, 'email-subscriptions/subscriptions.php' );
			},
			E_WARNING
		);
		try {
			return $callback();
		} finally {
			restore_error_handler();
		}
	}
}
