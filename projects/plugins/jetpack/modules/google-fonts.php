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
);

const JETPACK_GOOGLE_FONTS_STYLES = array(
	'normal',
	'italic',
);

const JETPACK_GOOGLE_FONTS_WEIGHTS = array(
	'100',
	'200',
	'300',
	'400',
	'500',
	'600',
	'700',
	'800',
	'900',
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
		$fonts = array();

		$font_italic = array(
			'font-family'  => $font_family,
			'font-weight'  => '100 900',
			'font-style'   => 'normal',
			'font-display' => 'fallback',
			'provider'     => 'jetpack-google-fonts',
		);

		$font_normal = array(
			'font-family'  => $font_family,
			'font-weight'  => '100 900',
			'font-style'   => 'italic',
			'font-display' => 'fallback',
			'provider'     => 'jetpack-google-fonts',
		);

		// New WP Fonts API format since Gutenberg 14.9 requires keyed array
		// See https://github.com/Automattic/jetpack/issues/28063
		// Remove conditional once this experimental API makes it to WP Core, and after another core release.
		if ( class_exists( 'WP_Fonts' ) ) {
			$fonts = array(
				$font_family => array( $font_normal, $font_italic ),
			);
		} elseif ( class_exists( 'WP_Webfonts' ) ) {
			$fonts = array( $font_normal, $font_italic );
		}

		// New fonts register function since Gutenberg 15.0 or 15.1
		// See https://github.com/Automattic/jetpack/issues/28063#issuecomment-1387090575
		// Remove conditional once this experimental API makes it to WP Core, and after another core release.
		if ( function_exists( 'wp_register_fonts' ) ) {
			wp_register_fonts( $fonts );
		} else {
			wp_register_webfonts( $fonts );
		}
	}
}
add_action( 'after_setup_theme', 'jetpack_add_google_fonts_provider' );

add_filter( 'wp_resource_hints', '\Automattic\Jetpack\Fonts\Utils::font_source_resource_hint', 10, 2 );
add_filter( 'pre_render_block', '\Automattic\Jetpack\Fonts\Introspectors\Blocks::enqueue_block_fonts', 10, 2 );
// The priority for the next hook is is set to 22 because it needs to run after Gutenberg's
// re-registration (at priority 22) of the core blocks it de-registers (at the default priority 10),
// otherwise Gutenberg caches an incorrect state.
add_action( 'init', '\Automattic\Jetpack\Fonts\Introspectors\Global_Styles::enqueue_global_styles_fonts', 22 );

if ( ! class_exists( 'WP_Font_Library' ) || ! class_exists( 'WP_Font_Face' ) ) {
	return;
}

/**
 * Register google fonts to the theme json data
 *
 * @param WP_Theme_JSON_Data_Gutenberg $theme_json The theme json data of core.
 * @return WP_Theme_JSON_Data_Gutenberg The theme json data with registered google fonts.
 */
function jetpack_register_google_fonts_to_theme_json_theme( $theme_json ) {
	$google_font_families = apply_filters( 'jetpack_google_fonts_list', JETPACK_GOOGLE_FONTS_LIST );
	$google_font_styles   = apply_filters( 'jetpack_google_fonts_styles', JETPACK_GOOGLE_FONTS_STYLES );
	$google_font_weights  = apply_filters( 'jetpack_google_fonts_weights', JETPACK_GOOGLE_FONTS_WEIGHTS );

	$raw_data = $theme_json->get_data();
	if ( empty( $raw_data['settings']['typography']['fontFamilies']['theme'] ) ) {
		$raw_data['settings']['typography']['fontFamilies']['theme'] = array();
	}

	foreach ( $google_font_families as $font_family ) {
		$font_faces = array();

		foreach ( $google_font_styles as $font_style ) {
			foreach ( $google_font_weights as $font_weight ) {
				$font_face = array(
					'font-family' => $font_family,
					'font-style'  => $font_style,
					'font-weight' => $font_weight,
				);

				$font_faces[] = \Automattic\Jetpack\Fonts\Utils::get_webfont_font_face( $font_face );
			}
		}

		$raw_data['settings']['typography']['fontFamilies']['theme'][] = \Automattic\Jetpack\Fonts\Utils::convert_font_into_theme_json(
			$font_family,
			$font_faces
		);
	}

	$theme_json_class = get_class( $theme_json );
	return new $theme_json_class( $raw_data, 'theme' );
}

add_filter( 'wp_theme_json_data_theme', 'jetpack_register_google_fonts_to_theme_json_theme' );

if ( ! function_exists( 'jetpack_print_google_font_faces' ) ) {
	add_action( 'wp_head', 'jetpack_print_google_font_faces', 50 );
	add_action( 'admin_print_styles', 'jetpack_print_google_font_faces', 50 );

	/**
	 * Generates and prints font-face styles for given fonts or theme.json fonts.
	 *
	 * @param array[][] $fonts The given fonts.
	 */
	function jetpack_print_google_font_faces( $fonts = array() ) {
		if ( empty( $fonts ) ) {
			$fonts = WP_Font_Face_Resolver::get_fonts_from_theme_json();
		}

		if ( empty( $fonts ) ) {
			return;
		}

		$google_font_face = new \Automattic\Jetpack\Fonts\Google_Font_Face();
		$google_font_face->generate_and_print( $fonts );
	}
}

add_filter(
	'block_editor_settings_all',
	static function ( $settings ) {
		ob_start();
		jetpack_print_google_font_faces();
		$styles = ob_get_clean();

		// Add the font-face styles to iframed editor assets.
		$settings['__unstableResolvedAssets']['styles'] .= $styles;
		return $settings;
	},
	11
);
