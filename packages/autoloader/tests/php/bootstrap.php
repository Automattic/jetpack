<?php
/**
 * Bootstrap file for the autoloader test suite.
 *
 * @package automattic/jetpack-autoloader
 */

if ( ! function_exists( 'trailingslashit' ) ) {

	/**
	 * A drop-in for a WordPress core function.
	 *
	 * @param String $string string.
	 * @return String
	 */
	function trailingslashit( $string ) {
		return rtrim( $string, '/\\' ) . '/';
	}
}

require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/../../src/functions.php';
require_once __DIR__ . '/../../src/class-plugins-handler.php';
require_once __DIR__ . '/../../src/class-classes-handler.php';
require_once __DIR__ . '/../../src/class-files-handler.php';
