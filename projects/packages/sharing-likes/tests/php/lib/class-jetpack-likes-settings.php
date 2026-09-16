<?php
/**
 * Stands in for the plugin class the placement defaults defer to.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

/**
 * A `Jetpack_Likes_Settings` that reports placement and nothing else.
 *
 * The real one ships with the Jetpack plugin's Likes module, which this package
 * does not depend on. Only `get_options()['show']` is read from here, and what
 * it returns is set per test through `$GLOBALS['sharing_likes_test_likes_show']`.
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
}
