<?php

namespace Automattic\Jetpack_Boost\Lib\Minify;

class Config {

	public static function get_cache_dir_path(): string {
		if ( defined( 'PAGE_OPTIMIZE_CACHE_DIR' ) ) {
			if ( empty( \PAGE_OPTIMIZE_CACHE_DIR ) ) {
				$path = false;
			} else {
				$path = \PAGE_OPTIMIZE_CACHE_DIR;
			}
		} else {
			$path = WP_CONTENT_DIR . '/cache/page_optimize';
		}

		return $path;
	}

	public static function get_abspath(): string {
		if ( defined( 'PAGE_OPTIMIZE_ABSPATH' ) ) {
			$path = \PAGE_OPTIMIZE_ABSPATH;
		} else {
			$path = \ABSPATH;
		}

		return $path;
	}

	public static function can_use_cache() {
		$cache_dir = static::get_cache_dir_path();
		$use_cache = ! empty( $cache_dir );

		// Ensure the cache directory exists.
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_mkdir
		if ( $use_cache && ! is_dir( $cache_dir ) && ! mkdir( $cache_dir, 0775, true ) ) {
			$use_cache = false;
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				error_log(
					sprintf(
					/* translators: a filesystem path to a directory */
						__( "Disabling page-optimize cache. Unable to create cache directory '%s'.", 'jetpack-boost' ),
						$cache_dir
					)
				);
			}
		}

		// Ensure the cache directory is writable.
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_is_writable
		if ( $use_cache && ( ! is_dir( $cache_dir ) || ! is_writable( $cache_dir ) || ! is_executable( $cache_dir ) ) ) {
			$use_cache = false;
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				error_log(
					sprintf(
					/* translators: a filesystem path to a directory */
						__( "Disabling page-optimize cache. Unable to write to cache directory '%s'.", 'jetpack-boost' ),
						$cache_dir
					)
				);
			}
		}

		return $use_cache;
	}
}
