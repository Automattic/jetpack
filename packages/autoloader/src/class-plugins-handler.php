<?php
/* HEADER */ // phpcs:ignore

/**
 * This class provides information about the current plugin and the site's active plugins.
 */
class Plugins_Handler {

	/**
	 * Returns an array containing all active plugins and all known activating
	 * plugins.
	 *
	 * @param bool $skip_single_file_plugins If true, plugins with no dedicated directories will be skipped.
	 *
	 * @return Array An array of plugin names as strings.
	 */
	public function get_all_active_plugins( $skip_single_file_plugins = true ) {
		$active_plugins = array_merge(
			is_multisite()
				? array_keys( get_site_option( 'active_sitewide_plugins', array() ) )
				: array(),
			(array) get_option( 'active_plugins', array() )
		);

		$plugins = array_unique( array_merge( $active_plugins, $this->get_all_activating_plugins() ) );

		if ( $skip_single_file_plugins ) {
			$plugins = array_filter( $plugins, array( $this, 'is_directory_plugin' ) );
		}

		return $plugins;
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
		$current_plugin = $this->get_current_plugin();
		$plugin_unknown = ! in_array( $current_plugin, $plugins, true );

		if ( $plugin_unknown ) {
			// If the current plugin isn't known, add it to the activating plugins list.
			$jetpack_autoloader_activating_plugins[] = $current_plugin;
		}

		return $plugin_unknown;
	}

	/**
	 * Returns the names of activating plugins if the plugins are activating via a request.
	 *
	 * @return Array The array of the activating plugins or empty array.
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
	 * Returns an array of the names of all known activating plugins. This includes
	 * plugins activating via a request and plugins that are activating via other
	 * methods.
	 *
	 * @return Array The array of all activating plugins or empty array.
	 */
	private function get_all_activating_plugins() {
		global $jetpack_autoloader_activating_plugins;

		$activating_plugins = $this->get_plugins_activating_via_request();
		return array_unique( array_merge( $activating_plugins, $jetpack_autoloader_activating_plugins ) );
	}

	/**
	 * Returns the name of the current plugin.
	 *
	 * @return String The name of the current plugin.
	 */
	public function get_current_plugin() {
		if ( ! function_exists( 'get_plugins' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		$dir  = explode( '/', plugin_basename( __FILE__ ) )[0];
		$file = array_keys( get_plugins( "/$dir" ) )[0];
		return "$dir/$file";
	}
}
