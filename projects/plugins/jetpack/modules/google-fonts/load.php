<?php
/**
 * Load the google fonts based on the current WordPress version.
 *
 * @package automattic/jetpack
 */

add_action(
	'plugins_loaded',
	function () {
		if ( class_exists( 'WP_Font_Face' ) ) {
			// WordPress 6.5 or above with the new Font Library.
			require_once __DIR__ . '/current/load-google-fonts.php';
		} elseif ( class_exists( 'WP_Fonts' ) || class_exists( 'WP_Webfonts' ) ) {
			// Gutenberg Fonts API compatible.
			require_once __DIR__ . '/wordpress-6.3/load-google-fonts.php';
		}
	},
	// Ensure the action is loaded after the late_initialization.
	// See projects/plugins/jetpack/class.jetpack.php.
	999
);
