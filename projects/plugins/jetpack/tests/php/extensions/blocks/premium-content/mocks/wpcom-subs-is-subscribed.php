<?php
/**
 * Mock wpcom_subs_is_subscribed() for testing.
 *
 * On WPCOM this function is provided by wp-content/mu-plugins/subscriptions.php, which
 * isn't available when running the Jetpack plugin's own PHPUnit suite.
 *
 * @package automattic/jetpack
 */

if ( ! function_exists( 'wpcom_subs_is_subscribed' ) ) {
	/**
	 * Mocks the WPCOM Reader follow-matrix lookup.
	 *
	 * Tests control the return value via $GLOBALS['wpcom_subs_is_subscribed_mock_return']
	 * and can inspect the args they were called with via
	 * $GLOBALS['wpcom_subs_is_subscribed_mock_calls'].
	 *
	 * @param array $args The lookup args (user_id, blog_id).
	 *
	 * @return boolean
	 */
	function wpcom_subs_is_subscribed( array $args = array() ) {
		$GLOBALS['wpcom_subs_is_subscribed_mock_calls'][] = $args;
		return ! empty( $GLOBALS['wpcom_subs_is_subscribed_mock_return'] );
	}
}
