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
}
