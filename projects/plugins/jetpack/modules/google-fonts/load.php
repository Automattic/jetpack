<?php
/**
 * Load the google fonts based on the current WordPress version.
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * The modules is loaded during the late_initialization action and it also hooks to the `after_setup_theme`.
 * See projects/plugins/jetpack/class.jetpack.php.
 */
add_action(
	'after_setup_theme',
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
	}
);
