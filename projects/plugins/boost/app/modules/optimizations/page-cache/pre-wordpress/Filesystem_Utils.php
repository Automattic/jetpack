<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress;

class Filesystem_Utils {

	const DELETE_ALL   = 'delete-all'; // delete all files and directories in a given directory, recursively.
	const DELETE_FILE  = 'delete-single'; // delete a single file or recursively delete a single directory in a given directory.
	const DELETE_FILES = 'delete-files'; // delete all files in a given directory.

	/**
	 * Recursively delete a directory.
	 * @param string $path - The directory to delete.
	 * @param bool   $type - The type of delete. DELETE_FILES to delete all files in the given directory. DELETE_ALL to delete everything in the given directory, recursively.
	 * @return bool|Boost_Cache_Error
	 */
	public static function delete_directory( $path, $type ) {
		Logger::debug( "delete directory: $path $type" );
		$path = realpath( $path );
		if ( ! $path ) {
			// translators: %s is the directory that does not exist.
			return new Boost_Cache_Error( 'directory-missing', 'Directory does not exist: ' . $path ); // realpath returns false if a file does not exist.
		}

		// make sure that $dir is a directory inside WP_CONTENT . '/boost-cache/';
		if ( self::is_boost_cache_directory( $path ) === false ) {
			// translators: %s is the directory that is invalid.
			return new Boost_Cache_Error( 'invalid-directory', 'Invalid directory %s' . $path );
		}

		if ( ! is_dir( $path ) ) {
			return new Boost_Cache_Error( 'not-a-directory', 'Not a directory' );
		}

		switch ( $type ) {
			case self::DELETE_ALL: // delete all files and directories in the given directory.
				$iterator = new \RecursiveIteratorIterator( new \RecursiveDirectoryIterator( $path, \RecursiveDirectoryIterator::SKIP_DOTS ) );
				foreach ( $iterator as $file ) {
					if ( $file->isDir() ) {
						Logger::debug( 'rmdir: ' . $file->getPathname() );
						@rmdir( $file->getPathname() ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir, WordPress.PHP.NoSilencedErrors.Discouraged
					} elseif ( $file->getFilename() !== 'index.html' ) {
						// Delete all files except index.html. index.html is used to prevent directory listing.
						Logger::debug( 'unlink: ' . $file->getPathname() );
						@unlink( $file->getPathname() ); // phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink, WordPress.PHP.NoSilencedErrors.Discouraged
					}
				}
				@rmdir( $path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir, WordPress.PHP.NoSilencedErrors.Discouraged,
				break;
			case self::DELETE_FILES: // delete all files in the given directory.
				// Files to delete are all files in the given directory, except index.html. index.html is used to prevent directory listing.
				$files = array_diff( scandir( $path ), array( '.', '..', 'index.html' ) );
				foreach ( $files as $file ) {
					$file = $path . '/' . $file;
					if ( is_file( $file ) ) {
						Logger::debug( "unlink: $file" );
						@unlink( $file ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged, WordPress.WP.AlternativeFunctions.unlink_unlink
					}
				}
				break;
		}
		return true;
	}

	/**
	 * Returns true if the given directory is inside the boost-cache directory.
	 * @param string $dir - The directory to check.
	 * @return bool
	 */
	public static function is_boost_cache_directory( $dir ) {
		$dir = Boost_Cache_Utils::sanitize_file_path( $dir );
		return strpos( $dir, WP_CONTENT_DIR . '/boost-cache' ) !== false;
	}

	/**
	 * Given a request_uri and its parameters, return the filename to use for this cached data. Does not include the file path.
	 *
	 * @param array  $parameters  - An associative array of all the things that make this request special/different. Includes GET parameters and COOKIEs normally.
	 */
	public static function get_request_filename( $parameters ) {

		$key_components = apply_filters( 'boost_cache_key_components', $parameters );

		return md5( json_encode( $key_components ) ) . '.html'; // phpcs:ignore WordPress.WP.AlternativeFunctions.json_encode_json_encode
	}
	/**
	 * Recursively garbage collect a directory.
	 *
	 * @param string $directory - The directory to garbage collect.
	 * @param int    $file_ttl  - Specify number of seconds after which a file is considered expired.
	 * @return int - The number of files deleted.
	 */
	public static function delete_expired_files( $directory, $file_ttl ) {
		clearstatcache();

		$count  = 0;
		$now    = time();
		$handle = is_readable( $directory ) && is_dir( $directory ) ? opendir( $directory ) : false;

		// Could not open directory, exit early.
		if ( ! $handle ) {
			return $count;
		}

		// phpcs:ignore Generic.CodeAnalysis.AssignmentInCondition.FoundInWhileCondition
		while ( false !== ( $file = readdir( $handle ) ) ) {
			if ( $file === '.' || $file === '..' || $file === 'index.html' ) {
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
		if ( $is_dir_empty instanceof Boost_Cache_Error ) {
			Logger::debug( 'Could not check directory emptiness: ' . $is_dir_empty->get_error_message() );
			return $count;
		}

		if ( $is_dir_empty === true ) {
			// Directory is considered empty even if it has an index.html file. Delete it it first.
			self::delete_file( $directory . '/index.html' );

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
			// phpcs:ignore WordPress.WP.AlternativeFunctions.dir_mkdir_dirname, WordPress.WP.AlternativeFunctions.file_system_operations_mkdir, WordPress.PHP.NoSilencedErrors.Discouraged
			$dir_created = @mkdir( $path, 0755, true );

			if ( $dir_created ) {
				self::create_empty_index_files( $path );
			}

			return $dir_created;
		}

		return true;
	}

	/**
	 * Create an empty index.html file in the given directory.
	 * This is done to prevent directory listing.
	 */
	private static function create_empty_index_files( $path ) {
		if ( self::is_boost_cache_directory( $path ) ) {
			self::write_to_file( $path . '/index.html', '' );

			// Create an empty index.html file in the parent directory as well.
			self::create_empty_index_files( dirname( $path ) );
		}
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
			return new Boost_Cache_Error( 'directory_not_readable', 'Directory is not readable' );
		}

		$files = array_diff( scandir( $dir ), array( '.', '..', 'index.html' ) );
		return empty( $files );
	}

	/**
	 * Writes data to a file.
	 * This creates a temporary file first, then renames the file to the final filename.
	 * This is done to prevent the file from being read while it is being written to.
	 *
	 * @param string $filename - The filename to write to.
	 * @param string $data - The data to write to the file.
	 * @return bool|Boost_Cache_Error - true on sucess or Boost_Cache_Error on failure.
	 */
	public static function write_to_file( $filename, $data ) {
		$tmp_filename = $filename . uniqid( uniqid(), true ) . '.tmp';
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents, WordPress.PHP.NoSilencedErrors.Discouraged
		if ( false === @file_put_contents( $tmp_filename, $data ) ) {
			return new Boost_Cache_Error( 'could-not-write', 'Could not write to tmp file: ' . $tmp_filename );
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.rename_rename
		if ( ! rename( $tmp_filename, $filename ) ) {
			return new Boost_Cache_Error( 'could-not-rename', 'Could not rename tmp file to final file: ' . $filename );
		}
		return true;
	}
}
