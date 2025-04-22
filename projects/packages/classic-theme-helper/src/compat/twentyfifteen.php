<?php
/**
 * Jetpack Compatibility File
 * See: https://jetpack.com/
 *
 * @package automattic/jetpack-classic-theme-helper
 */

/**
 * Add Jetpack theme supports for Twenty Fifteen.
 */
function twentyfifteen__jetpack_setup() {
	/**
	 * Add theme support for Responsive Videos.
	 */
	add_theme_support( 'jetpack-responsive-videos' );
}
add_action( 'after_setup_theme', 'twentyfifteen__jetpack_setup' );
