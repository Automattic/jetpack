<?php
/**
 * Stub for WordPress.com's `is_automattician()`, false unless a test sets Wpcom_Test_User.
 *
 * @package automattic/jetpack-seo
 */

if ( ! function_exists( 'is_automattician' ) ) {
	/**
	 * Whether the simulated visitor is an Automattician.
	 *
	 * @return bool
	 */
	function is_automattician() {
		return Wpcom_Test_User::$is_automattician;
	}
}
