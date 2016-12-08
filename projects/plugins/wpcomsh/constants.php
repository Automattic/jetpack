<?php

/**
 * You also need to define two more constants in the `private-constants.php` file.
 * These constants will point to WPCom pub (free) and premium themes.
 * Example of `private-constants.php` file:
 *
 * define( 'JETPRESS_WPCOM_PUB_THEMES_PATH', '/srv/www/wpcom-pub-themes' );
 * define( 'JETPRESS_WPCOM_PREMIUM_THEMES_PATH', '/srv/www/wpcom-premium-themes' );
 *
 */

$current_dir = dirname( __FILE__ );

if ( file_exists( "$current_dir/private-constants.php" ) ) {
	require_once( 'private-constants.php' );
} else {
	// This won't work. Just a fallback so functions in this plugin return false instead of warning/error.
	define( 'JETPRESS_WPCOM_PUB_THEMES_PATH', $current_dir );
	define( 'JETPRESS_WPCOM_PREMIUM_THEMES_PATH', $current_dir );

	error_log(
		'Jetpress: define JETPRESS_WPCOM_PUB_THEMES_PATH and JETPRESS_WPCOM_PREMIUM_THEMES_PATH ' .
		'so they point to the correct WPCom themes paths.'
	);
}

define( 'JETPRESS_WPCOM_PUB_THEME_TYPE', 'wpcom_pub_theme_type' );
define( 'JETPRESS_WPCOM_PREMIUM_THEME_TYPE', 'wpcom_premium_theme_type' );
define( 'JETPRESS_NON_WPCOM_THEME', 'non_wpcom_theme' );
