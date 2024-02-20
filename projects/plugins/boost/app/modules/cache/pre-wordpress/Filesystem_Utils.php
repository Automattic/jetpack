<?php

namespace Automattic\Jetpack_Boost\Modules\Cache\Pre_WordPress;

use Automattic\Jetpack_Boost\Modules\Page_Cache\Pre_WordPress\Logger;

class Filesystem_Utils {
	/**
	 * Recursively garbage collect a directory.
	 *
	 * @param string $directory - The directory to garbage collect.
	 * @param int    $file_ttl  - Specify number of seconds after which a file is considered expired.
	 * @return int - The number of files deleted.
	 */
	public static function garbage_collect( $directory, $file_ttl ) {
		clearstatcache();

		return self::delete_expired_files( $directory, $file_ttl );
	}

	/**
	 * Recursively garbage collect a directory.
	 *
	 * @param string $directory - The directory to garbage collect.
	 * @param int    $file_ttl  - Specify number of seconds after which a file is considered expired.
	 * @return int - The number of files deleted.
	 */
	private static function delete_expired_files( $directory, $file_ttl ) {
		$count  = 0;
		$now    = time();
		$handle = is_readable( $directory ) && is_dir( $directory ) ? opendir( $directory ) : false;

		// Could not open directory, exit early.
		if ( ! $handle ) {
			return $count;
		}

		// phpcs:ignore Generic.CodeAnalysis.AssignmentInCondition.FoundInWhileCondition
		while ( false !== ( $file = readdir( $handle ) ) ) {
			if ( $file === '.' || $file === '..' ) {
				// Skip and continue to next file
				continue;
			}

			$file_path = $directory . '/' . $file;

			if ( ! file_exists( $file_path ) ) {
				// File doesn't exist, skip and continue to next file
				continue;
			}

			// Handle directories recursively.
			if ( is_dir( $file_path ) ) {
				$count += self::delete_expired_files( $file_path, $file_ttl );
				continue;
			}

			$filemtime = filemtime( $file_path );
			$expired   = ( $filemtime + $file_ttl ) <= $now;
			if ( $expired ) {
				if ( self::delete_file( $file_path ) ) {
					++$count;
				} else {
					Logger::debug( 'Could not delete file: ' . $file_path );
				}
			}
		}
		closedir( $handle );

		// If the directory is empty after processing it's files, delete it.
		$is_dir_empty = self::is_dir_empty( $directory );
		if ( is_wp_error( $is_dir_empty ) ) {
			Logger::debug( 'Could not check directory emptiness: ' . $is_dir_empty->get_error_message() );
			return $count;
		}

		if ( $is_dir_empty === true ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir, WordPress.PHP.NoSilencedErrors.Discouraged
			@rmdir( $directory );
		}

		return $count;
	}

	/**
	 * Creates the directory if it doesn't exist.
	 *
	 * @param string $path - The path to the directory to create.
	 */
	public static function create_directory( $path ) {
		if ( ! is_dir( $path ) ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.dir_mkdir_dirname, WordPress.WP.AlternativeFunctions.file_system_operations_mkdir
			return mkdir( $path, 0755, true );
		}

		return true;
	}

	/**
	 * Delete a file.
	 *
	 * @param string $file_path - The file to delete.
	 * @return bool - True if the file was deleted, false otherwise.
	 */
	public static function delete_file( $file_path ) {
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_is_writable
		$deletable = is_writable( $file_path );

		if ( $deletable ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
			return unlink( $file_path );
		}

		return false;
	}

	/**
	 * Check if a directory is empty.
	 *
	 * @param string $dir - The directory to check.
	 */
	public static function is_dir_empty( $dir ) {
		if ( ! is_readable( $dir ) ) {
			return new \WP_Error( 'directory_not_readable', 'Directory is not readable' );
		}

		return ( count( scandir( $dir ) ) === 2 ); // All directories have '.' and '..'
	}

	/**
	 * Writes data to a file.
	 * This creates a temporary file first, then renames the file to the final filename.
	 * This is done to prevent the file from being read while it is being written to.
	 *
	 * @param string $filename - The filename to write to.
	 * @param string $data - The data to write to the file.
	 * @return bool|WP_Error - true on sucess or WP_Error on failure.
	 */
	public static function write_to_file( $filename, $data ) {
		$tmp_filename = $filename . uniqid( uniqid(), true ) . '.tmp';
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		if ( false === file_put_contents( $tmp_filename, $data ) ) {
			return new \WP_Error( 'Could not write to tmp file: ' . $tmp_filename );
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.rename_rename
		if ( ! rename( $tmp_filename, $filename ) ) {
			return new \WP_Error( 'Could not rename tmp file to final file: ' . $filename );
		}
		return true;
	}
}
