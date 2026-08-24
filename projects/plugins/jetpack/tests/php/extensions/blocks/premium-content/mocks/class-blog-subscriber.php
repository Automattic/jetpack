<?php
/**
 * Mock Blog_Subscriber class for testing.
 *
 * On WPCOM this class is provided by
 * wp-content/mu-plugins/email-subscriptions/subscriptions.php, which isn't available
 * when running the Jetpack plugin's own PHPUnit suite.
 *
 * @package automattic/jetpack
 */

if ( ! class_exists( 'Blog_Subscriber' ) ) {
	/**
	 * Mock Blog_Subscriber for testing.
	 */
	class Blog_Subscriber {

		/**
		 * Subscribers keyed by email, set by tests.
		 *
		 * @var array<string, mixed>
		 */
		public static $subscribers_by_email = array();

		/**
		 * Mirrors the real Blog_Subscriber::get(), returning a falsy value when unknown.
		 *
		 * @param string $email The subscriber's email.
		 *
		 * @return mixed
		 */
		public static function get( string $email ) {
			return self::$subscribers_by_email[ $email ] ?? false;
		}
	}
}
