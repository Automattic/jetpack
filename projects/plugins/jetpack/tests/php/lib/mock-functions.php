<?php
/**
 * Contains functions that need to be (conditionally) mocked.
 *
 * @package automattic/jetpack
 */

if ( ! function_exists( 'has_blog_sticker' ) ) {
	/**
	 * "Mock" WPCOM sticker function with 'get_option'
	 */
	function has_blog_sticker( $sticker ) {
		return get_option( $sticker );
	}
}

if ( ! function_exists( 'wp_cache_is_enabled' ) ) {
	/**
	 * "Mocking" function so that it exists and Automattic\Jetpack\Sync\Actions will load Automattic\Jetpack\Sync\Modules\WP_Super_Cache.
	 */
	function wp_cache_is_enabled() {}
}

if ( ! function_exists( 'wpcom_is_vip' ) ) {
	/**
	 * Mock WordPress.com VIP status.
	 *
	 * @param int $blog_id Blog ID.
	 */
	function wpcom_is_vip( $blog_id = 0 ) {
		return (bool) apply_filters( 'jetpack_test_wpcom_is_vip', false, $blog_id );
	}
}

if ( ! function_exists( 'wpcom_site_has_feature' ) && false === getenv( 'JETPACK_TEST_WPCOMSH' ) ) {
	/**
	 * Mock feature support.
	 *
	 * @param string $feature The feature to check.
	 */
	function wpcom_site_has_feature( $feature, $blog_id = 0 ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( WPCOM_Features::BIG_SKY === $feature ) {
			return (bool) apply_filters( 'jetpack_test_wpcom_has_big_sky', false, $blog_id );
		}

		switch ( $feature ) {
			case WPCOM_Features::ATOMIC:
			case WPCOM_Features::MANAGE_PLUGINS:
				return true;
		}

		return false;
	}
}
