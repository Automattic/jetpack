<?php

namespace Automattic\Jetpack_Boost\Modules\Page_Cache;

/**
 * Used to check various health conditions.
 */
class Health_Check {

	/**
	 * Check if the feature can be enabled by checking if:
	 * - advanced-cache.php already exists
	 * - cache root is present and if writable
	 * - if wp-config.php is writable
	 *
	 * If the feature is already enabled, returns true.
	 *
	 * @return bool|WP_Error
	 */
	public static function can_feature_be_enabled() {
		$is_feature_enabled = false; // @todo update to use db call?
		if ( $is_feature_enabled ) {
			return true;
		}

		$advanced_cache_filename = WP_CONTENT_DIR . '/advanced-cache.php';
		// advanced-cache.php shouldn't exist
		if ( file_exists( $advanced_cache_filename ) ) {
			// @todo - what if it exists? It could be the correct one.
			return new \WP_Error( 'feature-disabled-advanced-cache-exists', 'advanced-cache.php exists but feature is disabled.' );
		}

		// is cache dir present and if so, is it writable
		if ( is_dir( WP_CONTENT_DIR . '/boost-cache' ) && ! is_writable( WP_CONTENT_DIR . '/boost-cache' ) ) { // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_is_writable
			return new \WP_Error( 'boost-cache-root-dir-not-writable', '/boost-cache directory is not writable.' );
		}

		// is wp-config.php writable
		if ( ! is_writable( ABSPATH . '/wp-config.php' ) ) { // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_is_writable
			return new \WP_Error( 'wp-config-not-writable', 'wp-config.php is not writable.' );
		}

		return true;
	}
}
