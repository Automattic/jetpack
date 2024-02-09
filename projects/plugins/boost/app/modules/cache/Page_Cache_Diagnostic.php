<?php

namespace Automattic\Jetpack_Boost\Modules\Page_Cache;

use Automattic\Jetpack_Boost\Modules\Modules_Index;

class Page_Cache_Diagnostic {

	public static function get_status() {
		$status = array();

		$checks = array(
			'canBeEnabled' => self::can_feature_be_enabled(),
		);

		foreach ( $checks as $check => $data ) {
			$is_error = is_wp_error( $data );

			$status[ $check ] = array(
				'status'  => ! $is_error,
				'error'   => $is_error ? $data->get_error_code() : '',
				'message' => $is_error ? $data->get_error_message() : '',
			);
		}

		return $status;
	}

	/**
	 * Check if the feature can be enabled by checking if:
	 * - advanced-cache.php already exists and if it's the correct one
	 *   (since the feature could have been disabled after being set up once)
	 * - cache root is present and if writable
	 * - if wp-config.php is writable
	 *
	 * If the feature is already enabled, returns true.
	 *
	 * @return bool|WP_Error
	 */
	public static function can_feature_be_enabled() {
		$modules           = new Modules_Index();
		$is_module_enabled = $modules->is_module_enabled( Page_Cache::get_slug() );
		if ( $is_module_enabled ) {
			return true;
		}

		$advanced_cache_filename = WP_CONTENT_DIR . '/advanced-cache.php';
		// advanced-cache.php shouldn't exist
		if ( file_exists( $advanced_cache_filename ) ) {
			$content = file_get_contents( $advanced_cache_filename ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			if ( strpos( $content, Page_Cache::$advanced_cache_signature ) === false ) {
				return new \WP_Error( 'feature-disabled-advanced-cache-incompatible', 'advanced-cache.php exists not compatible.' );
			}
		}

		// is cache dir present and if so, is it writable
		if ( is_dir( WP_CONTENT_DIR . '/boost-cache' ) && ! is_writable( WP_CONTENT_DIR . '/boost-cache' ) ) { // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_is_writable
			return new \WP_Error( 'boost-cache-root-dir-not-writable', '/boost-cache directory is not writable.' );
		}

		// is wp-config.php writable
		if ( ! is_writable( ABSPATH . '/wp-config.php' ) ) { // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_is_writable
			// @todo - maybe it's not writable, but caching is enabled?
			return new \WP_Error( 'wp-config-not-writable', 'wp-config.php is not writable.' );
		}

		return true;
	}
}
