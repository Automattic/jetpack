<?php
/**
 * Stands in for the plugin class the settings screen uses opportunistically.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

/**
 * A `Sharing_Service` that records rather than saves.
 *
 * The real one ships with the Jetpack plugin's Sharing module, which this
 * package does not depend on. Validating the payload is that class's job, so
 * the tests here only assert what the handler hands over.
 */
class Sharing_Service {

	/**
	 * Record a save.
	 *
	 * @param array<string,mixed> $data Posted data.
	 */
	public function set_global_options( $data ) {
		$GLOBALS['sharing_likes_test_global_options'] = $data;
	}
}
