<?php
/**
 * Jetpack Compatibility File
 * See: https://jetpack.com/
 */

function twentyseventeen_jetpack_setup() {
	/**
	 * Add theme support for geo-location.
	 */
	add_theme_support( 'jetpack-geo-location' );
}
add_action( 'after_setup_theme', 'twentyseventeen_jetpack_setup' );
