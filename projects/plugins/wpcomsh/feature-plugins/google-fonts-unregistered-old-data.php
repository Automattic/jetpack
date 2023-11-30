<?php
/**
 * Sync changes, https://github.com/Automattic/jetpack/pull/34306, to resolve the font issues before next release of Jetpack.
 *
 * @package automattic/jetpack
 */

if ( ! function_exists( 'jetpack_unregister_deprecated_google_fonts_from_theme_json_data_user' ) ) {
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
							$provider = isset( $font_face['provider'] ) ? $font_face['provider'] : '';
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
	 * Unregister the google fonts data from user's theme json data that were stored by accident.
	 *
	 * @param WP_Theme_JSON_Data $theme_json The theme json data of user.
	 * @return WP_Theme_JSON_Data The filtered theme json data.
	 */
	function jetpack_unregister_deprecated_google_fonts_from_theme_json_data_user( $theme_json ) {
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

	add_filter( 'wp_theme_json_data_user', 'jetpack_unregister_deprecated_google_fonts_from_theme_json_data_user' );
}
