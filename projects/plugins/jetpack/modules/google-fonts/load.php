<?php
/**
 * Load the google fonts based on the current WordPress version.
 *
 * @package automattic/jetpack
 */

add_action(
	'plugins_loaded',
	function () {
		/**
		* Filters whether to skip loading the Jetpack Google Fonts module.
		*
		* This filter allows skipping the loading of the Jetpack Google Fonts module
		* based on specific conditions or requirements. By default, the module will
		* load normally. If the filter returns true, the module will be skipped.
		*
		* @module google-fonts
		*
		* @since 13.4
		*
		* @param bool $skip Whether to skip loading the Jetpack Google Fonts module. Default false.
		*/
		if ( apply_filters( 'jetpack_google_fonts_skip_load', false ) ) {
			return;
		}

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
