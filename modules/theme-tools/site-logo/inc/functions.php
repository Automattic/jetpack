<?php
/**
 * Functions and template tags for using site logos.
 *
 * @package Jetpack
 */

/**
 * Retrieve the site logo URL or ID (URL by default). Pass in the string 'id' for ID.
 *
 * @uses get_option()
 * @uses esc_url_raw()
 * @uses set_url_scheme()
 * @return mixed The URL or ID of our site logo, false if not set
 * @since 1.0
 */
function jetpack_get_site_logo( $show = 'url' ) {
	$logo = site_logo()->logo;

	// Return false if no logo is set
	if ( ! isset( $logo['id'] ) || 0 == $logo['id'] ) {
		return false;
	}

	// Return the ID if specified, otherwise return the URL by default
	if ( 'id' == $show ) {
		return $logo['id'];
	} else {
		return esc_url_raw( set_url_scheme( $logo['url'] ) );
	}
}

/**
 * Determine if a site logo is assigned or not.
 *
 * @uses get_option
 * @return boolean True if there is an active logo, false otherwise
 */
function jetpack_has_site_logo() {
	return site_logo()->has_site_logo();
}

/**
 * Output an <img> tag of the site logo, at the size specified
 * in the theme's add_theme_support() declaration.
 *
 * @uses Site_Logo::logo
 * @uses Site_Logo::theme_size()
 * @uses jetpack_has_site_logo()
 * @uses jetpack_is_customize_preview()
 * @uses esc_url()
 * @uses home_url()
 * @uses esc_attr()
 * @uses wp_get_attachment_image()
 * @uses apply_filters()
 * @since 1.0
 */
function jetpack_the_site_logo() {
	$logo = site_logo()->logo;
	$size = site_logo()->theme_size();

	// Bail if no logo is set. Leave a placeholder if we're in the Customizer, though (needed for the live preview).
	if ( ! jetpack_has_site_logo() ) {
		if ( jetpack_is_customize_preview() ) {
			printf( '<a href="%1$s" class="site-logo-link" style="display:none;"><img class="site-logo" data-size="%2$s" /></a>',
				esc_url( home_url( '/' ) ),
				esc_attr( $size )
			);
		}
		return;
	}

	// We have a logo. Logo is go.
	$html = sprintf( '<a href="%1$s" class="site-logo-link" rel="home">%2$s</a>',
		esc_url( home_url( '/' ) ),
		wp_get_attachment_image(
			$logo['id'],
			$size,
			false,
			array(
				'class'     => "site-logo attachment-$size",
				'data-size' => $size,
			)
		)
	);

	echo apply_filters( 'jetpack_the_site_logo', $html, $logo, $size );
}

/**
 * Whether the site is being previewed in the Customizer.
 * Duplicate of core function until 4.0 is released.
 *
 * @global WP_Customize_Manager $wp_customize Customizer instance.
 * @return bool True if the site is being previewed in the Customizer, false otherwise.
 */
function jetpack_is_customize_preview() {
	global $wp_customize;

	return is_a( $wp_customize, 'WP_Customize_Manager' ) && $wp_customize->is_preview();
}

/**
 * Sanitize the string of classes used for header text.
 * Limit to A-Z,a-z,0-9,(space),(comma),_,-
 *
 * @return string Sanitized string of CSS classes.
 */
function jetpack_sanitize_header_text_classes( $classes ) {
	$classes = preg_replace( '/[^A-Za-z0-9\,\ ._-]/', '', $classes );

	return $classes;
}
