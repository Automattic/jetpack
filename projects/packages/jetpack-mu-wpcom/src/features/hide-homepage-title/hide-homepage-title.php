<?php
/**
 * Allow homepage title to be edited even when hidden Lighter color to signify not visible from front page
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * Can be used to determine if the current screen is the block editor.
 *
 * @return bool True if the current screen is a block editor screen. False otherwise.
 */
function wpcom_is_block_editor_screen() {
	return is_callable( 'get_current_screen' ) && get_current_screen() && get_current_screen()->is_block_editor();
}

/**
 * Detects if the current page is the homepage post editor, and if the homepage
 * title is hidden.
 *
 * @return bool True if the homepage title features should be used. (See above.)
 */
function wpcom_is_homepage_title_hidden() {
	global $post;

	// Handle the case where we are not rendering a post.
	if ( ! isset( $post ) ) {
		return false;
	}

	$hide_homepage_title = (bool) get_theme_mod( 'hide_front_page_title', false );
	$is_homepage         = ( (int) get_option( 'page_on_front' ) === $post->ID );
	return (bool) wpcom_is_block_editor_screen() && $hide_homepage_title && $is_homepage;
}

/**
 * Adds custom classes to the admin body classes.
 *
 * @param string $classes Classes for the body element.
 * @return string
 */
function wpcom_add_hide_homepage_title_class_if_needed( $classes ) {
	if ( wpcom_is_homepage_title_hidden() ) {
		$classes .= ' hide-homepage-title ';
	}

	return $classes;
}
add_filter( 'admin_body_class', 'wpcom_add_hide_homepage_title_class_if_needed' );

/**
 * Enqueue assets
 */
function wpcom_enqueue_hide_homepage_title_assets() {
	if ( ! wpcom_is_homepage_title_hidden() ) {
		return;
	}

	wp_enqueue_style(
		'wpcom-hide-homepage-title',
		plugins_url( 'hide-homepage-title.css', __FILE__ ),
		array(),
		Jetpack_Mu_Wpcom::PACKAGE_VERSION
	);
}
add_action( 'admin_enqueue_scripts', 'wpcom_enqueue_hide_homepage_title_assets' );
