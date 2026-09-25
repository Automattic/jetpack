<?php
/**
 * Mock Blog_Subscription class for testing.
 *
 * On WPCOM this class is provided by
 * wp-content/mu-plugins/email-subscriptions/subscriptions.php, which isn't available
 * when running the Jetpack plugin's own PHPUnit suite.
 *
 * @package automattic/jetpack
 */

if ( ! class_exists( 'Blog_Subscription' ) ) {
	/**
	 * Mock Blog_Subscription for testing.
	 */
	class Blog_Subscription {

		/**
		 * Status to return from get_subscription_status_for_blog(), set by tests.
		 *
		 * @var string
		 */
		public static $status = '';

		/**
		 * Mirrors the real Blog_Subscription::get_subscription_status_for_blog().
		 *
		 * @param Blog_Subscriber $subscriber The subscriber.
		 * @param integer         $blog_id    The blog ID.
		 * @param boolean         $use_cache  Whether to use the cache.
		 *
		 * @return string
		 */
		public static function get_subscription_status_for_blog( Blog_Subscriber $subscriber, int $blog_id = 0, bool $use_cache = true ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			return self::$status;
		}
	}
}
