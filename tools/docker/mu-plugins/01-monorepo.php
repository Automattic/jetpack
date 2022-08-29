<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Plugin Name: Monorepo Helper
 * Description: A common place for monorepo things.
 * Version: 1.0
 * Author: Automattic
 * Author URI: https://automattic.com/
 * Text Domain: jetpack
 *
 * @package automattic/jetpack
 */

namespace Jetpack\Docker\MuPlugin;

/**
 * Monorepo Tools.
 */
class Monorepo {
	/**
	 * Path to monorepo.
	 *
	 * @var string
	 */
	protected $monorepo;
	/**
	 * Path to monorepo plugins.
	 *
	 * @var string
	 */
	protected $plugins;
	/**
	 * Path to monorepo packages.
	 *
	 * @var string
	 */
	protected $packages;

	/**
	 * Class constructor.
	 */
	public function __construct() {
		/**
		 * Filter the monorepo path for development environments.
		 *
		 * @since $$next-version$$
		 *
		 * @param string $path Monorepo file path.
		 */
		$this->monorepo = apply_filters( 'jetpack_monorepo_path', '/usr/local/src/jetpack-monorepo/' );
		$this->plugins  = $this->monorepo . 'projects/plugins/';
		$this->packages = $this->monorepo . 'projects/packages/';
	}

	/**
	 * Property Getter
	 *
	 * @param string $var Property to get.
	 *
	 * @throws Exception If the requested property does not exist.
	 */
	public function get( $var ) {
		if ( is_string( $var ) && isset( $this->$var ) ) {
			return $this->$var;
		}
		throw new Exception( "Class property $var does not exist." );
	}

	/**
	 * The same as Core's get_plugins, without forcing a passed value to be within the wp-content/plugins folder.
	 *
	 * @param string $plugin_folder Folder to find plugins within.
	 */
	private function get_plugins( $plugin_folder = '' ) {
		$cache_plugins = wp_cache_get( 'monorepo_plugins', 'monorepo_plugins' ); // Updated cache values to not conflict.
		if ( ! $cache_plugins ) {
			$cache_plugins = array();
		}

		if ( isset( $cache_plugins[ $plugin_folder ] ) ) {
			return $cache_plugins[ $plugin_folder ];
		}

		$wp_plugins  = array();
		$plugin_root = WP_PLUGIN_DIR;
		if ( ! empty( $plugin_folder ) ) {
			$plugin_root = $plugin_folder; // This is what we changed, but it's dangerous. Thus a private function.
		}

		// Files in wp-content/plugins directory.
		$plugins_dir  = @opendir( $plugin_root ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		$plugin_files = array();

		if ( $plugins_dir ) {
			while ( ( $file = readdir( $plugins_dir ) ) !== false ) { // phpcs:ignore WordPress.CodeAnalysis.AssignmentInCondition.FoundInWhileCondition
				if ( '.' === substr( $file, 0, 1 ) ) {
					continue;
				}

				if ( is_dir( $plugin_root . '/' . $file ) ) {
					$plugins_subdir = @opendir( $plugin_root . '/' . $file ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged

					if ( $plugins_subdir ) {
						while ( ( $subfile = readdir( $plugins_subdir ) ) !== false ) { // phpcs:ignore WordPress.CodeAnalysis.AssignmentInCondition.FoundInWhileCondition
							if ( '.' === substr( $subfile, 0, 1 ) ) {
								continue;
							}

							if ( '.php' === substr( $subfile, -4 ) ) {
								$plugin_files[] = "$file/$subfile";
							}
						}

						closedir( $plugins_subdir );
					}
				} else {
					if ( '.php' === substr( $file, -4 ) ) {
						$plugin_files[] = $file;
					}
				}
			}

			closedir( $plugins_dir );
		}

		if ( empty( $plugin_files ) ) {
			return $wp_plugins;
		}

		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		foreach ( $plugin_files as $plugin_file ) {
			if ( ! is_readable( "$plugin_root/$plugin_file" ) ) {
				continue;
			}

			// Do not apply markup/translate as it will be cached.
			$plugin_data = get_plugin_data( "$plugin_root/$plugin_file", false, false );

			if ( empty( $plugin_data['Name'] ) ) {
				continue;
			}

			$wp_plugins[ plugin_basename( $plugin_file ) ] = $plugin_data;
		}

		uasort( $wp_plugins, '_sort_uname_callback' );

		$cache_plugins[ $plugin_folder ] = $wp_plugins;
		wp_cache_set( 'monorepo_plugins', $cache_plugins, 'monorepo_plugins' ); // Updated cache values to not conflict.

		return $wp_plugins;
	}

	/**
	 * Returns an array of monorepo plugins.
	 *
	 * @return array Array of monorepo plugins.
	 */
	public function plugins() {
		return array_keys( $this->get_plugins( $this->plugins ) );
	}
}
