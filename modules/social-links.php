<?php
/**
 * Themes must declare that they support this module by adding
 * add_theme_support( 'social-links' ); on 'after_setup_theme'.
 */
function jetpack_load_additional_modules() {
	if ( current_theme_supports( 'social-links' ) )
		require_once 'social-links/social-links.php';
}
add_action( 'init', 'jetpack_load_additional_modules' );
