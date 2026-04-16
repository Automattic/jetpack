<?php
/**
 * Mock WordPress.com platform functions for testing.
 *
 * @package wpcomsh
 */

if ( ! function_exists( 'localized_wpcom_url' ) ) {
	/**
	 * Mock localized_wpcom_url: the real implementation prepends a locale slug to
	 * WordPress.com URLs for non-English sites. Tests only care that the URL is
	 * returned intact, so return the input unchanged.
	 *
	 * @param string      $url    The URL.
	 * @param string|null $locale Optional locale override.
	 * @return string
	 */
	function localized_wpcom_url( $url, $locale = null ) {
		unset( $locale );
		return $url;
	}
}
