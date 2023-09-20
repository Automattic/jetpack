<?php
/**
 * Google Fonts package Utils class file.
 *
 * @package automattic/jetpack-google-fonts-provider
 */

namespace Automattic\Jetpack\Fonts;

/**
 * Provides utility methods for the Google Fonts Provider package.
 */
class Utils {
	/**
	 * Adds a preconnect link for improving performance when downloading Google Font files.
	 * Only do so if the site supports the Webfonts API.
	 *
	 * @param array  $urls          Array of resources and their attributes, or URLs to print for resource hints.
	 * @param string $relation_type The relation type the URLs are printed for, e.g. 'preconnect' or 'prerender'.
	 */
	public static function font_source_resource_hint( $urls, $relation_type ) {
		if (
			'preconnect' === $relation_type
			&& class_exists( 'WP_Webfonts_Provider' )
		) {
			$urls[] = array(
				'href' => 'https://fonts.gstatic.com',
				'crossorigin',
			);
		}

		return $urls;
	}

	/**
	 * Check if a font family is registered (verifying that it can be enqueued).
	 *
	 * This function will not be needed if/when WP_Webfonts provides this functionality.
	 *
	 * @link https://github.com/WordPress/gutenberg/pull/39988
	 * @link https://github.com/WordPress/gutenberg/blob/e94fffae0684aa5a6dc370ce3eba262cb77071d9/lib/experimental/class-wp-webfonts.php#L217
	 *
	 * @param string $font_family_name Name of font family.
	 * @return boolean|void Whether the font family is registered, or void if WP_Webfonts is not available.
	 */
	public static function is_font_family_registered( $font_family_name ) {
		// New WP Fonts API since Gutenberg 14.9
		// Remove conditional once this experimental API makes it to WP Core, and after another core release.
		// See https://github.com/Automattic/jetpack/issues/28063
		if ( class_exists( 'WP_Fonts' ) ) {
			if (
				! function_exists( 'wp_webfonts' ) ||
				! class_exists( 'WP_Web_Fonts' ) ||
				! class_exists( 'WP_Fonts_Utils' )
			) {
				return;
			}

			$wp_webfonts = wp_webfonts();

			if ( ! method_exists( $wp_webfonts, 'get_registered_font_families' ) ) {
				return;
			}

			$handle = \WP_Fonts_Utils::convert_font_family_into_handle( $font_family_name );

			return in_array( $handle, $wp_webfonts->get_registered_font_families(), true );

			// Old deprecated WP Fonts API pre-Gutenberg 14.9
		} elseif ( class_exists( 'WP_Webfonts' ) ) {
			if ( ! function_exists( 'wp_webfonts' ) || ! method_exists( 'WP_Webfonts', 'get_font_slug' ) ) {
				return;
			}

			$wp_webfonts = wp_webfonts();

			$slug = \WP_Webfonts::get_font_slug( $font_family_name );

			return isset( $wp_webfonts->get_registered_webfonts()[ $slug ] );
		}
	}

	/**
	 * Build the Google Webfont with the url for the given webfont.
	 *
	 * @param array $webfont The Webfont to process.
	 * @return array The processed Webfont
	 */
	public static function get_webfont_font_face( $webfont ) {
		$defaults = array(
			'font-family'  => '',
			'font-style'   => 'normal',
			'font-weight'  => '400',
			'font-display' => 'fallback',
		);

		$font_face        = wp_parse_args( $webfont, $defaults );
		$font_face['src'] = Google_Font_Face::get_font_url( $font_face );

		return $font_face;
	}

	/**
	 * Converts the Webfont into theme.json structural format.
	 *
	 * @param string $font_family_name The font name.
	 * @param array  $font_faces The font faces.
	 * @return array Webfont in theme.json structural format.
	 */
	public static function convert_font_into_theme_json( $font_family_name, $font_faces ) {
		$theme_json_format = array(
			'fontFamily' => str_contains( $font_family_name, ' ' ) ? "'{$font_family_name}'" : $font_family_name,
			'name'       => $font_family_name,
			'slug'       => sanitize_title( $font_family_name ),
			'fontFace'   => array(),
		);

		foreach ( $font_faces as $font_face ) {
			$formatted_font_face = array();
			foreach ( $font_face as $property_name => $property_value ) {
				$property_in_camelcase                         = lcfirst( str_replace( '-', '', ucwords( $property_name, '-' ) ) );
				$formatted_font_face[ $property_in_camelcase ] = $property_value;
			}
			$theme_json_format['fontFace'][] = $formatted_font_face;
		}

		return $theme_json_format;
	}
}
