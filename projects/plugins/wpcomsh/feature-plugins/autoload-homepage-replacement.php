<?php
/**
 * Loads required hooks to set up homepage replacement.
 *
 * @package wpcomsh
 */

// Include necessary functions for homepage replacement.
require_once __DIR__ . '/class-template-first-themes.php';
Template_First_Themes::get_instance();

/**
 * Based on the request arguments disables the homepage replacement process
 * after changing a theme.
 *
 * @param string $theme_name   The name of the theme that the site is being switched to.
 * @param array  $request_args The arguments passed to the POST request to change the theme.
 */
function wpcomsh_replace_homepage_on_theme_switch( $theme_name, $request_args ) {
	if ( isset( $request_args['dont_change_homepage'] ) && $request_args['dont_change_homepage'] === true ) {
		// Stop class-template-first-themes.php from making changes to homepage content.
		remove_action( 'switch_theme', array( Template_First_Themes::get_instance(), 'update_homepage_template' ) );
	}
}
add_action( 'jetpack_pre_switch_theme', 'wpcomsh_replace_homepage_on_theme_switch', 10, 2 );

/**
 * Disables homepage replacement when invoked from CLI to preserve original behaviour.
 */
function wpcomsh_disable_homepage_switch_on_cli() {
	remove_action( 'switch_theme', array( Template_First_Themes::get_instance(), 'update_homepage_template' ) );
}

add_action( 'cli_init', 'wpcomsh_disable_homepage_switch_on_cli' );
