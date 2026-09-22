<?php
/**
 * Stands in for the plugin class the placement defaults defer to.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

/**
 * A `Jetpack_Likes_Settings` that reports placement and prints a stand-in for its legacy options.
 *
 * The real one ships with the Jetpack plugin's Likes module, which this package
 * does not depend on. `get_options()['show']` returns whatever a test sets in
 * `$GLOBALS['sharing_likes_test_likes_show']`.
 *
 * Defining this makes `class_exists( 'Jetpack_Likes_Settings' )` true for the
 * whole process, so tests that need the class absent cannot live in this suite.
 */
class Jetpack_Likes_Settings {

	/**
	 * The Likes options, as the settings screen reads them.
	 *
	 * @return array<string,mixed>
	 */
	public function get_options() {
		return array( 'show' => $GLOBALS['sharing_likes_test_likes_show'] ?? array() );
	}

	/**
	 * The legacy Likes options wpcom hooks onto `sharing_global_options` on Simple.
	 */
	public function admin_settings_init() {
		echo '<tr id="legacy-likes-options"></tr>';
	}
}
