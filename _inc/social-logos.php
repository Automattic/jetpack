<?php
/**
 * Globally registers the 'social-logos' style and font.
 *
 * This ensures any theme or plugin using it is on the latest version of Social Logos, and helps to avoid conflicts.
 */
add_action( 'init', 'jetpack_register_social_logos', 1 );
function jetpack_register_social_logos() {
	if ( ! wp_style_is( 'social-logos', 'registered' ) ) {
		$post_fix = ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ? '' : '.min';
		wp_register_style( 'social-logos', plugins_url( 'social-logos/social-logos' . $post_fix . '.css', __FILE__ ), false, '1' );
	}
}

