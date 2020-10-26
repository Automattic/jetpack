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
	 * All of the active plugins that have been found.
	 *
	 * @var string[]
	 */
	private $active_plugins;

	/**
	 * All of the cached plugins that we've loaded.
	 *
	 * @var string[]
	 */
	private $cached_plugins;

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
	 * Gets the directory of the current plugin.
	 *
	 * @return string
	 */
	public function get_current_plugin() {
		// Escape from `vendor/jetpack-autoloader/__FILE__.php` to plugin directory.
		return dirname( dirname( dirname( __FILE__ ) ) );
	}

	/**
	 * Gets all of the active and cached plugins.
	 *
	 * @return string[]
	 */
	public function get_all_plugins() {
		return array_values(
			array_unique(
				array_merge(
					$this->get_active_plugins(),
					$this->get_cached_plugins()
				)
			)
		);
	}

	/**
	 * Gets all of the active plugins we can find.
	 *
	 * @return string[]
	 */
	public function get_active_plugins() {
		if ( ! isset( $this->active_plugins ) ) {
			$this->active_plugins = $this->find_active_plugins();
		}

		return $this->active_plugins;
	}

	/**
	 * Gets all of the cached plugins if there are any.
	 *
	 * @return string[]
	 */
	public function get_cached_plugins() {
		if ( ! isset( $this->cached_plugins ) ) {
			$cached = $this->cache_handler->read_from_cache( self::CACHE_KEY );
			if ( is_array( $cached ) ) {
				$this->cached_plugins = $cached;
			} else {
				$this->cached_plugins = array();
			}
		}

		return $this->cached_plugins;
	}

	/**
	 * Saves the active plugins into the cache so they can be loaded in subsequent requests.
	 */
	public function update_plugin_cache() {
		// Don't waste the time saving if we haven't actually changed anything.
		$active_plugins = $this->get_active_plugins();
		$cached_plugins = $this->get_cached_plugins();
		sort( $active_plugins );
		sort( $cached_plugins );
		if ( $active_plugins === $cached_plugins ) {
			return;
		}

		$this->cache_handler->write_to_cache( self::CACHE_KEY, $active_plugins );
	}

	/**
	 * Finds all of the active plugins and returns them.
	 *
	 * @return string[] $plugin_paths The list of absolute paths to plugins we've found.
	 */
	protected function find_active_plugins() {
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

		return array_values( array_unique( array_merge( ...$plugin_paths ) ) );
	}
}
