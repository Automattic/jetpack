<?php
/**
 * Load the google fonts based on the current WordPress version.
 *
 * @package automattic/jetpack
 */

if ( class_exists( 'WP_Font_Library' ) && class_exists( 'WP_Font_Face' ) && class_exists( 'WP_Font_Collection' ) ) {
	// WordPress 6.4 or above with the new Font Library.
	require_once __DIR__ . '/current/load-google-fonts.php';
} elseif ( class_exists( 'WP_Fonts' ) || class_exists( 'WP_Webfonts' ) ) {
	// WordPress 6.3 compat.
	require_once __DIR__ . '/wordpress-6.3/load-google-fonts.php';
}
