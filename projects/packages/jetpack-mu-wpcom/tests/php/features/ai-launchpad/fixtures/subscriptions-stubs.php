<?php
/**
 * Test stub for the Jetpack plugin's Subscribe-block counts helper that
 * AI_Launchpad_Subscribers_Listener::get_email_subscriber_count() reads. The
 * Jetpack plugin is not loaded by the mu-wpcom test bootstrap, so this defines
 * the namespaced function and lets tests inject its return.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Extensions\Subscriptions;

if ( ! function_exists( __NAMESPACE__ . '\\fetch_subscriber_counts' ) ) {
	/**
	 * Stand-in for the Jetpack helper; returns whatever a test injected.
	 *
	 * @return mixed
	 */
	function fetch_subscriber_counts() {
		return $GLOBALS['ai_launchpad_stub_subscriber_counts'] ?? null;
	}
}
