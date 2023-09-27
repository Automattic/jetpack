<?php
/**
 * Load the google fonts by the new Font Library. See https://wp.me/pNEWy-hhx.
 *
 * @package automattic/jetpack
 */

/**
 * Gets the Google Fonts data
 *
 * @return object[] The Google Fonts data.
 */
function jetpack_get_google_fonts() {
	$file_path = __DIR__ . '/google-fonts.json';
	$data      = wp_json_file_decode( $file_path, array( 'associative' => true ) );
	return $data;
}

/**
 * Gets the map of the available Google Fonts
 *
 * @return object[] The map of the the available Google Fonts.
 */
function jetpack_get_available_google_fonts_map() {
	$google_font_list           = apply_filters( 'jetpack_google_fonts_list', JETPACK_GOOGLE_FONTS_LIST );
	$available_google_fonts_map = array();

	foreach ( $google_font_list as $google_font ) {
		$available_google_fonts_map[ $google_font ] = true;
	}

	return $available_google_fonts_map;
}

/**
 * Register google fonts to the theme json data
 *
 * @param WP_Theme_JSON_Data $theme_json The theme json data of core.
 * @return WP_Theme_JSON_Data The theme json data with registered google fonts.
 */
function jetpack_register_google_fonts_to_theme_json( $theme_json ) {
	$available_google_fonts_map = jetpack_get_available_google_fonts_map();
	$google_fonts               = jetpack_get_google_fonts();
	$google_fonts               = array_filter(
		$google_fonts,
		function ( $google_font ) use ( $available_google_fonts_map ) {
			return $available_google_fonts_map[ $google_font['name'] ];
		}
	);

	$raw_data = $theme_json->get_data();
	$origin   = 'theme';
	if ( empty( $raw_data['settings']['typography']['fontFamilies'][ $origin ] ) ) {
		$raw_data['settings']['typography']['fontFamilies'][ $origin ] = array();
	}

	foreach ( $google_fonts as $google_font ) {
		foreach ( $google_font['fontFace'] as &$font_face ) {
			$font_face['src'] = \Automattic\Jetpack\Fonts\Google_Font_Face::get_font_url(
				array(
					'font-family' => $font_face['fontFamily'],
					'font-style'  => $font_face['fontStyle'],
					'font-weight' => $font_face['fontWeight'],
				)
			);
		}

		$raw_data['settings']['typography']['fontFamilies'][ $origin ][] = $google_font;
	}

	$theme_json_class = get_class( $theme_json );
	return new $theme_json_class( $raw_data, $origin );
}

add_filter( 'wp_theme_json_data_theme', 'jetpack_register_google_fonts_to_theme_json' );

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
