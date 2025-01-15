<?php

namespace Automattic\Jetpack_Boost\Lib\Minify;

class Config {

	public static function get_static_cache_dir_path(): string {
		return WP_CONTENT_DIR . '/boost-cache/static';
	}

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

	public static function can_use_static_cache() {
		$cache_dir = static::get_static_cache_dir_path();
		$use_cache = ! empty( $cache_dir );

		if ( $use_cache && ! static::ensure_dir_exists( $cache_dir ) ) {
			$use_cache = false;
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				error_log(
					sprintf(
						/* translators: a filesystem path to a directory */
						__( "Disabling concatenate static cache. Unable to create cache directory '%s'.", 'jetpack-boost' ),
						$cache_dir
					)
				);
			}
		}

		if ( $use_cache && ! static::ensure_dir_is_writable( $cache_dir ) ) {
			$use_cache = false;
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				error_log(
					sprintf(
						/* translators: a filesystem path to a directory */
						__( "Disabling concatenate static cache. Unable to write to cache directory '%s'.", 'jetpack-boost' ),
						$cache_dir
					)
				);
			}
		}

		return $use_cache;
	}

	public static function can_use_cache() {
		$cache_dir = static::get_cache_dir_path();
		$use_cache = ! empty( $cache_dir );

		// Ensure the cache directory exists.
		if ( $use_cache && ! static::ensure_dir_exists( $cache_dir ) ) {
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
		if ( $use_cache && ! static::ensure_dir_is_writable( $cache_dir ) ) {
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

	private static function ensure_dir_exists( string $dir ): bool {
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_mkdir
		if ( ! is_dir( $dir ) && ! mkdir( $dir, 0775, true ) ) {
			return false;
		}

		return true;
	}

	private static function ensure_dir_is_writable( string $dir ): bool {
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_is_writable
		if ( ! is_dir( $dir ) || ! is_writable( $dir ) || ! is_executable( $dir ) ) {
			return false;
		}

		return true;
	}
}
