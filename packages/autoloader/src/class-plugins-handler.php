<?php
/* HEADER */ // phpcs:ignore

/**
 * This class handles locating and caching all of the active plugins.
 */
class Plugins_Handler {
	/**
	 * The transient key for plugin paths.
	 */
	const TRANSIENT_KEY = 'jetpack_autoloader_plugin_paths';

	/**
	 * The locator for finding plugins in different locations.
	 *
	 * @var Plugin_Locator
	 */
	private $plugin_locator;

	/**
	 * The processor for transforming cached paths.
	 *
	 * @var Path_Processor
	 */
	private $path_processor;

	/**
	 * The constructor.
	 *
	 * @param Plugin_Locator $plugin_locator The locator for finding active plugins.
	 * @param Path_Processor $path_processor The processor for transforming cached paths.
	 */
	public function __construct( $plugin_locator, $path_processor ) {
		$this->plugin_locator = $plugin_locator;
		$this->path_processor = $path_processor;
	}

	/**
	 * Gets all of the active plugins we can find.
	 *
	 * @param bool $include_deactivating When true, plugins deactivating this request will be considered active. Default true.
	 * @return string[]
	 */
	public function get_active_plugins( $include_deactivating = true ) {
		global $jetpack_autoloader_activating_plugins_paths;
		global $jetpack_autoloader_including_latest;

		// We're going to build a unique list of plugins from a few different sources
		// to find all of our "active" plugins. While we need to return an integer
		// array, we're going to use an associative array internally to reduce
		// the amount of time that we're going to spend checking uniqueness
		// and merging different arrays together to form the output.
		$active_plugins = array();

		// Make sure that plugins which have activated this request are considered as "active" even though
		// they probably won't be present in any option.
		if ( is_array( $jetpack_autoloader_activating_plugins_paths ) ) {
			foreach ( $jetpack_autoloader_activating_plugins_paths as $path ) {
				$active_plugins[ $path ] = $path;
			}
		}

		// This option contains all of the plugins that have been activated.
		$plugins = $this->plugin_locator->find_using_option( 'active_plugins' );
		foreach ( $plugins as $path ) {
			$active_plugins[ $path ] = $path;
		}

		// This option contains all of the multisite plugins that have been activated.
		if ( is_multisite() ) {
			$plugins = $this->plugin_locator->find_using_option( 'active_sitewide_plugins', true );
			foreach ( $plugins as $path ) {
				$active_plugins[ $path ] = $path;
			}
		}

		// These actions contain plugins that are being activated during this request.
		$plugins = $this->plugin_locator->find_using_request_action( array( 'activate', 'activate-selected' ) );
		foreach ( $plugins as $path ) {
			$active_plugins[ $path ] = $path;
		}

		// While it's true that the deactivating plugins are more than likely already in the active list
		// at this point, we should make sure in order to avoid any strange misbehavior.
		if ( $include_deactivating ) {
			// These actions contain plugins that are being deactivated during this request.
			$plugins = $this->plugin_locator->find_using_request_action( array( 'deactivate', 'deactivate-selected' ) );
			foreach ( $plugins as $path ) {
				$active_plugins[ $path ] = $path;
			}
		}

		// When the current plugin isn't considered "active" there's a problem.
		// Since we're here, the plugin is active and currently being loaded.
		// We can support this case (mu-plugins and non-standard activation)
		// by adding the current plugin to the active list and marking it
		// as an unknown (activating) plugin. This also has the benefit
		// of causing a reset because the active plugins list has
		// been changed since it was saved in the global.
		$current_plugin = $this->plugin_locator->find_current_plugin();
		if ( ! in_array( $current_plugin, $active_plugins, true ) && ! $jetpack_autoloader_including_latest ) {
			$active_plugins[ $current_plugin ]             = $current_plugin;
			$jetpack_autoloader_activating_plugins_paths[] = $current_plugin;
		}

		// When deactivating plugins aren't desired we should entirely remove them from the active list.
		if ( ! $include_deactivating ) {
			// These actions contain plugins that are being deactivated during this request.
			$plugins = $this->plugin_locator->find_using_request_action( array( 'deactivate', 'deactivate-selected' ) );
			foreach ( $plugins as $path ) {
				unset( $active_plugins[ $path ] );
			}
		}

		// Transform the array so that we don't have to worry about the keys interacting with other array types later.
		return array_values( $active_plugins );
	}

	/**
	 * Gets all of the cached plugins if there are any.
	 *
	 * @return string[]
	 */
	public function get_cached_plugins() {
		$cached = get_transient( self::TRANSIENT_KEY );
		if ( false === $cached ) {
			return array();
		}

		// We need to expand the tokens to an absolute path for this webserver.
		return array_map( array( $this->path_processor, 'untokenize_path_constants' ), $cached );
	}

	/**
	 * Saves the plugin list to the cache.
	 *
	 * @param array $plugins The plugin list to save to the cache.
	 */
	public function cache_plugins( $plugins ) {
		// We store the paths in a tokenized form so that that webservers with different absolute paths don't break.
		$plugins = array_map( array( $this->path_processor, 'tokenize_path_constants' ), $plugins );

		set_transient( self::TRANSIENT_KEY, $plugins );
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
