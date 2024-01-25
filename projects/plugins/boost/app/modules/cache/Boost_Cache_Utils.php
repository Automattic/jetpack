<?php

namespace Automattic\Jetpack_Boost\Modules\Page_Cache;

class Boost_Cache_Utils {
	/*
	 * Recursively delete a directory.
	 * @param string $dir - The directory to delete.
	 * @return bool|WP_Error
	 */
	public static function delete_directory( $dir ) {
		$dir = realpath( $dir );
		if ( ! $dir ) {
			return new \WP_Error( 'Directory does not exist' ); // realpath returns false if a file does not exist.
		}

		// make sure that $dir is a directory inside WP_CONTENT . '/boost-cache/';
		if ( self::is_boost_cache_directory( $dir ) === false ) {
			return new \WP_Error( 'Invalid directory' );
		}

		$files = array_diff( scandir( $dir ), array( '.', '..' ) );
		foreach ( $files as $file ) {
			$file = $dir . '/' . $file;
			if ( is_dir( $file ) ) {
				self::delete_directory( $file );
			} else {
				wp_delete_file( $file );
			}
		}
		rmdir( $dir ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir

		return true;
	}

	/*
	 * Returns true if the given directory is inside the boost-cache directory.
	 * @param string $dir - The directory to check.
	 * @return bool
	 */
	public static function is_boost_cache_directory( $dir ) {
		return strpos( $dir, WP_CONTENT_DIR . '/boost-cache' ) !== false;
	}
}
