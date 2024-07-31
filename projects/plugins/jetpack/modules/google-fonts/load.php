<?php
/**
 * Load the google fonts based on the current WordPress version.
 *
 * @package automattic/jetpack
 */

add_action(
	'plugins_loaded',
	function () {
		if (
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
			apply_filters( 'jetpack_google_fonts_skip_load', false )
		) {
			return;
		}

		require_once __DIR__ . '/current/load-google-fonts.php';
	},
	// Ensure the action is loaded after the late_initialization.
	// See projects/plugins/jetpack/class.jetpack.php.
	999
);
