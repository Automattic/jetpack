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
function jetpack_get_google_fonts_data() {
	$default_google_fonts_api_url           = 'https://fonts.gstatic.com';
	$jetpack_google_fonts_collection_config = array(
		'id'          => 'jetpack-google-fonts-collection',
		'name'        => 'Jetpack Google Fonts',
		'description' => __( 'A curated collection provided by Jetpack Google Fonts module', 'jetpack' ),
		'src'         => 'https://s0.wp.com/i/font-collections/jetpack-google-fonts.json',
	);

	$jetpack_google_fonts_collection = new WP_Font_Collection( $jetpack_google_fonts_collection_config );
	$data                            = $jetpack_google_fonts_collection->get_data()['data'];

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
	$google_fonts_data          = jetpack_get_google_fonts_data();
	$google_fonts_families      = array_values(
		array_filter(
			$google_fonts_data['fontFamilies'],
			function ( $google_fonts_family ) use ( $available_google_fonts_map ) {
				return $available_google_fonts_map[ $google_fonts_family['name'] ];
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
