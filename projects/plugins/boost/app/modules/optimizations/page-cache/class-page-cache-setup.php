<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache;

use Automattic\Jetpack_Boost\Lib\Analytics;
use Automattic\Jetpack_Boost\Lib\Super_Cache_Config_Compatibility;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Boost_Cache_Error;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Boost_Cache_Settings;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Filesystem_Utils;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Logger;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Path_Actions\Simple_Delete;

class Page_Cache_Setup {

	private static $notices = array();

	/**
	 * Runs setup steps and returns whether setup was successful or not.
	 *
	 * @return bool|\WP_Error
	 */
	public static function run_setup() {
		// Steps that are only for cache system verification. They don't change anything.
		$verification_steps = array(
			'verify_wp_content_writable',
			'verify_permalink_setting',
		);

		foreach ( $verification_steps as $step ) {
			$result = self::run_step( $step );

			if ( is_wp_error( $result ) ) {
				return $result;
			}
		}

		/*
		 * Steps that may change something to setup the cache system.
		 * Each of them should return the result in following format:
		 * - true if the step was successful and changes were made
		 * - false if the step was successful but no changes were made
		 * - WP_Error if the step failed
		 */
		$setup_steps = array(
			'create_settings_file',
			'create_advanced_cache',
			'add_wp_cache_define',
			'enable_caching',
		);

		$changes_made = false;
		foreach ( $setup_steps as $step ) {
			$result = self::run_step( $step );

			if ( is_wp_error( $result ) ) {
				return $result;
			}

			if ( $result === true ) {
				$changes_made = true;
			}
		}

		if ( $changes_made ) {
			Analytics::record_user_event( 'page_cache_setup_succeeded' );
		}
		return true;
	}

	public static function get_notices() {
		return self::$notices;
	}

	private static function add_notice( $title, $message ) {
		self::$notices[] = array(
			'title'   => $title,
			'message' => $message,
		);
	}

	private static function run_step( $step ) {
		$result = self::$step();

		if ( $result instanceof Boost_Cache_Error ) {
			Analytics::record_user_event( 'page_cache_setup_failed', array( 'error_code' => $result->get_error_code() ) );
			return $result->to_wp_error();
		}

		if ( is_wp_error( $result ) ) {
			Analytics::record_user_event( 'page_cache_setup_failed', array( 'error_code' => $result->get_error_code() ) );
			return $result;
		}
	}

	/**
	 * Enable caching step of setup.
	 *
	 * @return Boost_Cache_Error|bool - True on success, false if it was already enabled, error otherwise.
	 */
	private static function enable_caching() {
		$settings       = Boost_Cache_Settings::get_instance();
		$previous_value = $settings->get_enabled();

		if ( $previous_value === true ) {
			return false;
		}

		$enabled_result = $settings->set( array( 'enabled' => true ) );

		if ( $enabled_result === true ) {
			Logger::debug( 'Caching enabled in cache config' );
		}

		return $enabled_result;
	}

