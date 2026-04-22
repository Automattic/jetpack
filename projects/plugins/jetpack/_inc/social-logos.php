<?php
/**
 * Social Logos
 * Icon Font of the social logos we use on WordPress.com and in Jetpack
 *
 * Reference: https://github.com/Automattic/social-logos
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

define( 'JETPACK_SOCIAL_LOGOS_URL', plugin_dir_url( __FILE__ ) . 'build/social-logos/' );
define( 'JETPACK_SOCIAL_LOGOS_DIR', plugin_dir_path( __FILE__ ) . 'build/social-logos/' );

/**
 * Globally registers the 'social-logos' style and font.
 *
 * This ensures any theme or plugin using it is on the latest version of Social Logos, and helps to avoid conflicts.
 */
function jetpack_register_social_logos() {
	if ( ! wp_style_is( 'social-logos', 'registered' ) ) {
		wp_register_style(
			'social-logos',
			JETPACK_SOCIAL_LOGOS_URL . 'social-logos.css',
			false,
			JETPACK__VERSION
		);
	}
}
