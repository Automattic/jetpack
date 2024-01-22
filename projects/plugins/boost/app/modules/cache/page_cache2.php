<?php

namespace Automattic\Jetpack_Boost\Modules\Page_Cache;

use Automattic\Jetpack_Boost\Contracts\Is_Always_On;
use Automattic\Jetpack_Boost\Contracts\Pluggable;

class Page_Cache implements Pluggable, Is_Always_On {
	/*
	 * Sets up the advanced-cache.php file and if that works, adds the WP_CACHE
	 * define to wp-config.php
	 * These are used by WordPress to load the caching system before most of
	 * WordPress is loaded.
	 */
	public function setup() {
		if ( is_admin() && isset( $_GET['page'] ) && $_GET['page'] === 'jetpack-boost' ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			require_once ABSPATH . '/wp-admin/includes/file.php';
			WP_Filesystem();
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
	 * Creates the advanced-cache.php file.
	 *
	 * Returns true if the files were setup correctly, or WP_Error if there was a problem.
	 * @return bool|WP_Error
	 */
	private function create_advanced_cache() {
		global $wp_filesystem;

		$advanced_cache_filename = ABSPATH . 'wp-content/advanced-cache.php';
		if ( $wp_filesystem->exists( $advanced_cache_filename ) ) {
			$content = $wp_filesystem->get_contents( $advanced_cache_filename );
			if ( strpos( $content, 'Boost Cache Plugin 0.1' ) !== false ) {
				return true;
			} else {
				return new \WP_Error( 'advanced-cache.php exists but is not the correct file' );
			}
		} else {
			$contents = '<?php
// Boost Cache Plugin 0.1
require_once( ABSPATH . \'/wp-content/plugins/boost/app/modules/cache/Boost_File_Cache.php\' );

( new Automattic\Jetpack_Boost\Modules\Page_Cache\Boost_File_Cache() )->serve();
';

			$result = $wp_filesystem->put_contents( $advanced_cache_filename, $contents, FS_CHMOD_FILE );
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
		global $wp_filesystem;

		$content = $wp_filesystem->get_contents( ABSPATH . 'wp-config.php' );
		if ( strpos( $content, 'define( \'WP_CACHE\', true );' ) !== false ) {
			return; // WP_CACHE already added.
		}
		$content = str_replace(
			'<?php',
			'<?php
define( \'WP_CACHE\', true );',
			$content
		);

		$result = $wp_filesystem->put_contents( ABSPATH . 'wp-config.php', $content, FS_CHMOD_FILE );
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
