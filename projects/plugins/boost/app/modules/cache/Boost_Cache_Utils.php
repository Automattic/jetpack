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
		return @rmdir( $dir ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir, WordPress.PHP.NoSilencedErrors.Discouraged
	}

	/*
	 * Returns a sanitized directory path.
	 * @param string $path - The path to sanitize.
	 * @return string
	 */
	public static function sanitize_file_path( $path ) {
		$path = trailingslashit( $path );

		$path = _deep_replace(
			array( '..', '\\' ),
			preg_replace(
				'/[ <>\'\"\r\n\t\(\)]/',
				'',
				preg_replace(
					'/(\?.*)?(#.*)?$/',
					'',
					$path
				)
			)
		);

		return $path;
	}

	/*
	 * Returns true if the given directory is inside the boost-cache directory.
	 * @param string $dir - The directory to check.
	 * @return bool
	 */
	public static function is_boost_cache_directory( $dir ) {
		$dir = self::sanitize_file_path( $dir );
		return strpos( $dir, WP_CONTENT_DIR . '/boost-cache' ) !== false;
	}

	public static function write_to_file( $filename, $data ) {
		$tmp_filename = $filename . uniqid( uniqid(), true ) . '.tmp';
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		if ( false === file_put_contents( $tmp_filename, $data ) ) {
			return new \WP_Error( 'Could not write to tmp file' );
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.rename_rename
		if ( ! rename( $tmp_filename, $filename ) ) {
			return new \WP_Error( 'Could not rename tmp file' );
		}
		return true;
	}
}
