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
 * See p9Jlb4-22P, p9Jlb4-44k-p2 and p9Jlb4-5Dj-p2
 */
const JETPACK_GOOGLE_FONTS_LIST = array(
	'Albert Sans',
	'Alegreya',
	'Arvo',
	'Bodoni Moda',
	'Cabin',
	'Chivo',
	'Commissioner',
	'Cormorant',
	'Courier Prime',
	'Crimson Pro',
	'DM Mono',
	'DM Sans',
	'Domine',
	'EB Garamond',
	'Epilogue',
	'Figtree',
	'Fira Sans',
	'Fraunces',
	'IBM Plex Mono',
	'IBM Plex Sans',
	'Inter',
	'Josefin Sans',
	'Jost',
	'Libre Baskerville',
	'Libre Franklin',
	'Literata',
	'Lora',
	'Merriweather',
	'Montserrat',
	'Newsreader',
	'Nunito',
	'Open Sans',
	'Overpass',
	'Petrona',
	'Piazzolla',
	'Playfair Display',
	'Plus Jakarta Sans',
	'Poppins',
	'Raleway',
	'Roboto Slab',
	'Roboto',
	'Rubik',
	'Sora',
	'Source Sans Pro',
	'Source Serif Pro',
	'Space Mono',
	'Texturina',
	'Work Sans',

	// Keep i18n fonts at the end of the fonts list. These are provided different names at `jetpack_rename_google_font_names()` function.
	'Alexandria',
	'IBM Plex Sans Arabic',
	'Noto Sans Hebrew',
	'Noto Sans HK',
	'Noto Sans JP',
	'Noto Sans KR',
	'Noto Sans SC',
	'Noto Sans TC',
	'Noto Sans Telugu',
	'Noto Serif Hebrew',
	'Noto Serif HK',
	'Noto Serif JP',
	'Noto Serif KR',
	'Noto Serif SC',
	'Noto Serif TC',
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

	/**
	 * Curated list of Google Fonts.
	 *
	 * @module google-fonts
	 *
	 * @since 10.8
	 *
	 * @param array $fonts_to_register Array of Google Font names to register.
	 */
	$fonts_to_register = apply_filters( 'jetpack_google_fonts_list', JETPACK_GOOGLE_FONTS_LIST );

	foreach ( $fonts_to_register as $font_family ) {
		wp_register_webfonts(
			array(
				array(
					'font-family'  => $font_family,
					'font-weight'  => '100 900',
					'font-style'   => 'normal',
					'font-display' => 'fallback',
					'provider'     => 'jetpack-google-fonts',
				),
				array(
					'font-family'  => $font_family,
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

/**
 * Updates font names by filtering the data provided by the theme for global styles & settings.
 *
 * `wp_register_webfonts()` does not currently support giving a separate "name"
 * from "font-family", even if theme.json schema itself does support it.
 * See: https://github.com/WordPress/gutenberg/issues/46398
 *
 * Once support for "name" is added, below functionality can be refactored
 * to provide the name directly within `wp_register_webfonts()`.
 *
 * @param WP_Theme_JSON_Data_Gutenberg $theme_json Class to access and update the underlying data.
 * @return WP_Theme_JSON_Data_Gutenberg Class with updated Global Styles settings.
 */
function jetpack_rename_google_font_names( $theme_json ) {
	$raw_data      = $theme_json->get_data();
	$font_families = $raw_data['settings']['typography']['fontFamilies']['theme'];

	$renamed_fonts = array(
		'Alexandria'           => _x( 'Alexandria (Arabic)', 'Font name', 'jetpack' ),
		'IBM Plex Sans Arabic' => _x( 'IBM Plex Sans (Arabic)', 'Font name', 'jetpack' ),
		'Noto Sans Hebrew'     => _x( 'Noto Sans (Hebrew)', 'Font name', 'jetpack' ),
		'Noto Sans HK'         => _x( 'Noto Sans (Hong Kong)', 'Font name', 'jetpack' ),
		'Noto Sans JP'         => _x( 'Noto Sans (Japanese)', 'Font name', 'jetpack' ),
		'Noto Sans KR'         => _x( 'Noto Sans (Korean)', 'Font name', 'jetpack' ),
		'Noto Sans SC'         => _x( 'Noto Sans (Simplified Chinese)', 'Font name', 'jetpack' ),
		'Noto Sans TC'         => _x( 'Noto Sans (Traditional Chinese)', 'Font name', 'jetpack' ),
		'Noto Sans Telugu'     => _x( 'Noto Sans (Telugu)', 'Font name', 'jetpack' ),
		'Noto Serif Hebrew'    => _x( 'Noto Serif (Hebrew)', 'Font name', 'jetpack' ),
		'Noto Serif HK'        => _x( 'Noto Serif (Hong Kong)', 'Font name', 'jetpack' ),
		'Noto Serif JP'        => _x( 'Noto Serif (Japanese)', 'Font name', 'jetpack' ),
		'Noto Serif KR'        => _x( 'Noto Serif (Korean)', 'Font name', 'jetpack' ),
		'Noto Serif SC'        => _x( 'Noto Serif (Simplified Chinese)', 'Font name', 'jetpack' ),
		'Noto Serif TC'        => _x( 'Noto Serif (Traditional Chinese)', 'Font name', 'jetpack' ),
	);

	foreach ( $font_families as $key => $font_family ) {
		$font_name = $font_family['name'];

		if ( array_key_exists( $font_name, $renamed_fonts ) ) {
			$font_families[ $key ]['name'] = $renamed_fonts[ $font_name ];
		}
	}

	// See https://developer.wordpress.org/block-editor/reference-guides/theme-json-reference/theme-json-living/#typography
	$updated_fonts = array(
		'version'  => 2,
		'settings' => array(
			'typography' => array(
				'fontFamilies' => $font_families,
			),
		),
	);

	return $theme_json->update_with( $updated_fonts );
}
add_filter( 'wp_theme_json_data_theme', 'jetpack_rename_google_font_names' );

add_filter( 'wp_resource_hints', '\Automattic\Jetpack\Fonts\Utils::font_source_resource_hint', 10, 2 );
add_filter( 'pre_render_block', '\Automattic\Jetpack\Fonts\Introspectors\Blocks::enqueue_block_fonts', 10, 2 );
// The priority for the next hook is is set to 22 because it needs to run after Gutenberg's
// re-registration (at priority 22) of the core blocks it de-registers (at the default priority 10),
// otherwise Gutenberg caches an incorrect state.
add_action( 'init', '\Automattic\Jetpack\Fonts\Introspectors\Global_Styles::enqueue_global_styles_fonts', 22 );
