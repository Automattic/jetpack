<?php

namespace Automattic\Jetpack_Boost\Modules\Page_Cache;

use Automattic\Jetpack_Boost\Contracts\Is_Always_On;
use Automattic\Jetpack_Boost\Contracts\Pluggable;

/*
 * This code is shared between the autoloaded Module and advanced-cache.php loaded code.
 */
require_once __DIR__ . '/Boost_Cache_Utils.php';

class Page_Cache implements Pluggable, Is_Always_On {

	public function __construct() {
		register_deactivation_hook( JETPACK_BOOST_PATH, array( $this, 'deactivate' ) );
		register_uninstall_hook( JETPACK_BOOST_PATH, array( $this, 'uninstall' ) );
	}

	/*
	 * Sets up the advanced-cache.php file and if that works, adds the WP_CACHE
	 * define to wp-config.php
	 * These are used by WordPress to load the caching system before most of
	 * WordPress is loaded.
	 */
	public function setup() {
		if ( is_admin() && isset( $_GET['page'] ) && $_GET['page'] === 'jetpack-boost' ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			if ( false === $this->is_writeable() ) {
				return new \WP_Error( 'wp-content directory is not writeable' );
			}
			$result = $this->create_advanced_cache();
			if ( $result === true ) {
				$result = $this->add_wp_cache_define();
				if ( $result !== true ) {
					return $result;
				}
			} else {
				return $result;
			}

			return true;
		}
	}

	/*
	 * Returns true if the wp-content directory is writeable.
	 */
	private function is_writeable() {
		$filename = WP_CONTENT_DIR . '/' . uniqid() . '.txt';
		$result   = file_put_contents( $filename, 'test' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		wp_delete_file( $filename );
		return $result;
	}

	/*
	 * Creates the advanced-cache.php file.
	 *
	 * Returns true if the files were setup correctly, or WP_Error if there was a problem.
	 * @return bool|WP_Error
	 */
	private function create_advanced_cache() {

		$cache_version           = 'Boost Cache Plugin 0.1';
		$advanced_cache_filename = WP_CONTENT_DIR . '/advanced-cache.php';

		if ( file_exists( $advanced_cache_filename ) ) {
			$content = file_get_contents( $advanced_cache_filename ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			if ( strpos( $content, $cache_version ) !== false ) {
				return true;
			} else {
				return new \WP_Error( 'advanced-cache.php exists but is not the correct file' );
			}
		} else {
			$contents = '<?php
// ' . $cache_version . '
require_once( ABSPATH . \'/wp-content/plugins/boost/app/modules/cache/Boost_File_Cache.php\' );

( new Automattic\Jetpack_Boost\Modules\Page_Cache\Boost_File_Cache() )->serve();
';

			$result = file_put_contents( $advanced_cache_filename, $contents ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
			if ( $result === false ) {
				return new \WP_Error( 'Could not write to advanced-cache.php' );
			}
		}

		return true;
	}

	/*
	 * Adds the WP_CACHE define to wp-config.php
	 */
	private function add_wp_cache_define() {
		$content = file_get_contents( ABSPATH . 'wp-config.php' );
		if ( preg_match( '#define\s*\(\s*[\'"]WP_CACHE[\'"]#', $content ) === 1 ) {
			/*
			 * wp-settings.php checks "if ( WP_CACHE )" so it may be truthy and
			 * not === true to pass that check.
			 * Later, it is defined as false in default-constants.php, but
			 * it may have been defined manually as true using "true", 1, or "1"
			 * in wp-config.php.
			 */
			if ( defined( 'WP_CACHE' ) && ! WP_CACHE ) {
				return new \WP_Error( 'WP_CACHE is defined but not true' );
			}
			return; // WP_CACHE already added.
		}
		$content = str_replace(
			'<?php',
			'<?php
define( \'WP_CACHE\', true );',
			$content
		);

		$result = file_put_contents( ABSPATH . 'wp-config.php', $content ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		if ( $result === false ) {
			return new \WP_Error( 'Could not write to wp-config.php' );
		}
	}

	/*
	 * Removes the advanced-cache.php file and the WP_CACHE define from wp-config.php
	 * Fired when the plugin is deactivated.
	 */
	public function deactivate() {
		$this->delete_advanced_cache(); // how do we handle errors?
		$this->delete_wp_cache_constant(); // how do we handle errors?

		return true;
	}

	/*
	 * Removes the boost-cache directory, removing all cached files and the config file.
	 * Fired when the plugin is uninstalled.
	 */
	public function uninstall() {
		$this->deactivate();

		$result = Boost_Cache_Utils::delete_directory( WP_CONTENT_DIR . '/boost-cache' );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return true;
	}

	/*
	 * Deletes the file advanced-cache.php if it exists.
	 */
	public function delete_advanced_cache() {
		$advanced_cache_filename = WP_CONTENT_DIR . '/advanced-cache.php';

		if ( ! file_exists( $advanced_cache_filename ) ) {
			return;
		}

		$content = file_get_contents( $advanced_cache_filename ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		if ( strpos( $content, 'Boost Cache Plugin 0.1' ) !== false ) {
			wp_delete_file( $advanced_cache_filename );
		}
	}

	/*
	 * Deletes the WP_CACHE define from wp-config.php
	 * @return WP_Error if an error occurred.
	 */
	public function delete_wp_cache_constant() {
		$lines = file( ABSPATH . 'wp-config.php' );
		foreach ( $lines as $key => $line ) {
			if ( strpos( $line, 'WP_CACHE' ) !== false ) {
				unset( $lines[ $key ] );
			}
		}
		$content = implode( '', $lines );
		$result  = file_put_contents( ABSPATH . 'wp-config.php', $content ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		if ( $result === false ) {
			return new \WP_Error( 'Could not write to wp-config.php' );
		}
	}

	public static function is_available() {
		if ( ! defined( 'BOOST_CACHE' ) ) {
			return false;
		}
		return true;
	}

	public static function get_slug() {
		return 'boost_cache';
	}
}
