<?php
/**
 * Real-time Collaboration (RTC) integration.
 *
 * Enables the RTC package based on the site's features.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Check if the current site has the `wpcom-features-edge` sticker.
 *
 * @return bool|mixed
 */
function wpcom_has_features_edge_sticker() {
	$sticker = 'wpcom-features-edge';
	if ( defined( 'IS_ATOMIC' ) && IS_ATOMIC && function_exists( 'wpcomsh_is_site_sticker_active' ) ) {
		return wpcomsh_is_site_sticker_active( $sticker );
	} elseif ( function_exists( 'has_blog_sticker' ) ) {
		return has_blog_sticker( $sticker, get_wpcom_blog_id() );
	}
	return false;
}

/**
 * Determine if the site is part of the HTTP-polling gradual rollout.
 *
 * @return bool
 */
function wpcom_is_rtc_http_polling_rollout() {
	if (
		defined( 'IS_ATOMIC' ) && IS_ATOMIC &&
		! wpcom_has_features_edge_sticker() // Sites with the sticker should use WS.
	) {
		return true;
	}
	return false;
}

/**
 * Determine if the site is part of the HTTP-polling gradual rollout.
 *
 * @return bool
 */
function wpcom_is_rtc_websocket_rollout() {
	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		return true;
	}
	return false;
}

/**
 * Determine whether the current request is from the WordPress.com desktop app.
 *
 * @return bool
 */
function wpcom_rtc_is_desktop_app() {
	if ( ! isset( $_SERVER['HTTP_USER_AGENT'] ) ) {
		return false;
	}
	$user_agent = sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) );
	return false !== strpos( $user_agent, 'WordPressDesktop' );
}

/**
 * Determine whether RTC should be enabled based on the site's features.
 *
 * @return bool
 */
function wpcom_enable_rtc() {
	// Disable RTC on the desktop app due to an incompatibility.
	if ( wpcom_rtc_is_desktop_app() ) {
		return false;
	}
	$has_rtc_feature = false;
	if ( function_exists( 'wpcom_site_has_feature' ) && class_exists( 'WPCOM_Features' ) && defined( 'WPCOM_Features::REAL_TIME_COLLABORATION' ) ) {
		$blog_id         = get_wpcom_blog_id();
		$has_rtc_feature = wpcom_site_has_feature( \WPCOM_Features::REAL_TIME_COLLABORATION, $blog_id );
	}

	if ( ! $has_rtc_feature ) {
		return false;
	}

	$has_needed_gutenberg_version = defined( 'GUTENBERG_VERSION' ) && is_string( GUTENBERG_VERSION ) && version_compare( (string) GUTENBERG_VERSION, '22.7.0', '>=' );

	if ( ! $has_needed_gutenberg_version ) {
		return false;
	}

	if ( wpcom_is_rtc_http_polling_rollout() || wpcom_is_rtc_websocket_rollout() ) {
		return true;
	}

	if ( wpcom_has_features_edge_sticker() ) {
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
	if ( wpcom_is_rtc_http_polling_rollout() ) {
		return array( 'http-polling' );
	}
	return $providers;
}
add_filter( 'jetpack_rtc_providers', 'wpcom_rtc_providers' );

add_filter( 'jetpack_rtc_enable_limit_notices', '__return_false', 99 );

\Automattic\Jetpack\RTC::init();
