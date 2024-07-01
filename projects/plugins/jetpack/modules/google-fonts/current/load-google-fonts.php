<?php
/**
 * Load the google fonts by the new Font Library. See pNEWy-hhx-p2.
 *
 * @package automattic/jetpack
 */

if ( ! class_exists( 'Jetpack_Google_Font_Face' ) ) {
	/**
	 * Load Jetpack Google Font Face
	 */
	require_once __DIR__ . '/class-jetpack-google-font-face.php';
}

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

	if ( is_array( $data ) && is_array( $data['fontFamilies'] ) ) {
		return $data;
	}
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

	/**
	 * Curated list of Google Fonts.
	 *
	 * @module google-fonts
	 *
	 * @since 10.8
	 *
	 * @param array $fonts_to_register Array of Google Font names to register.
	 */
	$google_font_list           = apply_filters( 'jetpack_google_fonts_list', $jetpack_google_fonts_list );
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
	$google_fonts_data = jetpack_get_google_fonts_data();
	if ( ! $google_fonts_data ) {
		return $theme_json;
	}

	$available_google_fonts_map = jetpack_get_available_google_fonts_map( $google_fonts_data );
	$google_fonts_families      = array_values(
		array_filter(
			$google_fonts_data['fontFamilies'],
			function ( $google_fonts_family ) use ( $available_google_fonts_map ) {
				$name = $google_fonts_family['name'];
				return $available_google_fonts_map[ $name ] ?? false;
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

/**
 * Filter out the deprecated font families that are from the jetpack-google-fonts provider.
 *
 * @param object[] $font_families The font families.
 * @return object[] The filtered font families.
 */
function jetpack_google_fonts_filter_out_deprecated_font_data( $font_families ) {
	return array_values(
		array_filter(
			$font_families,
			function ( $font_family ) {
				$has_deprecated_google_fonts_data = false;

				if ( isset( $font_family['fontFace'] ) ) {
					foreach ( $font_family['fontFace'] as $font_face ) {
						$provider = $font_face['provider'] ?? '';
						if ( $provider === 'jetpack-google-fonts' ) {
							$has_deprecated_google_fonts_data = true;
							break;
						}
					}
				}

				return ! $has_deprecated_google_fonts_data;
			}
		)
	);
}

/**
 * Unregister the deprecated jetpack-google-fonts provider from theme json data that were stored
 * before we moved to the Font Library.
 *
 * @param WP_Theme_JSON_Data $theme_json The theme json data.
 * @return WP_Theme_JSON_Data The filtered theme json data.
 */
function jetpack_unregister_deprecated_google_fonts_from_theme_json_data( $theme_json ) {
	$raw_data = $theme_json->get_data();
	$origin   = 'theme';
	if ( empty( $raw_data['settings']['typography']['fontFamilies'][ $origin ] ) ) {
		return $theme_json;
	}

	// Filter out the font definitions that are from the jetpack-google-fonts provider.
	$raw_data['settings']['typography']['fontFamilies'][ $origin ] = jetpack_google_fonts_filter_out_deprecated_font_data(
		$raw_data['settings']['typography']['fontFamilies'][ $origin ]
	);

	$theme_json_class = get_class( $theme_json );
	return new $theme_json_class( $raw_data, 'custom' );
}

add_filter( 'wp_theme_json_data_theme', 'jetpack_unregister_deprecated_google_fonts_from_theme_json_data' );
add_filter( 'wp_theme_json_data_user', 'jetpack_unregister_deprecated_google_fonts_from_theme_json_data' );

// Initialize Jetpack Google Font Face to avoid printing **ALL** google fonts provided by this module.
// See p1700040028362329-slack-C4GAQ900P and p7DVsv-jib-p2
new Jetpack_Google_Font_Face();
