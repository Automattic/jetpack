<?php
/**
 * Real-time Collaboration (RTC) integration.
 *
 * Enables the RTC package based on the site's features.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Determine whether RTC should be enabled for Atomic sites.
 *
 * @return bool
 */
function wpcom_should_enforce_http_polling() {
	global $wp_version;

	$blog_id                      = get_wpcom_blog_id();
	$has_needed_gutenberg_version = defined( 'GUTENBERG_VERSION' ) && is_string( GUTENBERG_VERSION ) && version_compare( (string) GUTENBERG_VERSION, '22.7.0', '>=' );
	$has_needed_core_version      = ! empty( $wp_version ) && version_compare( (string) $wp_version, '7.0', '>=' );

	if (
		defined( 'IS_ATOMIC' ) && IS_ATOMIC &&
		( $blog_id % 100 === 1 ) &&
		( $has_needed_gutenberg_version || $has_needed_core_version )
	) {
		return true;
	}
	return false;
}

/**
 * Determine whether RTC should be enabled based on the site's features.
 *
 * @return bool
 */
function wpcom_enable_rtc() {
	if ( function_exists( 'wpcom_site_has_feature' ) && class_exists( 'WPCOM_Features' ) && defined( 'WPCOM_Features::REAL_TIME_COLLABORATION' ) ) {
		$blog_id = get_wpcom_blog_id();
		return wpcom_site_has_feature( \WPCOM_Features::REAL_TIME_COLLABORATION, $blog_id );
	}

	if ( wpcom_should_enforce_http_polling() ) {
		return true;
	}

	return false;
}
add_filter( 'jetpack_rtc_enabled', 'wpcom_enable_rtc' );

/**
 * Filters the list of Real-Time Communication (RTC) providers.
 *
 * @param array $providers An array of available RTC providers.
 *
 * @return array Modified array of RTC providers, enforcing 'http-polling' if necessary.
 */
function wpcom_rtc_providers( $providers ) {
	if ( wpcom_should_enforce_http_polling() ) {
		return array( 'http-polling' );
	}
	return $providers;
}
add_filter( 'jetpack_rtc_providers', 'wpcom_rtc_providers' );

\Automattic\Jetpack\RTC::init();
