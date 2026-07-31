<?php
/**
 * Stub for the WordPress.com user-identity function.
 *
 * `is_automattician()` is defined by the WordPress.com platform, not by any
 * package, and only on Simple — which is why `Admin_Page::get_tracks_context()`
 * guards it with `function_exists()` and why `is_a11n` reads false on Atomic and
 * self-hosted. Defining it here lets the tests drive the branch that reads it.
 *
 * Default is inert (false), matching a non-Automattician visitor, so tests that
 * don't care about the flag see the same context they would off-WordPress.com.
 * Tests opt in via Wpcom_Test_User.
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
