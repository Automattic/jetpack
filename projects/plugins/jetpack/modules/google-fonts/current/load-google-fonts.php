<?php
/**
 * Load the google fonts by the new Font Library. See https://wp.me/pNEWy-hhx.
 *
 * @package automattic/jetpack
 */

/**
 * Gets the Google Fonts data
 *
 * @return object[] The collection data of the Google Fonts.
 */
function jetpack_get_google_fonts_data() {
	$default_google_fonts_api_url           = 'https://fonts.gstatic.com';
	$jetpack_google_fonts_collection_config = array(
		'id'          => 'jetpack-google-fonts-collection',
		'name'        => 'Jetpack Google Fonts',
		'description' => __( 'A curated collection provided by Jetpack Google Fonts module', 'jetpack' ),
		'src'         => 'https://s0.wp.com/i/font-collections/jetpack-google-fonts.json',
	);

	$jetpack_google_fonts_collection = new WP_Font_Collection( $jetpack_google_fonts_collection_config );
	$data                            = $jetpack_google_fonts_collection->get_data();
	if ( is_wp_error( $data ) ) {
		return null;
	}

	$data = $data['data'];

	// Replace the google fonts api url if the custom one is provided.
	$custom_google_fonts_api_url = \esc_url( apply_filters( 'jetpack_google_fonts_api_url', '' ) );
	if ( $custom_google_fonts_api_url ) {
		foreach ( $data['fontFamilies'] as $font_family ) {
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
	$jetpack_google_fonts_list  = array_map(
		function ( $font_family ) {
			return $font_family['name'];
		},
		$google_fonts_data['fontFamilies']
	);
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
	if ( ! class_exists( 'WP_Theme_JSON_Resolver_Gutenberg' ) ) {
		return array();
	}

	$theme_json = WP_Theme_JSON_Resolver_Gutenberg::get_theme_data();
	$raw_data   = $theme_json->get_data();
	if ( empty( $raw_data['settings']['typography']['fontFamilies'] ) ) {
		return array();
	}

	$theme_fonts_map = array();
	foreach ( $raw_data['settings']['typography']['fontFamilies'] as $font_family ) {
		$theme_fonts_map[ $font_family['name'] ] = true;
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
