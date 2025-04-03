<?php
/*
 * This file may be called before WordPress is fully initialized. See the README file for info.
 */

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Storage;

use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Boost_Cache_Error;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Boost_Cache_Utils;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Filesystem_Utils;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Logger;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Path_Actions\Manage_Expired;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Path_Actions\Rebuild_File;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Path_Actions\Simple_Delete;

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
			$expired = ( filemtime( $hash_path ) + JETPACK_BOOST_CACHE_REBUILD_DURATION ) <= time();

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
			$filemtime = filemtime( $hash_path );
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
	 */
	public function garbage_collect() {
		if ( JETPACK_BOOST_CACHE_DURATION === 0 ) {
			// Garbage collection is disabled.
			return false;
		}

		$count = Filesystem_Utils::iterate_directory( $this->root_path, new Manage_Expired( JETPACK_BOOST_CACHE_DURATION, new Rebuild_File() ) );
		if ( $count instanceof Boost_Cache_Error ) {
			Logger::debug( 'Garbage collection failed: ' . $count->get_error_message() );
			return false;
		}

		Logger::debug( "Garbage collected $count files" );
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

	public function delete_page( $path ) {
		$normalized_path = $this->root_path . Boost_Cache_Utils::normalize_request_uri( $path );

		$result = Filesystem_Utils::iterate_files( $normalized_path, new Simple_Delete() );

		return $result;
	}

	public function rebuild_page( $path ) {
		$normalized_path = $this->root_path . Boost_Cache_Utils::normalize_request_uri( $path );

		$result = Filesystem_Utils::iterate_files( $normalized_path, new Rebuild_File() );

		return $result;
	}

	public function delete_recursive( $path ) {
		$normalized_path = $this->root_path . Boost_Cache_Utils::normalize_request_uri( $path );

		$result = Filesystem_Utils::iterate_directory( $normalized_path, new Simple_Delete() );

		return $result;
	}

	public function rebuild_recursive( $path ) {
		$normalized_path = $this->root_path . Boost_Cache_Utils::normalize_request_uri( $path );

		$result = Filesystem_Utils::iterate_directory( $normalized_path, new Rebuild_File() );

		return $result;
	}
}
