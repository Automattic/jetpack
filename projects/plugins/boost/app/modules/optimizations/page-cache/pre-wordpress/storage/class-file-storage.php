<?php
/*
 * This file may be called before WordPress is fully initialized. See the README file for info.
 */

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Storage;

use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Boost_Cache_Error;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Boost_Cache_Utils;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Filesystem_Utils;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Logger;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Path_Actions\Filter_Older;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Path_Actions\Rebuild_File;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Path_Actions\Simple_Delete;
use SplFileInfo;

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
		$filename  = Filesystem_Utils::get_request_filename( $parameters );

		if ( ! Filesystem_Utils::create_directory( $directory ) ) {
			return new Boost_Cache_Error( 'cannot-create-cache-dir', 'Could not create cache directory' );
		}

		return Filesystem_Utils::write_to_file( $directory . $filename, $data );
	}

	/**
	 * Given a request_uri and its parameters, reset the filename of a rebuild
	 * cache file and return true, or false otherwise.
	 * If a rebuild file is too old, it will be deleted and false will be returned.
	 *
	 * @param string $request_uri - The URI of this request (excluding GET parameters)
	 * @param array  $parameters  - An associative array of all the things that make this request special/different. Includes GET parameters and COOKIEs normally.
	 */
	public function reset_rebuild_file( $request_uri, $parameters ) {
		$directory = self::get_uri_directory( $request_uri );
		$filename  = Filesystem_Utils::get_request_filename( $parameters ) . Filesystem_Utils::REBUILD_FILE_EXTENSION;
		$hash_path = $directory . $filename;

		if ( file_exists( $hash_path ) ) {
			$expired = ( @filemtime( $hash_path ) + JETPACK_BOOST_CACHE_REBUILD_DURATION ) <= time(); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged

			if ( $expired ) {
				if ( Filesystem_Utils::delete_file( $hash_path ) ) {
					Logger::debug( "Deleted expired rebuilt file: $hash_path" );
				} else {
					Logger::debug( "Could not delete expired rebuilt file: $hash_path" );
				}
				return false;
			}

			if ( Filesystem_Utils::restore_file( $hash_path ) ) {
				Logger::debug( "Restored rebuilt file: $hash_path" );
				return true;
			} else {
				Logger::debug( "Could not restore rebuilt file: $hash_path" );
				return false;
			}
		}
		return false;
	}

	/**
	 * Given a request_uri and its parameters, return any stored data from the cache, or false otherwise.
	 *
	 * @param string $request_uri - The URI of this request (excluding GET parameters)
	 * @param array  $parameters  - An associative array of all the things that make this request special/different. Includes GET parameters and COOKIEs normally.
	 */
	public function read( $request_uri, $parameters ) {
		$directory = self::get_uri_directory( $request_uri );
		$filename  = Filesystem_Utils::get_request_filename( $parameters );
		$hash_path = $directory . $filename;

		if ( file_exists( $hash_path ) ) {
			$filemtime = @filemtime( $hash_path ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
			$expired   = ( $filemtime + JETPACK_BOOST_CACHE_DURATION ) <= time();

			// If file exists and is not expired, return the file contents.
			if ( ! $expired ) {
				// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents, WordPress.Security.EscapeOutput.OutputNotEscaped
				return file_get_contents( $hash_path );
			}

			// If file exists but is expired, delete it.
			if ( Filesystem_Utils::delete_file( $hash_path ) ) {
				Logger::debug( "Deleted expired file: $hash_path" );
			} else {
				Logger::debug( "Could not delete expired file: $hash_path" );
			}
		}

		return false;
	}

	/**
	 * Garbage collect expired files.
	 *
	 * @param int $cache_ttl If file is is created before this specified number of seconds, it will be deleted.
	 */
	public function garbage_collect( $cache_ttl = JETPACK_BOOST_CACHE_DURATION ) {
		if ( $cache_ttl === -1 ) {
			// Garbage collection is disabled.
			return false;
		}

		$created_before = time() - $cache_ttl;

		$count = Filesystem_Utils::iterate_directory( $this->root_path, new Filter_Older( $created_before, new Rebuild_File() ) );
		if ( $count instanceof Boost_Cache_Error ) {
			Logger::debug( 'Garbage collection failed: ' . $count->get_error_message() );
			return false;
		}

		Logger::debug( "Garbage collected $count files" );
		return $count;
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
	 * Delete cache based on given parameters.
	 *
	 * @param string $path - The path to delete the cache for.
	 * @param array  $args - The parameters defining the cache filename.
	 * Example:
	 * array(
	 *  'rebuild' => (boolean) default true - If true, cache files will be rebuilt instead of being deleted.
	 *  'parameters' => false | array, default false - If array is provided, the files created for that specific request matching the parameter will be effected. If parameter is provided, recursive is ignored and considered as false.
	 *  'recursive' => (boolean) default false - If true, the cache will be deleted recursively in subdirectories.
	 * )
	 */
	public function clear( $path, $args = array() ) {
		$normalized_path = Boost_Cache_Utils::normalize_request_uri( $this->sanitize_path( $path ) );
		$normalized_path = Boost_Cache_Utils::trailingslashit( $this->root_path . $normalized_path );

		// Ensure the path is within the cache directory
		if ( strpos( $normalized_path, $this->root_path ) !== 0 ) {
			Logger::debug( 'Attempted to delete cache for path outside of cache directory: ' . $path );
			return;
		}

		$recursive  = $args['recursive'] ?? false;
		$rebuild    = $args['rebuild'] ?? true;
		$parameters = $args['parameters'] ?? false;

		if ( $rebuild ) {
			$action = new Rebuild_File();
		} else {
			$action = new Simple_Delete();
		}

		// If parameters are provided, delete the specific file and skip any iteration.
		if ( $parameters ) {
			$action->apply_to_path( new SplFileInfo( $normalized_path . Filesystem_Utils::get_request_filename( $parameters ) ) );
			return;
		}

		if ( $recursive ) {
			Filesystem_Utils::iterate_directory( $normalized_path, $action );
		} else {
			Filesystem_Utils::iterate_files( $normalized_path, $action );
		}
	}
}
