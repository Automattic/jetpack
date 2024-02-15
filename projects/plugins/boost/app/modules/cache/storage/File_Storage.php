<?php

namespace Automattic\Jetpack_Boost\Modules\Page_Cache\Storage;

// This file is loaded by advanced-cache.php, and so cannot rely on autoload.
require_once __DIR__ . '/Storage.php';
require_once dirname( __DIR__ ) . '/Boost_Cache_Utils.php';

use Automattic\Jetpack_Boost\Modules\Page_Cache\Boost_Cache_Utils;

/**
 * File Storage - handles writing to disk, reading from disk, purging and pruning old content.
 */
class File_Storage implements Storage {

	/**
	 * @var string - The root path where all cached files go.
	 */
	private $root_path;

	public function __construct( $root_path ) {
		$this->root_path = WP_CONTENT_DIR . '/boost-cache/cache' . Boost_Cache_Utils::sanitize_file_path( Boost_Cache_Utils::trailingslashit( $root_path ) );
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

		$now    = time();
		$count  = 0;
		$handle = is_readable( $this->root_path ) ? opendir( $this->root_path ) : false;
		if ( $handle ) {
			$file = readdir( $handle );
			while ( $file !== false ) {
				$file_path = $this->root_path . $file;
				$filemtime = file_exists( $file_path ) ? filemtime( $file_path ) : false;
				$expired   = ( $filemtime + $cache_duration ) <= $now;
				// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_is_writable
				$deletable = $file && file_exists( $file_path ) && is_writable( $file_path );

				if ( $deletable && ! $this->skip_garbage_collection( $file ) && $expired ) {
					// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
					unlink( $file_path );
					++$count;
				}

				// Take the next file.
				$file = readdir( $handle );
			}
			closedir( $handle );
		}

		return $count;
	}

	private function skip_garbage_collection( $file ) {
		if ( $file === '.' || $file === '..' ) {
			return true;
		}

		if ( is_dir( $this->root_path . $file ) ) {
			return true;
		}

		if ( substr( $file, -9 ) !== '.htaccess' && $file !== 'index.html' ) {
			return true;
		}

		return false;
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
}
