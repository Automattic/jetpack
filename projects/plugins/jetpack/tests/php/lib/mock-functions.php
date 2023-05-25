<?php
/**
 * Contains functions that need to be (conditionally) mocked.
 *
 * @package automattic/jetpack
 */

if ( ! function_exists( 'wp_cache_is_enabled' ) ) {
	/**
	 * "Mocking" function so that it exists and Automattic\Jetpack\Sync\Actions will load Automattic\Jetpack\Sync\Modules\WP_Super_Cache.
	 */
	function wp_cache_is_enabled() {}
}

if ( ! function_exists( 'gutenberg_is_fse_theme' ) ) {
	/**
	 * Assume all themes are an FSE theme.
	 *
	 * This function shouldn't be used anymore. wp_is_block_theme() should be used instead.
	 * Leaving this mock here for now to avoid breaking tests.
	 */
	function gutenberg_is_fse_theme() {
		return true;
	}
}

if ( ! function_exists( 'wpcom_site_has_feature' ) ) {
	/**
	 * Mock feature support.
	 *
	 * @param string $feature The feature to check.
	 */
	function wpcom_site_has_feature( $feature ) {
		switch ( $feature ) {
			case WPCOM_Features::ATOMIC:
			case WPCOM_Features::MANAGE_PLUGINS:
				return true;
		}

		return false;
	}
}
