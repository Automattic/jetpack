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
	 * Gets the directory of the current plugin.
	 *
	 * @return string
	 */
	public function get_current_plugin() {
		// Escape from `vendor/__DIR__` to plugin directory.
		return dirname( dirname( __DIR__ ) );
	}

	/**
	 * Gets all of the active plugins we can find.
	 *
	 * @return string[]
	 */
	public function get_active_plugins() {
		global $jetpack_autoloader_activating_plugins_paths;
		global $jetpack_autoloader_including_latest;

		$active_plugins = array();

		// Make sure that plugins which have activated this request are considered as "active" even though
		// they probably won't be present in any option.
		$active_plugins[] = (array) $jetpack_autoloader_activating_plugins_paths;

		// This option contains all of the plugins that have been activated via the interface.
		$active_plugins[] = $this->plugin_locator->find_using_option( 'active_plugins' );

		// This option contains all of the multisite plugins that have been network activated via the interface.
		if ( is_multisite() ) {
			$active_plugins[] = $this->plugin_locator->find_using_option( 'active_sitewide_plugins', true );
		}

		$active_plugins[] = $this->plugin_locator->find_activating_this_request();

		// Flatten this into a unique array for it to be returned.
		$active_plugins = array_values( array_unique( array_merge( ...$active_plugins ) ) );

		// When the current plugin isn't considered "active" there's a problem.
		// Since we're here, the plugin is active and currently being loaded.
		// We can support this case (mu-plugins and non-standard activation)
		// by adding the current plugin to the active list and marking it
		// as an unknown (activating) plugin. This also has the benefit
		// of causing a reset because the active plugins list has
		// been changed since it was saved in the global.
		$current_plugin = $this->get_current_plugin();
		if ( ! in_array( $current_plugin, $active_plugins, true ) && ! $jetpack_autoloader_including_latest ) {
			$active_plugins[]                              = $current_plugin;
			$jetpack_autoloader_activating_plugins_paths[] = $current_plugin;
		}

		return $active_plugins;
	}

	/**
	 * Gets all of the cached plugins if there are any.
	 *
	 * @return string[]
	 */
	public function get_cached_plugins() {
		$cached = $this->cache_handler->read_from_cache( self::CACHE_KEY );
		if ( is_array( $cached ) ) {
			return $cached;
		}

		return array();
	}

	/**
	 * Saves the plugin list to the cache.
	 *
	 * @param array $plugins The plugin list to save to the cache.
	 */
	public function cache_plugins( $plugins ) {
		$this->cache_handler->write_to_cache( self::CACHE_KEY, $plugins );
	}

	/**
	 * Checks to see whether or not the plugin list given has changed when compared to the
	 * shared `$jetpack_autoloader_cached_plugin_paths` global. This allows us to deal
	 * with cases where the active list may change due to filtering..
	 *
	 * @param string[] $plugins The plugins list to check against the global cache.
	 *
	 * @return bool True if the plugins have changed, otherwise false.
	 */
	public function have_plugins_changed( $plugins ) {
		global $jetpack_autoloader_cached_plugin_paths;

		// When no autoloader has executed there is nothing to have changed.
		if ( ! isset( $jetpack_autoloader_cached_plugin_paths ) ) {
			$jetpack_autoloader_cached_plugin_paths = $plugins;
			return false;
		}

		if ( $jetpack_autoloader_cached_plugin_paths !== $plugins ) {
			$jetpack_autoloader_cached_plugin_paths = $plugins;
			return true;
		}

		return false;
	}
}
