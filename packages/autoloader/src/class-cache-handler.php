<?php
/* HEADER */ // phpcs:ignore

/**
 * This class handles reading and writing to cache files for the autoloader.
 */
class Cache_Handler {

	/**
	 * Reads all of the content from the cache file.
	 *
	 * @param string $key The key for the cache file to read.
	 *
	 * @return mixed|false The content read from the cache file, false if it was not read.
	 */
	public function read_from_cache( $key ) {
		$cache_path = $this->get_cache_file_path( $key );

		// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		if ( ! @is_readable( $cache_path ) ) {
			return false;
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_read_fopen
		$fp = fopen( $cache_path, 'r' );

		// We need to obtain a shared lock on the cache file to prevent requests from
		// reading bad cache files.
		if ( false === $fp || false === flock( $fp, LOCK_SH ) ) {
			return false;
		}

		$raw_cache = '';
		while ( ! feof( $fp ) ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_read_fread
			$raw_cache .= fread( $fp, 4096 );
		}

		flock( $fp, LOCK_UN );
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_read_fclose
		fclose( $fp );

		return json_decode( $raw_cache, true );
	}

	/**
	 * Writes the data to the cache.
	 *
	 * @param string $key  The key to the cache file we want to write.
	 * @param mixed  $data The data we're writing to the cache.
	 */
	public function write_to_cache( $key, $data ) {
		$cache_path = $this->get_cache_file_path( $key );

		// Make sure the directory we're trying to write to exists!
		if ( ! is_dir( dirname( $cache_path ) ) ) {
			// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
			@mkdir( dirname( $cache_path ), 0777, true );
		}

		$content = wp_json_encode( $data, JSON_PRETTY_PRINT );

		// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged,WordPress.WP.AlternativeFunctions.file_system_read_file_put_contents
		@file_put_contents(
			$cache_path,
			$content,
			// Lock the file to prevent readers from getting an out-of-date cache.
			LOCK_EX
		);
	}

	/**
	 * Fetches the path to the cache file.
	 *
	 * @param string $cache_file The filename of the cache file to read.
	 * @return string
	 */
	private function get_cache_file_path( $cache_file ) {
		if ( defined( 'JETPACK_AUTOLOAD_CACHE_FOLDER' ) ) {
			$dir = JETPACK_AUTOLOAD_CACHE_FOLDER;
		} else {
			$dir = trailingslashit( WP_CONTENT_DIR ) . 'cache';
		}

		return trailingslashit( $dir ) . $cache_file . '.json';
	}
}
