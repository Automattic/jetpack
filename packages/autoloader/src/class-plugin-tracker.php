<?php
/* HEADER */ // phpcs:ignore

/**
 * This class tracks the plugins that are actively using the autoloader and caches them to maintain a list of
 * active plugins that may not be discoverable using the guesser.
 */
class Plugin_Tracker {

	/**
	 * An array containing all of the plugin paths that have been cached from a previous request.
	 *
	 * @var string[]
	 */
	private $cached_plugins;

	/**
	 * An array containing all of the plugin paths that have loaded the autoloader this request.
	 *
	 * @var string[]
	 */
	private $loaded_plugins;

	/**
	 * The constructor.
	 */
	public function __construct() {
		$this->loaded_plugins = array();
		$this->cached_plugins = array();
	}

	/**
	 * Loads the plugin paths that may be stored in the cache.
	 */
	public function load_cache() {
		$this->cached_plugins = array();
		$cache_path           = $this->get_cache_file_path();

		// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		if ( ! @is_readable( $cache_path ) ) {
			return;
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_read_fopen
		$fp = fopen( $cache_path, 'r' );

		// We need to obtain a shared lock on the cache file to prevent requests from
		// reading bad cache files.
		if ( false === $fp || false === flock( $fp, LOCK_SH ) ) {
			return;
		}

		$raw_cache = '';
		while ( ! feof( $fp ) ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_read_fread
			$raw_cache .= fread( $fp, 4096 );
		}

		flock( $fp, LOCK_UN );
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_read_fclose
		fclose( $fp );

		// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged,WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		$raw_cache = json_decode( $raw_cache );
		if ( empty( $raw_cache ) ) {
			return;
		}
		foreach ( $raw_cache as $item ) {
			$this->cached_plugins[] = $item;
		}

		// Keep the list sorted so we can do a fast comparison when saving the cache.
		sort( $this->cached_plugins );
	}

	/**
	 * Records the folder path for a loaded plugin in the tracker.
	 *
	 * @param string $plugin_path The path to the plugin's folder.
	 */
	public function add_loaded_plugin( $plugin_path ) {
		if ( in_array( $plugin_path, $this->loaded_plugins, true ) ) {
			return;
		}

		$this->loaded_plugins[] = $plugin_path;
	}

	/**
	 * Returns all of the plugins that have recorded.
	 *
	 * @return string[]
	 */
	public function get_plugins() {
		return array_unique( array_merge( $this->loaded_plugins, $this->cached_plugins ) );
	}

	/**
	 * Writes the loaded plugins to the cache.
	 */
	public function write_cache() {

		// We don't want to alter the cache if the plugins we've loaded haven't changed.
		sort( $this->loaded_plugins );
		// phpcs:ignore WordPress.PHP.StrictComparisons.LooseComparison
		if ( $this->cached_plugins == $this->loaded_plugins ) {
			return;
		}

		$cache_path = $this->get_cache_file_path();
		$content    = wp_json_encode( $this->loaded_plugins, JSON_PRETTY_PRINT );
		// We shouldn't save empty caches since they shouldn't be loaded.
		if ( empty( $content ) ) {
			// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
			@unlink( $cache_path );
			return;
		}

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
	 * @return string
	 */
	private function get_cache_file_path() {
		if ( defined( 'JETPACK_AUTOLOAD_CACHE_PATH' ) ) {
			return JETPACK_AUTOLOAD_CACHE_PATH;
		}

		return trailingslashit( WP_CONTENT_DIR ) . 'cache/jetpack-autoloader-plugin-cache.json';
	}
}
