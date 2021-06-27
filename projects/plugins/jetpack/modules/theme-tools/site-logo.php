<?php
/*
 * Site Logo.
 * @see https://jetpack.com/support/site-logo/
 *
 * This feature will only be activated for themes that declare their support.
 * This can be done by adding code similar to the following during the
 * 'after_setup_theme' action:
 *
 * $args = array(
 * 	'header-text' => array(
 * 		'site-title',
 * 		'site-description',
 * 	),
 * 	'size' => 'medium',
 * );
 * add_theme_support( 'site-logo', $args );
 *
 */

/**
 * Activate the Site Logo plugin.
 *
 * @uses current_theme_supports()
 * @since 3.2
 */
function site_logo_init() {
	// For transferring existing site logo from Jetpack -> Core
	if ( current_theme_supports( 'custom-logo' ) && ! get_theme_mod( 'custom_logo' ) && $jp_logo = get_option( 'site_logo' ) ) {
		set_theme_mod( 'custom_logo', $jp_logo );
	}

	// Only load our code if our theme declares support, and the standalone plugin is not activated.
	if ( current_theme_supports( 'site-logo' ) && ! class_exists( 'Site_Logo', false ) ) {
		// Load our class for namespacing.
		require dirname( __FILE__ ) . '/site-logo/inc/class-site-logo.php';

		// Load template tags.
		require dirname( __FILE__ ) . '/site-logo/inc/functions.php';

		// Load backwards-compatible template tags.
		require dirname( __FILE__ ) . '/site-logo/inc/compat.php';
	}
}
add_action( 'init', 'site_logo_init' );

/**
 * Transforms the legacy site_logo array, when present, into an attachment ID.
 *
 * The attachment ID is the format used for the site_logo option by the Site Logo block.
 *
 * @param int|array $site_logo Option.
 * @return int
 */
function jetpack_site_logo_block_compat( $site_logo ) {
	if ( is_array( $site_logo ) && isset( $site_logo['id'] ) ) {
		return $site_logo['id'];
	}
}
add_action( 'option_site_logo', 'jetpack_site_logo_block_compat' );
