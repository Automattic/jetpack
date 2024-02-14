<?php

namespace Automattic\Jetpack_Boost\Modules\Page_Cache;

class Page_Cache_Setup {

	/**
	 * Runs setup steps and returns whether setup was successful or not.
	 * @return bool
	 */
	public static function run_setup() {
		$steps = array(
			'is_wp_content_writable',
			'create_advanced_cache',
			'add_wp_cache_define',
		);

		foreach ( $steps as $step ) {
			$result = self::$step();
			if ( is_wp_error( $result ) ) {
				jetpack_boost_ds_set( 'page_cache_error', $result->get_error_code() );

				return false;
			}
		}

		jetpack_boost_ds_set( 'page_cache_error', '' );

		return true;
	}

	/**
	 * Returns true if the wp-content directory is writeable.
	 */
	private static function is_wp_content_writable() {
		$filename = WP_CONTENT_DIR . '/' . uniqid() . '.txt';
		$result   = file_put_contents( $filename, 'test' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		wp_delete_file( $filename );

		if ( $result === false ) {
			return new \WP_Error( 'wp-content-not-writable', 'wp-content directory is not writeable' );
		}

		return true;
	}

	/**
	 * Creates the advanced-cache.php file.
	 *
	 * Returns true if the files were setup correctly, or WP_Error if there was a problem.
	 *
	 * @return bool|WP_Error
	 */
	private static function create_advanced_cache() {
		$advanced_cache_filename = WP_CONTENT_DIR . '/advanced-cache.php';

		if ( file_exists( $advanced_cache_filename ) ) {
			$content = file_get_contents( $advanced_cache_filename ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents

			if ( strpos( $content, Page_Cache::ADVANCED_CACHE_SIGNATURE ) === false ) {
				return new \WP_Error( 'advanced-cache-incompatible', 'advanced-cache.php exists, but belongs to another plugin/system.' );
			}

			if ( strpos( $content, Page_Cache::ADVANCED_CACHE_VERSION ) !== false ) {
				// The version and signature match.
				return true;
			}
		}

		$boost_cache_filename = WP_CONTENT_DIR . '/plugins/' . basename( dirname( plugin_dir_path( __FILE__ ), 3 ) ) . '/app/modules/cache/Boost_Cache.php';
		$contents             = '<?php
// ' . Page_Cache::ADVANCED_CACHE_SIGNATURE . ' - ' . Page_Cache::ADVANCED_CACHE_VERSION . '
if ( ! file_exists( \'' . $boost_cache_filename . '\' ) ) {
return;
}
require_once( \'' . $boost_cache_filename . '\');

( new Automattic\Jetpack_Boost\Modules\Page_Cache\Boost_Cache() )->serve();
';

		$write_advanced_cache = Boost_Cache_Utils::write_to_file( $advanced_cache_filename, $contents );
		if ( is_wp_error( $write_advanced_cache ) ) {
			return new \WP_Error( 'unable-to-write-advanced-cache', $write_advanced_cache->get_error_message() );
		}

		return true;
	}

	/**
	 * Adds the WP_CACHE define to wp-config.php
	 */
	private static function add_wp_cache_define() {
		$content = file_get_contents( ABSPATH . 'wp-config.php' );
		if ( preg_match( '#^\s*define\s*\(\s*[\'"]WP_CACHE[\'"]#m', $content ) === 1 ) {
			/*
			 * wp-settings.php checks "if ( WP_CACHE )" so it may be truthy and
			 * not === true to pass that check.
			 * Later, it is defined as false in default-constants.php, but
			 * it may have been defined manually as true using "true", 1, or "1"
			 * in wp-config.php.
			 */
			if ( defined( 'WP_CACHE' ) && ! WP_CACHE ) {
				return new \WP_Error( 'wp-cache-defined-not-true', 'WP_CACHE is defined but not true' );
			}

			return true; // WP_CACHE already added.
		}
		$content = preg_replace(
			'#^<\?php#',
			'<?php
define( \'WP_CACHE\', true );',
			$content
		);

		$result = file_put_contents( ABSPATH . 'wp-config.php', $content ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		if ( $result === false ) {
			return new \WP_Error( 'wp-config-not-writable', 'Could not write to wp-config.php' );
		}

		return true;
	}

	/**
	 * Removes the advanced-cache.php file and the WP_CACHE define from wp-config.php
	 * Fired when the plugin is deactivated.
	 */
	public static function deactivate() {
		self::delete_advanced_cache();
		self::delete_wp_cache_constant();

		return true;
	}

	/*
	 * Removes the boost-cache directory, removing all cached files and the config file.
	 * Fired when the plugin is uninstalled.
	 */
	public static function uninstall() {
		self::delete_advanced_cache();
		self::delete_wp_cache_constant();

		$result = Boost_Cache_Utils::delete_directory( WP_CONTENT_DIR . '/boost-cache' );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return true;
	}

	/**
	 * Deletes the file advanced-cache.php if it exists.
	 */
	public static function delete_advanced_cache() {
		$advanced_cache_filename = WP_CONTENT_DIR . '/advanced-cache.php';

		if ( ! file_exists( $advanced_cache_filename ) ) {
			return;
		}

		$content = file_get_contents( $advanced_cache_filename ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		if ( strpos( $content, Page_Cache::ADVANCED_CACHE_SIGNATURE ) !== false ) {
			wp_delete_file( $advanced_cache_filename );
		}
	}

	/**
	 * Deletes the WP_CACHE define from wp-config.php
	 *
	 * @return WP_Error if an error occurred.
	 */
	public static function delete_wp_cache_constant() {
		$lines = file( ABSPATH . 'wp-config.php' );
		$found = false;
		foreach ( $lines as $key => $line ) {
			if ( preg_match( '#define\s*\(\s*[\'"]WP_CACHE[\'"]#', $line ) === 1 ) {
				unset( $lines[ $key ] );
				$found = true;
			}
		}
		if ( ! $found ) {
			return;
		}
		$content = implode( '', $lines );
		file_put_contents( ABSPATH . 'wp-config.php', $content ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
	}
}
