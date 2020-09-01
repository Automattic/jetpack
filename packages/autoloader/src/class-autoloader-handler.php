<?php
/* HEADER */ // phpcs:ignore

/**
 * This class selects the package version for the autoloader.
 */
class Autoloader_Handler {

	// The name of the autoloader function registered by v1.* autoloaders.
	const V1_AUTOLOADER_NAME = 'Automattic\Jetpack\Autoloader\autoloader';

	/*
	 * The autoloader function for v2.* autoloaders is named __NAMESPACE__ . \autoloader.
	 * The namespace is defined in AutoloadGenerator as
	 * 'Automattic\Jetpack\Autoloader\jp' plus a unique suffix.
	 */
	const V2_AUTOLOADER_BASE = 'Automattic\Jetpack\Autoloader\jp';

	/**
	 * The current plugin path.
	 *
	 * @var string
	 */
	private $current_plugin_path;

	/**
	 * The paths for all of the active plugins.
	 *
	 * @var array
	 */
	private $active_plugin_paths;

	/**
	 * The Autoloader_Locator object.
	 *
	 * @var Autoloader_Locator
	 */
	private $autoloader_locator;

	/**
	 * The Version_Selector object.
	 *
	 * @var Version_Selector
	 */
	private $version_selector;

	/**
	 * The constructor.
	 *
	 * @param string             $current_plugin_path The current plugin path.
	 * @param array              $active_plugin_paths The active plugin paths.
	 * @param Autoloader_Locator $autoloader_locator The Autoloader_Locator object.
	 * @param Version_Selector   $version_selector The Version_Selector object.
	 */
	public function __construct( $current_plugin_path, $active_plugin_paths, $autoloader_locator, $version_selector ) {
		$this->current_plugin_path = $current_plugin_path;
		$this->active_plugin_paths = $active_plugin_paths;
		$this->autoloader_locator  = $autoloader_locator;
		$this->version_selector    = $version_selector;
	}

	/**
	 * Finds the latest installed autoloader.
	 *
	 * @return bool True if this autoloader is the latest, false otherwise.
	 */
	public function is_latest_autoloader() {
		global $jetpack_autoloader_latest_version;

		if ( isset( $jetpack_autoloader_latest_version ) ) {
			return $jetpack_autoloader_latest_version === $this->autoloader_locator->get_autoloader_version( $this->current_plugin_path );
		}

		$latest_plugin = $this->autoloader_locator->find_latest_autoloader( $this->active_plugin_paths, $jetpack_autoloader_latest_version );
		if ( ! isset( $latest_plugin ) ) {
			return true;
		}

		if ( $latest_plugin !== $this->current_plugin_path ) {
			require $this->autoloader_locator->get_autoloader_path( $latest_plugin );
			return false;
		}

		return true;
	}

	/**
	 * Checks whether the autoloader should be reset. The autoloader should be reset
	 * when a plugin is activating via a method other than a request, for example
	 * using WP-CLI. When this occurs, the activating plugin was not known when
	 * the autoloader selected the package versions for the classmap and filemap
	 * globals, so the autoloader must reselect the versions.
	 *
	 * If the current plugin is not already known, this method will add it to the
	 * $jetpack_autoloader_activating_plugins_paths global.
	 *
	 * @return boolean True if the autoloder must be reset, else false.
	 */
	public function should_autoloader_reset() {
		global $jetpack_autoloader_activating_plugins_paths;
		if ( ! isset( $jetpack_autoloader_activating_plugins_paths ) ) {
			$jetpack_autoloader_activating_plugins_paths = array();
		}

		$plugin_unknown = ! in_array( $this->current_plugin_path, $this->active_plugin_paths, true );
		if ( $plugin_unknown ) {
			// If the current plugin isn't known, add it to the activating plugins list.
			$jetpack_autoloader_activating_plugins_paths[] = $this->current_plugin_path;
			$this->active_plugin_paths[]                   = $this->current_plugin_path;
		}

		return $plugin_unknown;
	}

	/**
	 * Builds the Version_Autoloader class that is used for autoloading.
	 *
	 * @return Version_Loader
	 */
	public function build_autoloader() {
		require_once __DIR__ . '/class-manifest-handler.php';
		require_once __DIR__ . '/class-version-loader.php';

		$manifest_handler = new Manifest_Handler( $this->active_plugin_paths, $this->version_selector );

		global $jetpack_packages_psr4;
		$manifest_handler->register_plugin_manifests(
			'vendor/composer/jetpack_autoload_psr4.php',
			$jetpack_packages_psr4
		);

		global $jetpack_packages_classmap;
		$manifest_handler->register_plugin_manifests(
			'vendor/composer/jetpack_autoload_classmap.php',
			$jetpack_packages_classmap
		);

		global $jetpack_packages_filemap;
		$manifest_handler->register_plugin_manifests(
			'vendor/composer/jetpack_autoload_filemap.php',
			$jetpack_packages_filemap
		);

		// Store the generated autoloader data in the loader so we can use it.
		$loader = new Version_Loader( $this->version_selector );
		$loader->set_class_map( $jetpack_packages_classmap );
		$loader->set_psr4( $jetpack_packages_psr4 );

		// Include the latest versions of all the autoload files.
		if ( isset( $jetpack_packages_filemap ) ) {
			foreach ( $jetpack_packages_filemap as $file_identifier => $file_data ) {
				if ( empty( $GLOBALS['__composer_autoload_files'][ $file_identifier ] ) ) {
					require_once $file_data['path'];

					$GLOBALS['__composer_autoload_files'][ $file_identifier ] = true;
				}
			}
		}

		return $loader;
	}

	/**
	 * Updates the spl autoloader chain:
	 *  - Registers this namespace's autoloader function.
	 *  - If a v1 autoloader function is registered, moves it to the end of the chain.
	 *  - Removes any other v2 autoloader functions that have already been registered. This
	 *    can occur when the autoloader is being reset by an activating plugin.
	 */
	public function update_autoloader_chain() {
		spl_autoload_register( __NAMESPACE__ . '\autoloader' );

		$autoload_chain = spl_autoload_functions();

		foreach ( $autoload_chain as $autoloader ) {
			if ( ! is_string( $autoloader ) ) {
				/*
				 * The Jetpack Autoloader functions are registered as strings, so
				 * just continue if $autoloader isn't a string.
				 */
				continue;
			}

			if ( self::V1_AUTOLOADER_NAME === $autoloader ) {
				// Move the v1.* autoloader function to the end of the spl autoloader chain.
				spl_autoload_unregister( $autoloader );
				spl_autoload_register( $autoloader );

			} elseif (
				self::V2_AUTOLOADER_BASE === substr( $autoloader, 0, strlen( self::V2_AUTOLOADER_BASE ) )
				&& __NAMESPACE__ !== substr( $autoloader, 0, strlen( __NAMESPACE__ ) )
			) {
				// Unregister any other v2.* autoloader functions if they're in the chain.
				spl_autoload_unregister( $autoloader );
			}
		}
	}
}
