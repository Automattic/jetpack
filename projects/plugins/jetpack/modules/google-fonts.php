<?php
/**
 * Module Name: Google Fonts (Beta)
 * Module Description: A selection of Google fonts for block enabled themes. This feature is still being developed.
 * Sort Order: 1
 * Recommendation Order: 2
 * First Introduced: 10.8.0
 * Requires Connection: No
 * Auto Activate: No
 * Module Tags: Fonts, Recommended
 * Feature: Writing
 * Additional Search Queries: fonts, webfonts, typography
 *
 * @package automattic/jetpack
 */

/**
 * Curated list of Google Fonts
 * See https://wp.me/p9Jlb4-22P
 */
const JETPACK_GOOGLE_FONTS_LIST = array(
	'Arvo',
	'Bodoni Moda',
	'Cabin',
	'Chivo',
	'Courier Prime',
	'DM Sans',
	'EB Garamond',
	'Fira Sans',
	'IBM Plex Sans',
	'IBM Plex Mono',
	'Inter',
	'Josefin Sans',
	'Jost',
	'Libre Baskerville',
	'Libre Franklin',
	'Literata',
	'Lora',
	'Merriweather',
	'Newsreader',
	'Nunito',
	'Overpass',
	'Playfair Display',
	'Roboto',
	'Roboto Slab',
	'Rubik',
	'Source Sans Pro',
	'Source Serif Pro',
	'Space Mono',
	'Texturina',
	'Work Sans',
);

// Deprecated fonts that were available before, and we don't show to customers anymore.
// They should keep functioning for existing sites and be available for enqueueing when used.
// See p9Jlb4-5Dj-p2#comment-6411
const JETPACK_GOOGLE_FONTS_DEPRECATED = array(
	'Domine',
	'Montserrat',
	'Open Sans',
	'Poppins',
	'Raleway',
);

/**
 * Register a curated selection of Google Fonts.
 *
 * @return void
 */
function jetpack_add_google_fonts_provider() {
	if ( ! function_exists( 'wp_register_webfont_provider' ) || ! function_exists( 'wp_register_webfonts' ) ) {
		return;
	}

	wp_register_webfont_provider( 'jetpack-google-fonts', '\Automattic\Jetpack\Fonts\Google_Fonts_Provider' );

	$fonts = array_merge( JETPACK_GOOGLE_FONTS_LIST, JETPACK_GOOGLE_FONTS_DEPRECATED );

	/**
	 * Curated list of Google Fonts.
	 *
	 * @module google-fonts
	 *
	 * @since 10.8
	 *
	 * @param array $fonts_to_register Array of Google Font names to register.
	 */
	$fonts_to_register = apply_filters( 'jetpack_google_fonts_list', $fonts );

	foreach ( $fonts_to_register as $font_family ) {
		$font_family_label = in_array( $font_family, JETPACK_GOOGLE_FONTS_DEPRECATED ) ? $font_family . ' (deprecated)' : $font_family;

		wp_register_webfonts(
			array(
				array(
					'font-family'  => $font_family_label,
					'font-weight'  => '100 900',
					'font-style'   => 'normal',
					'font-display' => 'fallback',
					'provider'     => 'jetpack-google-fonts',
				),
				array(
					'font-family'  => $font_family_label,
					'font-weight'  => '100 900',
					'font-style'   => 'italic',
					'font-display' => 'fallback',
					'provider'     => 'jetpack-google-fonts',
				),
			)
		);
	}
}
add_action( 'after_setup_theme', 'jetpack_add_google_fonts_provider' );

add_filter( 'wp_resource_hints', '\Automattic\Jetpack\Fonts\Utils::font_source_resource_hint', 10, 2 );
add_filter( 'pre_render_block', '\Automattic\Jetpack\Fonts\Introspectors\Blocks::enqueue_block_fonts', 10, 2 );
// The priority for the next hook is is set to 22 because it needs to run after Gutenberg's
// re-registration (at priority 22) of the core blocks it de-registers (at the default priority 10),
// otherwise Gutenberg caches an incorrect state.
add_action( 'init', '\Automattic\Jetpack\Fonts\Introspectors\Global_Styles::enqueue_global_styles_fonts', 22 );
