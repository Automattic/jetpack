<?php
/* HEADER */ // phpcs:ignore

/**
 * This class handles locating and caching all of the active plugins.
 */
class Plugins_Handler {
	/**
	 * The cache key for plugin paths.
	 */
	const CACHE_KEY = 'plugin-paths';

	/**
	 * The locator for finding plugins in different locations.
	 *
	 * @var Plugin_Locator
	 */
	private $plugin_locator;

	/**
	 * The handler for interacting with cache files.
	 *
	 * @var Cache_Handler
	 */
	private $cache_handler;

	/**
	 * The constructor.
	 *
	 * @param Plugin_Locator $plugin_locator The locator for finding active plugins.
	 * @param Cache_Handler  $cache_handler  The handler for interacting with cache files.
	 */
	public function __construct( $plugin_locator, $cache_handler ) {
		$this->plugin_locator = $plugin_locator;
		$this->cache_handler  = $cache_handler;
	}

	/**
	 * Finds the directory of the current plugin.
	 *
	 * @return string
	 */
	public function find_current_plugin() {
		// Escape from `vendor/jetpack-autoloader/__FILE__.php` to plugin directory.
		return dirname( dirname( dirname( __FILE__ ) ) );
	}

	/**
	 * Finds all of the plugins and returns them.
	 *
	 * @param boolean $include_cache Indicates whether or not we should include the cached plugin paths in the output.
	 *
	 * @return array $plugin_paths The list of absolute paths to plugins we've found.
	 */
	public function find_all_plugins( $include_cache ) {
		$plugin_paths = array();

		// Make sure that plugins which have activated this request are considered as "active" even though
		// they probably won't be present in any option.
		global $jetpack_autoloader_activating_plugins_paths;
		$plugin_paths[] = (array) $jetpack_autoloader_activating_plugins_paths;

		// This option contains all of the plugins that have been activated via the interface.
		$plugin_paths[] = $this->plugin_locator->find_using_option( 'active_plugins' );

		// This option contains all of the multisite plugins that have been network activated via the interface.
		if ( is_multisite() ) {
			$plugin_paths[] = $this->plugin_locator->find_using_option( 'active_sitewide_plugins', true );
		}

		$plugin_paths[] = $this->plugin_locator->find_activating_this_request();

		if ( $include_cache ) {
			$cached = $this->cache_handler->read_from_cache( self::CACHE_KEY );
			if ( is_array( $cached ) ) {
				$plugin_paths[] = $cached;
			}
		}

		return array_values( array_unique( array_merge( ...$plugin_paths ) ) );
	}
}
