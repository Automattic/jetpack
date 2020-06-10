<?php
/* HEADER */ // phpcs:ignore

/**
 * This class provides information about the current plugin and the site's active plugins.
 */
class Plugins_Handler {

	/**
	 * Returns an array containing the directories of all active plugins and all known activating plugins.
	 *
	 * @return Array An array of plugin directories as strings or an empty array.
	 */
	public function get_all_active_plugins() {
		global $jetpack_autoloader_activating_plugins;

		$active_plugins    = $this->convert_plugins_to_dirs( $this->get_active_plugins() );
		$multisite_plugins = $this->convert_plugins_to_dirs( $this->get_multisite_plugins() );
		$active_plugins    = array_merge( $multisite_plugins, $active_plugins );

		$activating_plugins = $this->convert_plugins_to_dirs( $this->get_plugins_activating_via_request() );
		$activating_plugins = array_unique( array_merge( $activating_plugins, $jetpack_autoloader_activating_plugins ) );

		$plugins = array_unique( array_merge( $active_plugins, $activating_plugins ) );
		return $plugins;
	}

	/**
	 * Returns an array containing the names for the active sitewide plugins in a multisite environment.
	 *
	 * @return Array The names of the active sitewide plugins or an empty array.
	 */
	protected function get_multisite_plugins() {
		return is_multisite()
			? array_keys( get_site_option( 'active_sitewide_plugins', array() ) )
			: array();
	}

	/**
	 * Returns an array containing the names of the currently active plugins.
	 *
	 * @return Array The active plugins' names or an empty array.
	 */
	protected function get_active_plugins() {
		return (array) get_option( 'active_plugins', array() );
	}

	/**
	 * Ensure the plugin has its own directory and not a single-file plugin.
	 *
	 * @param string $plugin Plugin name, may be prefixed with "/".
	 *
	 * @return bool
	 */
	public function is_directory_plugin( $plugin ) {
		return false !== strpos( $plugin, '/', 1 );
	}

	/**
	 * Returns the plugin's directory.
	 *
	 * The input is a string with the format 'dir/file.php'. This method removes the 'file.php' part. The directory
	 * alone can be used to identify the plugin.
	 *
	 * @param string $plugin The plugin string with the format 'dir/file.php'.
	 *
	 * @return string The plugin's directory.
	 */
	private function remove_plugin_file_from_string( $plugin ) {
		return explode( '/', $plugin )[0];
	}

	/**
	 * Converts an array of plugin strings with the format 'dir/file.php' to an array of directories. Also removes any
	 * single-file plugins since they cannot have packages.
	 *
	 * @param Array $plugins The array of plugin strings with the format 'dir/file.php'.
	 *
	 * @return Array An array of plugin directories.
	 */
	private function convert_plugins_to_dirs( $plugins ) {
		$plugins = array_filter( $plugins, array( $this, 'is_directory_plugin' ) );
		return array_map( array( $this, 'remove_plugin_file_from_string' ), $plugins );
	}

	/**
	 * Checks whether the autoloader should be reset. The autoloader should be reset
	 * when a plugin is activating via a method other than a request, for example
	 * using WP-CLI. When this occurs, the activating plugin was not known when
	 * the autoloader selected the package versions for the classmap and filemap
	 * globals, so the autoloader must reselect the versions.
	 *
	 * If the current plugin is not already known, this method will add it to the
	 * $jetpack_autoloader_activating_plugins global.
	 *
	 * @return Boolean True if the autoloder must be reset, else false.
	 */
	public function should_autoloader_reset() {
		global $jetpack_autoloader_activating_plugins;

		$plugins        = $this->get_all_active_plugins();
		$current_plugin = $this->get_current_plugin_dir();
		$plugin_unknown = ! in_array( $current_plugin, $plugins, true );

		if ( $plugin_unknown ) {
			// If the current plugin isn't known, add it to the activating plugins list.
			$jetpack_autoloader_activating_plugins[] = $current_plugin;
		}

		return $plugin_unknown;
	}

	/**
	 * Returns an array containing the names of plugins that are activating via a request.
	 *
	 * @return Array An array of names of the activating plugins or an empty array.
	 */
	private function get_plugins_activating_via_request() {

		 // phpcs:disable WordPress.Security.NonceVerification.Recommended

		$action = isset( $_REQUEST['action'] ) ? $_REQUEST['action'] : false;
		$plugin = isset( $_REQUEST['plugin'] ) ? $_REQUEST['plugin'] : false;
		$nonce  = isset( $_REQUEST['_wpnonce'] ) ? $_REQUEST['_wpnonce'] : false;

		/**
		 * Note: we're not actually checking the nonce here becase it's too early
		 * in the execution. The pluggable functions are not yet loaded to give
		 * plugins a chance to plug their versions. Therefore we're doing the bare
		 * minimum: checking whether the nonce exists and it's in the right place.
		 * The request will fail later if the nonce doesn't pass the check.
		 */

		// In case of a single plugin activation there will be a plugin slug.
		if ( 'activate' === $action && ! empty( $nonce ) ) {
			return array( wp_unslash( $plugin ) );
		}

		$plugins = isset( $_REQUEST['checked'] ) ? $_REQUEST['checked'] : array();

		// In case of bulk activation there will be an array of plugins.
		if ( 'activate-selected' === $action && ! empty( $nonce ) ) {
			return array_map( 'wp_unslash', $plugins );
		}

		// phpcs:enable WordPress.Security.NonceVerification.Recommended

		return array();
	}

	/**
	 * Returns the directory of the current plugin.
	 *
	 * @return String The directory of the current plugin.
	 */
	public function get_current_plugin_dir() {
		return explode( '/', plugin_basename( __FILE__ ) )[0];
	}

	/**
	 * Resets the autoloader after a plugin update.
	 *
	 * @param bool  $response   Installation response.
	 * @param array $hook_extra Extra arguments passed to hooked filters.
	 * @param array $result     Installation result data.
	 *
	 * @return bool The passed in $response param.
	 */
	public function reset_maps_after_update( $response, $hook_extra, $result ) {
		global $jetpack_autoloader_latest_version;
		global $jetpack_packages_classmap;

		if ( isset( $hook_extra['plugin'] ) ) {
			$plugin = $hook_extra['plugin'];

			if ( ! $this->is_directory_plugin( $plugin ) ) {
				// Single-file plugins don't use packages, so bail.
				return $response;
			}

			if ( ! is_plugin_active( $plugin ) ) {
				// The updated plugin isn't active, so bail.
				return $response;
			}

			$plugin_path = trailingslashit( WP_PLUGIN_DIR ) . trailingslashit( explode( '/', $plugin )[0] );

			if ( is_readable( $plugin_path . 'vendor/autoload_functions.php' ) ) {
				// The plugin has a v2.x autoloader, so reset it.
				$jetpack_autoloader_latest_version = null;
				$jetpack_packages_classmap         = array();

				require $plugin_path . 'vendor/autoload_packages.php';
			}
		}

		return $response;
	}
}
