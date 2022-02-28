<?php
/**
 * Module Name: Google Fonts
 * Module Description: A selection of Google fonts for Block enabled themes.
 * Sort Order: 1
 * Recommendation Order: 2
 * First Introduced: $$next-version$$
 * Requires Connection: No
 * Auto Activate: No
 * Module Tags: Fonts, Recommended
 * Feature: Writing
 * Additional Search Queries: fonts, webfonts, typography
 *
 * @package automattic/jetpack
 */

if ( ! function_exists( 'wp_register_webfont_provider' ) || ! function_exists( 'wp_register_webfonts' ) ) {
	return;
}

const JETPACK_GOOGLE_FONTS_LIST = array(
	'Arvo',
	'Bodoni Moda',
	'Cabin',
	'Chivo',
	'Courier Prime',
	'DM Sans',
	'Domine',
	'EB Garamond',
	'Fira Sans',
	'Inter',
	'Josefin Sans',
	'Libre Baskerville',
	'Libre Franklin',
	'Lora',
	'Merriweather',
	'Montserrat',
	'Nunito',
	'Open Sans',
	'Overpass',
	'Playfair Display',
	'Poppins',
	'Raleway',
	'Roboto',
	'Roboto Slab',
	'Rubik',
	'Source Sans Pro',
	'Source Serif Pro',
	'Space Mono',
	'Work Sans',
);

/**
 * Register a curated selection of Google Fonts.
 *
 * @return void
 */
function jetpack_add_google_fonts_provider() {
	wp_register_webfont_provider( 'google-fonts', '\Automattic\Jetpack\Fonts\Google_Fonts_Provider' );

	$fonts_to_register = apply_filters( 'jetpack_google_fonts_list', JETPACK_GOOGLE_FONTS_LIST );

	foreach ( $fonts_to_register as $font_family ) {
		wp_register_webfonts(
			array(
				array(
					'font-family' => $font_family,
					'provider'    => 'google-fonts',
				),
			)
		);
	}
}
add_action( 'after_setup_theme', 'jetpack_add_google_fonts_provider' );
