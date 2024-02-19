<?php
/*
 * This file may be called before WordPress is fully initialized. See the README file for info.
 */

namespace Automattic\Jetpack_Boost\Modules\Page_Cache\Pre_WordPress\Storage;

use Automattic\Jetpack_Boost\Modules\Page_Cache\Pre_WordPress\Boost_Cache_Utils;
use Automattic\Jetpack_Boost\Modules\Page_Cache\Pre_WordPress\Logger;

/**
 * File Storage - handles writing to disk, reading from disk, purging and pruning old content.
 */
class File_Storage implements Storage {

	/**
	 * @var string - The root path where all cached files go.
	 */
	private $root_path;

	public function __construct( $root_path ) {
		$this->root_path = WP_CONTENT_DIR . '/boost-cache/cache/' . Boost_Cache_Utils::sanitize_file_path( Boost_Cache_Utils::trailingslashit( $root_path ) );
	}

	/**
	 * Given a request_uri and its parameters, store the given data in the cache.
	 *
	 * @param string $request_uri - The URI of this request (excluding GET parameters)
	 * @param array  $parameters  - An associative array of all the things that make this request special/different. Includes GET parameters and COOKIEs normally.
	 * @param string $data        - The data to write to disk.
	 */
	public function write( $request_uri, $parameters, $data ) {
		$directory = self::get_uri_directory( $request_uri );
		$filename  = self::get_request_filename( $request_uri, $parameters );

		if ( ! Boost_Cache_Utils::create_directory( $directory ) ) {
			return new \WP_Error( 'Could not create cache directory' );
		}

		return Boost_Cache_Utils::write_to_file( $directory . $filename, $data );
	}

	/**
	 * Given a request_uri and its parameters, return any stored data from the cache, or false otherwise.
	 *
	 * @param string $request_uri - The URI of this request (excluding GET parameters)
	 * @param array  $parameters  - An associative array of all the things that make this request special/different. Includes GET parameters and COOKIEs normally.
	 */
	public function read( $request_uri, $parameters ) {
		$directory = self::get_uri_directory( $request_uri );
		$filename  = self::get_request_filename( $request_uri, $parameters );
		$full_path = $directory . $filename;

		if ( file_exists( $full_path ) ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents, WordPress.Security.EscapeOutput.OutputNotEscaped
			return file_get_contents( $full_path );
		}

		return false;
	}

	/**
	 * Garbage collect expired files.
	 */
	public function garbage_collect() {
		$cache_duration = apply_filters( 'jetpack_boost_cache_duration', 3600 );

		if ( $cache_duration === 0 ) {
			// Garbage collection is disabled.
			return false;
		}

		clearstatcache();

		$count = $this->delete_expired_files( $this->root_path, $cache_duration );

		Logger::debug( "Garbage collected $count files" );
	}

	/**
	 * Recursively garbage collect a directory.
	 *
	 * @param string $directory - The directory to garbage collect.
	 * @param int    $file_ttl  - Specify number of seconds after which a file is considered expired.
	 */
	public function delete_expired_files( $directory, $file_ttl ) {
		$count  = 0;
		$now    = time();
		$handle = is_readable( $directory ) && is_dir( $directory ) ? opendir( $directory ) : false;
		if ( $handle ) {
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
					$count += $this->delete_expired_files( $file_path, $file_ttl );
					continue;
				}

				$filemtime = filemtime( $file_path );
				$expired   = ( $filemtime + $file_ttl ) <= $now;
				if ( $expired ) {
					if ( $this->delete_file( $file_path ) ) {
						++$count;
					} else {
						Logger::debug( 'Could not delete file: ' . $file_path );
					}
				}
			}
			closedir( $handle );

			// If the directory is empty after processing it's files, delete it.
			$is_dir_empty = $this->is_dir_empty( $directory );
			if ( is_wp_error( $is_dir_empty ) ) {
				Logger::debug( 'Could not check directory emptiness: ' . $is_dir_empty->get_error_message() );
				return $count;
			}

