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

if ( ! function_exists( 'wpcom_site_has_feature' ) && false === getenv( 'JETPACK_TEST_WPCOMSH' ) ) {
	/**
	 * Mock feature support.
	 *
	 * @param string $feature The feature to check.
	 */
	function wpcom_site_has_feature( $feature, $blog_id = 0 ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		switch ( $feature ) {
			case WPCOM_Features::ATOMIC:
			case WPCOM_Features::MANAGE_PLUGINS:
				return true;
		}

		return false;
	}
}
