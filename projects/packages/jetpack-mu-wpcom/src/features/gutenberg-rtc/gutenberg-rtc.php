<?php
/**
 * Real-time Collaboration (RTC) integration.
 *
 * Enables the RTC package based on the site's features.
 *
 * @package automattic/jetpack-mu-wpcom
 */

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
	return false;
}
add_filter( 'jetpack_rtc_enabled', 'wpcom_enable_rtc' );

\Automattic\Jetpack\RTC::init();