	/**
	 * Returns true if the wp-content directory is writeable.
	 */
	private static function verify_wp_content_writable() {
		$filename = WP_CONTENT_DIR . '/' . uniqid() . '.txt';
		$result   = @file_put_contents( $filename, 'test' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents, WordPress.PHP.NoSilencedErrors.Discouraged
		wp_delete_file( $filename );

		if ( $result === false ) {
			return new \WP_Error( 'wp-content-not-writable' );
		}

		return true;
	}

	/**
	 * Returns true if WordPress is using a proper permalink setup. WP_Error if not.
	 */
	private static function verify_permalink_setting() {
		global $wp_rewrite;

		if ( ! $wp_rewrite || ! $wp_rewrite->using_permalinks() ) {
			return new \WP_Error( 'not-using-permalinks' );
		}
	}

	/**
	 * Create a settings file, if one does not already exist.
	 *
	 * @return bool|\WP_Error - True if the file was created, WP_Error if there was a problem, or false if the file already exists.
	 */
	private static function create_settings_file() {
		$result = Boost_Cache_Settings::get_instance()->create_settings_file();
		return $result;
	}

	/**
	 * Get the path to the advanced-cache.php file.
	 *
	 * @return string The full path to the advanced-cache.php file.
	 */
	public static function get_advanced_cache_path() {
		return WP_CONTENT_DIR . '/advanced-cache.php';
	}

	/**
	 * Creates the advanced-cache.php file.
	 *
	 * Returns true if the files were setup correctly, or WP_Error if there was a problem.
	 *
	 * @return bool|\WP_Error
	 */
	private static function create_advanced_cache() {
		$advanced_cache_filename = self::get_advanced_cache_path();

		if ( file_exists( $advanced_cache_filename ) ) {
			$content = file_get_contents( $advanced_cache_filename ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents

			if ( strpos( $content, 'WP SUPER CACHE' ) !== false ) {
				// advanced-cache.php is already in use by WP Super Cache.

				if ( Super_Cache_Config_Compatibility::is_compatible() ) {
					$deactivation = new Data_Sync_Actions\Deactivate_WPSC();
					$deactivation->handle();
					self::add_notice(
						__( 'WP Super Cache Has Been Deactivated', 'jetpack-boost' ),
						__( 'To ensure optimal performance, WP Super Cache has been automatically deactivated because Jetpack Boost\'s Cache is now active. Only one caching system can be used at a time.', 'jetpack-boost' )
					);

					Analytics::record_user_event(
						'switch_to_boost_cache',
						array(
							'type'   => 'silent',
							'reason' => 'super_cache_compatible',
						)
					);
				} else {
					return new \WP_Error( 'advanced-cache-for-super-cache' );
				}
			} elseif ( strpos( $content, Page_Cache::ADVANCED_CACHE_SIGNATURE ) === false ) {
				// advanced-cache.php is in use by another plugin.
				return new \WP_Error( 'advanced-cache-incompatible' );
			}

			if ( strpos( $content, Page_Cache::ADVANCED_CACHE_VERSION ) !== false ) {
				// The advanced-cache.php file belongs to current version of Boost Cache.
				return false;
			}
		}

		$plugin_dir_name      = untrailingslashit( str_replace( JETPACK_BOOST_PLUGIN_FILENAME, '', JETPACK_BOOST_PLUGIN_BASE ) );
		$boost_cache_filename = WP_CONTENT_DIR . '/plugins/' . $plugin_dir_name . '/app/modules/optimizations/page-cache/pre-wordpress/class-boost-cache.php';
		if ( ! file_exists( $boost_cache_filename ) ) {
			return new \WP_Error( 'boost-cache-file-not-found' );
		}
		$contents = '<?php
// ' . Page_Cache::ADVANCED_CACHE_SIGNATURE . ' - ' . Page_Cache::ADVANCED_CACHE_VERSION . '
if ( ! file_exists( \'' . $boost_cache_filename . '\' ) ) {
return;
}
require_once( \'' . $boost_cache_filename . '\');
$boost_cache = new Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Boost_Cache();
$boost_cache->init_actions();
$boost_cache->serve();
';

		$write_advanced_cache = Filesystem_Utils::write_to_file( $advanced_cache_filename, $contents );
		if ( $write_advanced_cache instanceof Boost_Cache_Error ) {
			return new \WP_Error( 'unable-to-write-to-advanced-cache', $write_advanced_cache->get_error_code() );
		}
		self::clear_opcache( $advanced_cache_filename );

		Logger::debug( 'Advanced cache file created' );

		return true;
	}

	/**
	 * Adds the WP_CACHE define to wp-config.php
	 */
	private static function add_wp_cache_define() {
		$config_file = self::find_wp_config();
		if ( $config_file === false ) {
			return new \WP_Error( 'wp-config-not-found' );
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		$content = file_get_contents( $config_file );
		if ( preg_match( '#^\s*(define\s*\(\s*[\'"]WP_CACHE[\'"]|const\s+WP_CACHE\s*=)#m', $content ) === 1 ) {
			/*
			 * wp-settings.php checks "if ( WP_CACHE )" so it may be truthy and
			 * not === true to pass that check.
			 * Later, it is defined as false in default-constants.php, but
			 * it may have been defined manually as true using "true", 1, or "1"
			 * in wp-config.php.
			 */
			if ( defined( 'WP_CACHE' ) && ! WP_CACHE ) {
				return new \WP_Error( 'wp-cache-defined-not-true' );
			}

			return false; // WP_CACHE already added.
		}
		$content = preg_replace(
			'#^<\?php#',
			'<?php
define( \'WP_CACHE\', true ); // ' . Page_Cache::ADVANCED_CACHE_SIGNATURE,
			$content
		);

		$result = self::write_to_file_direct( $config_file, $content );
		if ( $result === false ) {
			return new \WP_Error( 'wp-config-not-writable' );
		}
		self::clear_opcache( $config_file );

		Logger::debug( 'WP_CACHE constant added to wp-config.php' );

		return true;
	}

	/**
	 * Checks if page cache can be run or not.
	 *
	 * @return bool True if the advanced-cache.php file doesn't exist or belongs to Boost, false otherwise.
	 */
	public static function can_run_cache() {
		$advanced_cache_path = self::get_advanced_cache_path();
		if ( ! file_exists( $advanced_cache_path ) ) {
			return true;
		}

		$content = file_get_contents( $advanced_cache_path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		return strpos( $content, Page_Cache::ADVANCED_CACHE_SIGNATURE ) !== false;
	}

	/**
	 * Removes the advanced-cache.php file and the WP_CACHE define from wp-config.php
	 * Fired when the plugin is deactivated.
	 */
	public static function deactivate() {
		$advanced_cache_deleted = self::delete_advanced_cache();
		// Only remove constant if Boost was the last to run caching.
		// This is to avoid breaking caching for other plugins.
		if ( $advanced_cache_deleted ) {
			self::delete_wp_cache_constant();
		} else {
			self::cleanup_wp_cache_constant();
		}

		return true;
	}

	/**
	 * Removes the boost-cache directory, removing all cached files and the config file.
	 * Fired when the plugin is uninstalled.
	 */
	public static function uninstall() {
		self::deactivate();
		// Call the Cache Preload module deactivation here to ensure it's cleaned up properly.
		Cache_Preload::deactivate();
		$result = Filesystem_Utils::iterate_directory( WP_CONTENT_DIR . '/boost-cache', new Simple_Delete() );
		if ( $result instanceof Boost_Cache_Error ) {
			return $result->to_wp_error();
		}

		return true;
	}

	/**
	 * Deletes the file advanced-cache.php if it exists.
	 */
	public static function delete_advanced_cache() {
		$advanced_cache_filename = self::get_advanced_cache_path();

		if ( ! file_exists( $advanced_cache_filename ) ) {
			return false;
		}

		$deleted_file = false;
		$content      = file_get_contents( $advanced_cache_filename ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		if ( strpos( $content, Page_Cache::ADVANCED_CACHE_SIGNATURE ) !== false ) {
			wp_delete_file( $advanced_cache_filename );

			// wp_delete_file doesn't return anything
			// so we manually check if the file was deleted.
			$deleted_file = ! file_exists( $advanced_cache_filename );
		}

		self::clear_opcache( $advanced_cache_filename );

		return $deleted_file;
	}

	/**
	 * Deletes the WP_CACHE define from wp-config.php
	 *
	 * @return \WP_Error if an error occurred.
	 */
	public static function delete_wp_cache_constant() {
		$config_file = self::find_wp_config();
		if ( $config_file === false ) {
			return;
		}

		$lines = file( $config_file );
		$found = false;
		foreach ( $lines as $key => $line ) {
			if ( preg_match( '#define\s*\(\s*[\'"]WP_CACHE[\'"]#', $line ) === 1 && strpos( $line, Page_Cache::ADVANCED_CACHE_SIGNATURE ) !== false ) {
				unset( $lines[ $key ] );
				$found = true;
			}
		}
		if ( ! $found ) {
			return;
		}
		$content = implode( '', $lines );
		Filesystem_Utils::write_to_file( $config_file, $content );
		self::clear_opcache( $config_file );
	}

	/**
	 * Removes the comment after WP_CACHE defined in wp-config.php (if any).
	 *
	 * @return void
	 */
	public static function cleanup_wp_cache_constant() {
		$config_file = self::find_wp_config();
		if ( $config_file === false ) {
			return;
		}

		$lines = file( $config_file );
		$found = false;
		foreach ( $lines as $key => $line ) {
			if ( preg_match( '#define\s*\(\s*[\'"]WP_CACHE[\'"]#', $line ) === 1 && strpos( $line, Page_Cache::ADVANCED_CACHE_SIGNATURE ) !== false ) {
				$lines[ $key ] = preg_replace( '#\s*?\/\/.*$#', '', $line );
				$found         = true;
			}
		}
		if ( ! $found ) {
			return;
		}
		$content = implode( '', $lines );
		Filesystem_Utils::write_to_file( $config_file, $content );
		self::clear_opcache( $config_file );
	}

	/**
	 * Find location of wp-config.php file.
	 *
	 * @return string|false - The path to the wp-config.php file, or false if it was not found.
	 */
	private static function find_wp_config() {
		if ( file_exists( ABSPATH . 'wp-config.php' ) ) {
			return ABSPATH . 'wp-config.php';
		} elseif ( file_exists( dirname( ABSPATH ) . '/wp-config.php' ) && ! file_exists( dirname( ABSPATH ) . '/wp-settings.php' ) ) {
			// While checking one directory up, check for wp-settings.php as well similar to WordPress core, to avoid nested WordPress installations.
			return dirname( ABSPATH ) . '/wp-config.php';
		}

		return false;
	}

	/**
	 * Clear opcache for a file.
	 */
	private static function clear_opcache( $file ) {
		// If API functions are restricted, we can't do anything.
		if ( ini_get( 'opcache.restrict_api' ) ) {
			return;
		}

		if ( function_exists( 'opcache_invalidate' ) ) {
			opcache_invalidate( $file, true );
		}
	}

	private static function write_to_file_direct( $file, $content ) {
		$filesystem = self::get_wp_filesystem();
		$chmod      = $filesystem->getchmod( $file );
		if ( $chmod === false ) {
			$chmod = 0644; // Default to a common permission for files
		} else {
			$chmod = intval( '0' . $chmod, 8 ); // Ensure leading zero
		}
		return $filesystem->put_contents( $file, $content, $chmod );
	}

	private static function get_wp_filesystem() {
		require_once ABSPATH . 'wp-admin/includes/class-wp-filesystem-base.php';
		require_once ABSPATH . 'wp-admin/includes/class-wp-filesystem-direct.php';
		return new \WP_Filesystem_Direct( null );
	}
}
