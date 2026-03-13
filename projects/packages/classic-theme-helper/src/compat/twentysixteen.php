<?php
/**
 * Jetpack Compatibility File
 * See: https://jetpack.com/
 *
 * @package automattic/jetpack-classic-theme-helper
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Add Jetpack theme supports for Twenty Sixteen.
 */
function twentysixteen__jetpack_setup() {
	/**
	 * Add theme support for Responsive Videos.
	 */
	add_theme_support( 'jetpack-responsive-videos' );
}
add_action( 'after_setup_theme', 'twentysixteen__jetpack_setup' );
