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
		if ( ! function_exists( 'wp_webfonts' ) || ! method_exists( 'WP_Webfonts', 'get_font_slug' ) ) {
			return;
		}

		$wp_webfonts = wp_webfonts();

		$slug = \WP_Webfonts::get_font_slug( $font_family_name );

		return isset( $wp_webfonts->get_registered_webfonts()[ $slug ] );
	}
}
