<?php
/**
 * Load the google fonts by the new Font Library. See pNEWy-hhx-p2.
 *
 * @package automattic/jetpack
 */

/**
 * Gets the Google Fonts data
 *
 * @return object[] The collection data of the Google Fonts.
 */
function jetpack_get_google_fonts_data() {
	$default_google_fonts_api_url        = 'https://fonts.gstatic.com';
	$jetpack_google_fonts_collection_url = 'https://s0.wp.com/i/font-collections/jetpack-google-fonts.json';
	$cache_key                           = 'jetpack_google_fonts_' . md5( $jetpack_google_fonts_collection_url );
	$data                                = get_transient( $cache_key );
	if ( $data === false ) {
		$response = wp_remote_get( $jetpack_google_fonts_collection_url );
		if ( is_wp_error( $response ) || wp_remote_retrieve_response_code( $response ) !== 200 ) {
			return null;
		}

		$data = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( $data === null ) {
			return null;
		}

		set_transient( $cache_key, $data, DAY_IN_SECONDS );
	}

	// Replace the google fonts api url if the custom one is provided.
	$custom_google_fonts_api_url = \esc_url(
		/** This filter is documented in projects/packages/google-fonts-provider/src/class-google-fonts-provider.php */
		apply_filters( 'jetpack_google_fonts_api_url', $default_google_fonts_api_url )
	);
	if ( $custom_google_fonts_api_url !== $default_google_fonts_api_url ) {
		foreach ( $data['fontFamilies'] as &$font_family ) {
			foreach ( $font_family['fontFace'] as &$font_face ) {
				$font_face['src'] = str_replace(
					$default_google_fonts_api_url,
					$custom_google_fonts_api_url,
					$font_face['src']
				);
			}
		}
	}

	return $data;
}

/**
 * Gets the map of the available Google Fonts
 *
 * @param object[] $google_fonts_data The collection data of the Google Fonts.
 * @return object[] The map of the the available Google Fonts.
 */
function jetpack_get_available_google_fonts_map( $google_fonts_data ) {
	$jetpack_google_fonts_list = array_map(
		function ( $font_family ) {
			return $font_family['name'];
		},
		$google_fonts_data['fontFamilies']
	);

	/** This filter is documented in modules/google-fonts/wordpress-6.3/load-google-fonts.php */
	$google_font_list           = apply_filters( 'jetpack_google_fonts_list', $jetpack_google_fonts_list );
	$available_google_fonts_map = array();

	foreach ( $google_font_list as $google_font ) {
		$available_google_fonts_map[ $google_font ] = true;
	}

	return $available_google_fonts_map;
}

/**
 * Gets the font families of the active theme
 *
 * @return object[] The font families of the active theme.
 */
function jetpack_get_theme_fonts_map() {
	if ( ! class_exists( 'WP_Theme_JSON_Resolver' ) ) {
		return array();
	}

	$theme_json = WP_Theme_JSON_Resolver::get_theme_data();
	$raw_data   = $theme_json->get_data();
	if ( empty( $raw_data['settings']['typography']['fontFamilies'] ) ) {
		return array();
	}

	$theme_fonts_map = array();
	foreach ( $raw_data['settings']['typography']['fontFamilies'] as $font_family ) {
		if ( isset( $font_family['name'] ) ) {
			$theme_fonts_map[ $font_family['name'] ] = true;
		}
	}

	return $theme_fonts_map;
}

/**
 * Register google fonts to the theme json data
 *
 * @param WP_Theme_JSON_Data $theme_json The theme json data of core.
 * @return WP_Theme_JSON_Data The theme json data with registered google fonts.
 */
function jetpack_register_google_fonts_to_theme_json( $theme_json ) {
	$google_fonts_data = jetpack_get_google_fonts_data();
	if ( ! $google_fonts_data ) {
		return $theme_json;
	}

	$available_google_fonts_map = jetpack_get_available_google_fonts_map( $google_fonts_data );
	$theme_fonts_map            = jetpack_get_theme_fonts_map();
	$google_fonts_families      = array_values(
		array_filter(
			$google_fonts_data['fontFamilies'],
			function ( $google_fonts_family ) use ( $available_google_fonts_map, $theme_fonts_map ) {
				$name = $google_fonts_family['name'];

				// Filter out the fonts that are provided by the active theme.
				if ( isset( $theme_fonts_map[ $name ] ) && $theme_fonts_map[ $name ] ) {
					return false;
				}

				return isset( $available_google_fonts_map[ $name ] )
					? $available_google_fonts_map[ $name ]
					: false;
			}
		)
	);

	$raw_data = $theme_json->get_data();
	$origin   = 'default';
	if ( empty( $raw_data['settings']['typography']['fontFamilies'][ $origin ] ) ) {
		$raw_data['settings']['typography']['fontFamilies'][ $origin ] = array();
	}

	foreach ( $google_fonts_families as $font_family ) {
		$raw_data['settings']['typography']['fontFamilies'][ $origin ][] = $font_family;
	}

	$theme_json_class = get_class( $theme_json );
	return new $theme_json_class( $raw_data, $origin );
}

add_filter( 'wp_theme_json_data_default', 'jetpack_register_google_fonts_to_theme_json' );

if ( ! class_exists( 'Jetpack_Google_Font_Face' ) ) {
	/**
	 * Load Jetpack Google Font Face
	 */
	require_once __DIR__ . '/class-jetpack-google-font-face.php';

	// Initialize Jetpack Google Font Face to avoid printing **ALL** google fonts provided by this module.
	// See p1700040028362329-slack-C4GAQ900P and p7DVsv-jib-p2
	new Jetpack_Google_Font_Face();
}
