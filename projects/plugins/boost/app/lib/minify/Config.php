<?php

namespace Automattic\Jetpack_Boost\Lib\Minify;

/**
 * Configuration management for the minification system.
 */
class Config {
	/**
	 * Get the directory path for storing static cache files.
	 */
	public static function get_static_cache_dir_path() {
		return WP_CONTENT_DIR . '/boost-cache/static';
	}

	/**
	 * Get the directory path for storing cache files.
	 */
	public static function get_legacy_cache_dir_path() {
		if ( defined( 'PAGE_OPTIMIZE_CACHE_DIR' ) ) {
			if ( empty( \PAGE_OPTIMIZE_CACHE_DIR ) ) {
				return false;
			}

			return \PAGE_OPTIMIZE_CACHE_DIR;
		}

		return WP_CONTENT_DIR . '/cache/page_optimize';
	}

	/**
	 * Get WordPress ABSPATH, with support for custom configuration.
	 */
	public static function get_abspath() {
		return defined( 'PAGE_OPTIMIZE_ABSPATH' ) ? \PAGE_OPTIMIZE_ABSPATH : \ABSPATH;
	}

	/**
	 * Check if static cache can be used.
	 */
	public static function can_use_static_cache() {
		$cache_dir = static::get_static_cache_dir_path();

		if ( ! static::ensure_dir_exists( $cache_dir ) ) {
			static::log_error(
				sprintf(
				/* translators: a filesystem path to a directory */
					__( "Disabling concatenate static cache. Unable to create cache directory '%s'.", 'jetpack-boost' ),
					$cache_dir
				)
			);
			return false;
		}

		if ( ! static::is_dir_writable( $cache_dir ) ) {
			static::log_error(
				sprintf(
				/* translators: a filesystem path to a directory */
					__( "Disabling concatenate static cache. Unable to write to cache directory '%s'.", 'jetpack-boost' ),
					$cache_dir
				)
			);
			return false;
		}

		return true;
	}

	/**
	 * Check if cache can be used.
	 */
	public static function can_use_cache() {
		$cache_dir = static::get_legacy_cache_dir_path();

		if ( empty( $cache_dir ) ) {
			static::log_error( __( 'Disabling page-optimize cache. Cache directory not defined.', 'jetpack-boost' ) );
			return false;
		}

		if ( ! static::ensure_dir_exists( $cache_dir ) ) {
			static::log_error(
				sprintf(
				/* translators: a filesystem path to a directory */
					__( "Disabling page-optimize cache. Unable to create cache directory '%s'.", 'jetpack-boost' ),
					$cache_dir
				)
			);
			return false;
		}

		if ( ! static::is_dir_writable( $cache_dir ) ) {
			static::log_error(
				sprintf(
				/* translators: a filesystem path to a directory */
					__( "Disabling page-optimize cache. Unable to write to cache directory '%s'.", 'jetpack-boost' ),
					$cache_dir
				)
			);
			return false;
		}

		return true;
	}

	/**
	 * Ensure a directory exists.
	 *
	 * @param string $dir The directory to check.
	 * @return bool True if the directory exists, false otherwise.
	 */
	private static function ensure_dir_exists( $dir ) {
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_mkdir
		if ( ! is_dir( $dir ) && ! mkdir( $dir, 0775, true ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Ensure a directory is writable.
	 *
	 * @param string $dir The directory to check.
	 * @return bool True if the directory is writable, false otherwise.
	 */
	private static function is_dir_writable( $dir ) {
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_is_writable
		if ( ! is_dir( $dir ) || ! is_writable( $dir ) || ! is_executable( $dir ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Log an error message if WP_DEBUG is enabled.
	 *
	 * @param string $message The error message to log.
	 */
	private static function log_error( $message ) {
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			error_log( $message );
		}
	}
}
