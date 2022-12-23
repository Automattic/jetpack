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

	// Rename only in the editor and API requests
	if ( is_admin() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
		$raw_data = $theme_json->get_data();

		// Skip if fontFamilies are not defined in the variation.
		if ( empty( $raw_data['settings']['typography']['fontFamilies']['theme'] ) ) {
			return $theme_json;
		}

		$font_families = $raw_data['settings']['typography']['fontFamilies']['theme'];

		$renamed_fonts = array(
			/* translators: %s is a font name, followed by character set/script name. */
			'Alexandria'           => sprintf( __( '%s (Arabic)', 'jetpack' ), 'Alexandria' ),
			/* translators: %s is a font name, followed by character set/script name. */
			'IBM Plex Sans Arabic' => sprintf( __( '%s (Arabic)', 'jetpack' ), 'IBM Plex Sans' ),
			/* translators: %s is a font name, followed by character set/script name. */
			'Noto Sans Hebrew'     => sprintf( __( '%s (Hebrew)', 'jetpack' ), 'Noto Sans' ),
			/* translators: %s is a font name, followed by character set/script name. */
			'Noto Sans HK'         => sprintf( __( '%s (Hong Kong)', 'jetpack' ), 'Noto Sans' ),
			/* translators: %s is a font name, followed by character set/script name. */
			'Noto Sans JP'         => sprintf( __( '%s (Japanese)', 'jetpack' ), 'Noto Sans' ),
			/* translators: %s is a font name, followed by character set/script name. */
			'Noto Sans KR'         => sprintf( __( '%s (Korean)', 'jetpack' ), 'Noto Sans' ),
			/* translators: %s is a font name, followed by character set/script name. */
			'Noto Sans SC'         => sprintf( __( '%s (Simplified Chinese)', 'jetpack' ), 'Noto Sans' ),
			/* translators: %s is a font name, followed by character set/script name. */
			'Noto Sans TC'         => sprintf( __( '%s (Traditional Chinese)', 'jetpack' ), 'Noto Sans' ),
			/* translators: %s is a font name, followed by character set/script name. */
			'Noto Sans Telugu'     => sprintf( __( '%s (Telugu)', 'jetpack' ), 'Noto Sans' ),
			/* translators: %s is a font name, followed by character set/script name. */
			'Noto Serif Hebrew'    => sprintf( __( '%s (Hebrew)', 'jetpack' ), 'Noto Serif' ),
			/* translators: %s is a font name, followed by character set/script name. */
			'Noto Serif HK'        => sprintf( __( '%s (Hong Kong)', 'jetpack' ), 'Noto Serif' ),
			/* translators: %s is a font name, followed by character set/script name. */
			'Noto Serif JP'        => sprintf( __( '%s (Japanese)', 'jetpack' ), 'Noto Serif' ),
			/* translators: %s is a font name, followed by character set/script name. */
			'Noto Serif KR'        => sprintf( __( '%s (Korean)', 'jetpack' ), 'Noto Serif' ),
			/* translators: %s is a font name, followed by character set/script name. */
			'Noto Serif SC'        => sprintf( __( '%s (Simplified Chinese)', 'jetpack' ), 'Noto Serif' ),
			/* translators: %s is a font name, followed by character set/script name. */
			'Noto Serif TC'        => sprintf( __( '%s (Traditional Chinese)', 'jetpack' ), 'Noto Serif' ),
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

	return $theme_json;
}
add_filter( 'wp_theme_json_data_theme', 'jetpack_rename_google_font_names' );

add_filter( 'wp_resource_hints', '\Automattic\Jetpack\Fonts\Utils::font_source_resource_hint', 10, 2 );
add_filter( 'pre_render_block', '\Automattic\Jetpack\Fonts\Introspectors\Blocks::enqueue_block_fonts', 10, 2 );
// The priority for the next hook is is set to 22 because it needs to run after Gutenberg's
// re-registration (at priority 22) of the core blocks it de-registers (at the default priority 10),
// otherwise Gutenberg caches an incorrect state.
add_action( 'init', '\Automattic\Jetpack\Fonts\Introspectors\Global_Styles::enqueue_global_styles_fonts', 22 );
