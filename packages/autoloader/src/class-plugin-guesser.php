<?php
/* HEADER */ // phpcs:ignore

/**
 * This class scans the WordPress installation to find active plugins.
 */
class Plugin_Guesser {

	/**
	 * Attempts to find all of the active plugins by guessing using different techniques.
	 *
	 * @return array $plugin_paths The list of absolute paths we've found.
	 */
	public function find_all_plugins() {
		$plugin_paths = array();

		// This option contains all of the plugins that have been activated via the interface.
		$plugin_paths[] = $this->find_using_option( 'active_plugins' );

		// This option contains all of the multisite plugins that have been network activated via the interface.
		if ( is_multisite() ) {
			$plugin_paths[] = $this->find_using_option( 'active_sitewide_plugins', true );
		}

		$plugin_paths[] = $this->find_activating_this_request();

		return array_unique( array_merge( ...$plugin_paths ) );
	}

	/**
	 * Checks a given option for plugin paths.
	 *
	 * @param string $option_name The option that we want to check for plugin information.
	 * @param bool   $site_option Indicates whether or not we want to check the site option.
	 *
	 * @return array $plugin_paths The list of absolute paths we've found.
	 */
	public function find_using_option( $option_name, $site_option = false ) {
		$raw = $site_option ? get_site_option( $option_name, array() ) : get_option( $option_name, array() );
		if ( empty( $raw ) ) {
			return array();
		}

		return $this->convert_plugins_to_paths( $raw );
	}

	/**
	 * Checks for plugins that are being activated in this request and returns all that it finds.
	 *
	 * @return array $plugin_paths The list of absolute paths we've found.
	 */
	public function find_activating_this_request() {
		// phpcs:disable WordPress.Security.NonceVerification.Recommended

		/**
		 * Note: we're not actually checking the nonce here because it's too early
		 * in the execution. The pluggable functions are not yet loaded to give
		 * plugins a chance to plug their versions. Therefore we're doing the bare
		 * minimum: checking whether the nonce exists and it's in the right place.
		 * The request will fail later if the nonce doesn't pass the check.
		 */
		if ( empty( $_REQUEST['_wpnonce'] ) ) {
			return array();
		}

		$plugin_slugs = array();

		$action = isset( $_REQUEST['action'] ) ? wp_unslash( $_REQUEST['action'] ) : false;
		switch ( $action ) {
			case 'activate':
				if ( empty( $_REQUEST['plugin'] ) ) {
					break;
				}

				$plugin_slugs[] = wp_unslash( $_REQUEST['plugin'] );
				break;

			case 'activate-selected':
				if ( empty( $_REQUEST['checked'] ) ) {
					break;
				}

				$plugin_slugs = wp_unslash( $_REQUEST['checked'] );
				break;
		}

		return $this->convert_plugins_to_paths( $plugin_slugs );
	}

	/**
	 * Given an array of plugin slugs or paths, this will convert them to absolute paths and filter
	 * out the plugins that are not directory plugins.
	 *
	 * @param string[] $plugins Plugin paths or slugs to filter.
	 *
	 * @return string[]
	 */
	private function convert_plugins_to_paths( $plugins ) {
		$plugin_paths = array();
		foreach ( $plugins as $plugin ) {
			$path = $this->guess_plugin_directory( $plugin );
			if ( $path ) {
				$plugin_paths[] = $path;
			}
		}

		return $plugin_paths;
	}

	/**
	 * Given a plugin path this will attempt to find the absolute path to the plugin.
	 *
	 * @param string $plugin The short plugin path.
	 * @return string|false $plugin_path The absolute path to the plugin or false if none was found.
	 */
	private function guess_plugin_directory( $plugin ) {
		$plugin = str_replace( '\\', '/', $plugin );

		// We may need to resolve an absolute path from a plugin path based out of a directory.
		if ( ! path_is_absolute( $plugin ) ) {
			$plugin = trailingslashit( WP_PLUGIN_DIR ) . $plugin;
			// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
			if ( ! @is_file( $plugin ) ) {
				return false;
			}
		}

		// If there is no vendor directory the plugin can't be using the autoloader and should be ignored.
		$plugin = dirname( $plugin );
		// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		if ( ! @is_dir( $plugin . '/vendor' ) ) {
			return false;
		}

		return $plugin;
	}
}
