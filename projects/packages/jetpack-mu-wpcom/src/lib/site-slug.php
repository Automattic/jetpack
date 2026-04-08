<?php
/**
 * Site slug resolution helper.
 *
 * Provides wpcom_get_site_slug() on environments where the native
 * Simple-site function is not available (Atomic / self-hosted).
 *
 * @package automattic/jetpack-mu-wpcom
 */

if ( ! function_exists( 'wpcom_get_site_slug' ) ) {
	/**
	 * Get the site slug for use in WordPress.com URLs.
	 *
	 * On Atomic sites, falls back to Jetpack\Status::get_site_suffix().
	 * Returns the hostname of the site on self-hosted.
	 *
	 * @return string Site slug, or empty string if unavailable.
	 */
	function wpcom_get_site_slug() {
		if ( class_exists( '\Automattic\Jetpack\Status' ) ) {
			$status = new \Automattic\Jetpack\Status();
			return $status->get_site_suffix();
		}

		$host = wp_parse_url( home_url(), PHP_URL_HOST );
		return $host ? $host : '';
	}
}
