<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress;

use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Path_Actions\Path_Action;
use SplFileInfo;

class Filesystem_Utils {

	const DELETE_ALL             = 'delete-all'; // delete all files and directories in a given directory, recursively.
	const DELETE_FILE            = 'delete-single'; // delete a single file or recursively delete a single directory in a given directory.
	const DELETE_FILES           = 'delete-files'; // delete all files in a given directory.
	const REBUILD_ALL            = 'rebuild-all'; // rebuild all files and directories in a given directory, recursively.
	const REBUILD_FILE           = 'rebuild-single'; // rebuild a single file or recursively rebuild a single directory in a given directory.
	const REBUILD_FILES          = 'rebuild-files'; // rebuild all files in a given directory.
	const REBUILD                = 'rebuild'; // rebuild mode for managing expired files
	const DELETE                 = 'delete'; // delete mode for managing expired files
	const REBUILD_FILE_EXTENSION = '.rebuild.html'; // The extension used for rebuilt files.

	/**
	 * Iterate over a directory and apply an action to each file.
	 *
	 * This applies the action to all files and subdirectories in the given directory.
	 *
	 * @param string      $path - The directory to iterate over.
	 * @param Path_Action $action - The action to apply to each file.
	 * @return int|Boost_Cache_Error - The number of files processed, or Boost_Cache_Error on failure.
	 */
	public static function iterate_directory( $path, Path_Action $action ) {
		clearstatcache();
		$validation_error = self::validate_path( $path );
		if ( $validation_error instanceof Boost_Cache_Error ) {
			return $validation_error;
		}

		$iterator = new \RecursiveIteratorIterator(
			new \RecursiveDirectoryIterator( $path, \RecursiveDirectoryIterator::SKIP_DOTS ),
			\RecursiveIteratorIterator::CHILD_FIRST
		);

		$count = 0;
		foreach ( $iterator as $file ) {
			$count += $action->apply_to_path( new SplFileInfo( $file ) );
		}

		$count += $action->apply_to_path( new SplFileInfo( $path ) );

		return $count;
	}

	/**
	 * Iterate over a directory and apply an action to each file.
	 *
	 * This applies the action to all files in the directory, except index.html. And doesn't go into subdirectories.
	 *
	 * @param string      $path - The directory to iterate over.
	 * @param Path_Action $action - The action to apply to each file.
	 * @return int|Boost_Cache_Error - The number of files processed, or Boost_Cache_Error on failure.
	 */
	public static function iterate_files( $path, Path_Action $action ) {
		clearstatcache();
		$validation_error = self::validate_path( $path );
		if ( $validation_error instanceof Boost_Cache_Error ) {
			return $validation_error;
		}

		$path = Boost_Cache_Utils::trailingslashit( $path );
		// Files to delete are all files in the given directory, except index.html. index.html is used to prevent directory listing.
		$files = array_diff( scandir( $path ), array( '.', '..', 'index.html' ) );
		$count = 0;
		foreach ( $files as $file ) {
			$fileinfo = new SplFileInfo( $path . $file );
			$count   += (int) $action->apply_to_path( $fileinfo );
		}

		return $count;
	}

	private static function validate_path( $path ) {
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

		return true;
	}

	/**
	 * Returns true if the given directory is inside the boost-cache directory.
	 *
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
	 * @param array $parameters  - An associative array of all the things that make this request special/different. Includes GET parameters and COOKIEs normally.
	 */
	public static function get_request_filename( $parameters ) {

		/**
		 * Filters the components used to generate the cache key.
		 *
		 * @param array $parameters The array of components, url, cookies, get parameters, etc.
		 *
		 * @since   1.0.0
		 * @deprecated 3.8.0
		 */
		$key_components = apply_filters_deprecated( 'boost_cache_key_components', array( $parameters ), '3.8.0', 'jetpack_boost_cache_parameters' );

		return md5( json_encode( $key_components ) ) . '.html'; // phpcs:ignore WordPress.WP.AlternativeFunctions.json_encode_json_encode
	}

	/**
	 * Check if a file is a rebuild file.
	 *
	 * @param string $file - The file to check.
	 * @return bool - True if the file is a rebuild file, false otherwise.
	 */
	public static function is_rebuild_file( $file ) {
		return substr( $file, -strlen( self::REBUILD_FILE_EXTENSION ) ) === self::REBUILD_FILE_EXTENSION;
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
	 * Rebuild a file. Make a copy of the file with a different extension instead of deleting it.
	 *
	 * @param string $file_path - The file to rebuild.
	 * @return bool - True if the file was rebuilt, false otherwise.
	 */
	public static function rebuild_file( $file_path ) {
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_is_writable
		if ( is_writable( $file_path ) ) {
			// only rename the file if it is not already a rebuild file.
			if ( ! self::is_rebuild_file( $file_path ) ) {
				// phpcs:ignore WordPress.WP.AlternativeFunctions.rename_rename, WordPress.PHP.NoSilencedErrors.Discouraged
				@rename( $file_path, $file_path . self::REBUILD_FILE_EXTENSION );
				@touch( $file_path . self::REBUILD_FILE_EXTENSION ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_touch, WordPress.PHP.NoSilencedErrors.Discouraged
				return true;
			}
		}

		return false;
	}

	/**
	 * Restore a file that was rebuilt so the cache file can be used for other visitors.
	 *
	 * @param string $file_path - The rebuilt file
	 * @return bool - True if the file was restored, false otherwise.
	 */
	public static function restore_file( $file_path ) {
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_is_writable
		if ( is_writable( $file_path ) ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.rename_rename, WordPress.PHP.NoSilencedErrors.Discouraged
			return @rename( $file_path, str_replace( self::REBUILD_FILE_EXTENSION, '', $file_path ) );
		}

		return false;
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
			// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink, WordPress.PHP.NoSilencedErrors.Discouraged
			return @unlink( $file_path );
		}

		return false;
	}

	/**
	 * Delete an empty cache directory.
	 *
	 * @param string $dir - The directory to delete.
	 * @return int - 1 if the directory was deleted, 0 otherwise.
	 *
	 * This function will delete the index.html file and the directory itself.
	 */
	public static function delete_empty_dir( $dir ) {
		if ( self::is_dir_empty( $dir ) ) {
			@unlink( $dir . '/index.html' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink, WordPress.PHP.NoSilencedErrors.Discouraged
			@rmdir( $dir ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir, WordPress.PHP.NoSilencedErrors.Discouraged
			return 1;
		}
		return 0;
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