			if ( $is_dir_empty ) {
				// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir
				rmdir( $directory );
			}
		}

		return $count;
	}

	private function delete_file( $file_path ) {
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
	private function is_dir_empty( $dir ) {
		if ( ! is_readable( $dir ) ) {
			return new \WP_Error( 'directory_not_readable', 'Directory is not readable' );
		}

		return ( count( scandir( $dir ) ) === 2 ); // All directories have '.' and '..'
	}

	/**
	 * Given a request_uri, return the filesystem path where it should get stored. Handles sanitization.
	 * Note that the directory path does not take things like GET parameters or cookies into account, for easy cache purging.
	 *
	 * @param string $request_uri - The URI of this request (excluding GET parameters)
	 */
	private function get_uri_directory( $request_uri ) {
		return Boost_Cache_Utils::trailingslashit( $this->root_path . self::sanitize_path( $request_uri ) );
	}

	/**
	 * Given a request_uri and its parameters, return the filename to use for this cached data. Does not include the file path.
	 *
	 * @param string $request_uri - The URI of this request (excluding GET parameters)
	 * @param array  $parameters  - An associative array of all the things that make this request special/different. Includes GET parameters and COOKIEs normally.
	 */
	private function get_request_filename( $request_uri, $parameters ) {
		$key_components = array(
			'request_uri' => $request_uri,
			'parameters'  => $parameters,
		);

		$key_components = apply_filters( 'boost_cache_key_components', $key_components );

		return md5( json_encode( $key_components ) ) . '.html'; // phpcs:ignore WordPress.WP.AlternativeFunctions.json_encode_json_encode
	}

	/**
	 * Sanitize a path for safe usage on the local filesystem.
	 *
	 * @param string $path - The path to sanitize.
	 */
	private function sanitize_path( $path ) {
		static $_cache = array();
		if ( isset( $_cache[ $path ] ) ) {
			return $_cache[ $path ];
		}

		$path = Boost_Cache_Utils::sanitize_file_path( $path );

		$_cache[ $path ] = $path;
		return $path;
	}

	/**
	 * Delete all cached data for the given path.
	 *
	 * @param string $path - The path to delete.
	 */
	public function invalidate( $path ) {
		error_log( "invalidate: $path" ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		$path = $this->sanitize_path( $path );
		$dir  = $this->root_path . $path;

		if ( Boost_Cache_Utils::is_boost_cache_directory( $dir ) ) {
			return Boost_Cache_Utils::delete_directory( $dir );
		}

		return false;
	}

	/**
	 * Given a request_uri and its parameters, delete the cached data for this request.
	 *
	 * @param string $request_uri - The URI of this request (excluding GET parameters)
	 * @param array  $parameters  - An associative array of all the things that make this request special/different. Includes GET parameters and COOKIEs normally.
	 */
	public function invalidate_single_visitor( $request_uri, $parameters ) {
		$directory = self::get_uri_directory( $request_uri );
		$filename  = self::get_request_filename( $request_uri, $parameters );
		$full_path = $directory . $filename;
		error_log( 'Deleting ' . $full_path . ' from cache' ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log

		if ( file_exists( $full_path ) ) {
			return wp_delete_file( $full_path );
		}

		return false;
	}

	/**
	 * Delete the cached files for the home page, and any paged archives.
	 */
	public function invalidate_home_page( $dir ) {
		$dir = $this->root_path . Boost_Cache_Utils::sanitize_file_path( $dir );

		if ( Boost_Cache_Utils::is_boost_cache_directory( $dir ) ) {
			if ( is_dir( $dir . '/page' ) ) {
				Boost_Cache_Utils::delete_directory( $dir . '/page' );
			}
			error_log( "invalidate_home_page: $dir" ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			return Boost_Cache_Utils::delete_single_directory( $dir );
		}

		return false;
	}
}
