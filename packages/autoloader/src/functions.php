<?php
/* HEADER */ // phpcs:ignore

global $jetpack_packages_classmap;
global $jetpack_packages_filemap;

if ( ! is_array( $jetpack_packages_classmap ) ) {
	$jetpack_packages_classmap = array();
}

if ( ! is_array( $jetpack_packages_filemap ) ) {
	$jetpack_packages_filemap = array();
}

/**
 * Adds the version of a package to the $jetpack_packages global array so that
 * the autoloader is able to find it.
 *
 * @param string $class_name Name of the class that you want to autoload.
 * @param string $version Version of the class.
 * @param string $path Absolute path to the class so that we can load it.
 */
function enqueue_package_class( $class_name, $version, $path ) {
	global $jetpack_packages_classmap;

	if ( ! isset( $jetpack_packages_classmap[ $class_name ] ) ) {
		$jetpack_packages_classmap[ $class_name ] = array(
			'version' => $version,
			'path'    => $path,
		);

		return;
	}
	// If we have a @dev version set always use that one!
	if ( 'dev-' === substr( $jetpack_packages_classmap[ $class_name ]['version'], 0, 4 ) ) {
		return;
	}

	// Always favour the @dev version. Since that version is the same as bleeding edge.
	// We need to make sure that we don't do this in production!
	if ( 'dev-' === substr( $version, 0, 4 ) ) {
		$jetpack_packages_classmap[ $class_name ] = array(
			'version' => $version,
			'path'    => $path,
		);

		return;
	}
	// Set the latest version!
	if ( version_compare( $jetpack_packages_classmap[ $class_name ]['version'], $version, '<' ) ) {
		$jetpack_packages_classmap[ $class_name ] = array(
			'version' => $version,
			'path'    => $path,
		);
	}
}

/**
 * Adds the version of a package file to the $jetpack_packages_filemap global array so that
 * we can load the most recent version after 'plugins_loaded'.
 *
 * @param string $file_identifier Unique id to file assigned by composer based on package name and filename.
 * @param string $version Version of the file.
 * @param string $path Absolute path to the file so that we can load it.
 */
function enqueue_package_file( $file_identifier, $version, $path ) {
	global $jetpack_packages_filemap;

	if ( ! isset( $jetpack_packages_filemap[ $file_identifier ] ) ) {
		$jetpack_packages_filemap[ $file_identifier ] = array(
			'version' => $version,
			'path'    => $path,
		);

		return;
	}
	// If we have a @dev version set always use that one!
	if ( 'dev-' === substr( $jetpack_packages_filemap[ $file_identifier ]['version'], 0, 4 ) ) {
		return;
	}

	// Always favour the @dev version. Since that version is the same as bleeding edge.
	// We need to make sure that we don't do this in production!
	if ( 'dev-' === substr( $version, 0, 4 ) ) {
		$jetpack_packages_filemap[ $file_identifier ] = array(
			'version' => $version,
			'path'    => $path,
		);

		return;
	}
	// Set the latest version!
	if ( version_compare( $jetpack_packages_filemap[ $file_identifier ]['version'], $version, '<' ) ) {
		$jetpack_packages_filemap[ $file_identifier ] = array(
			'version' => $version,
			'path'    => $path,
		);
	}
}

/**
 * Include latest version of all enqueued files. Should be called after all plugins are loaded.
 */
function file_loader() {
	global $jetpack_packages_filemap;
	foreach ( $jetpack_packages_filemap as $file_identifier => $file_data ) {
		if ( empty( $GLOBALS['__composer_autoload_files'][ $file_identifier ] ) ) {
			require $file_data['path'];

			$GLOBALS['__composer_autoload_files'][ $file_identifier ] = true;
		}
	}
}

/**
 * Used for autoloading jetpack packages.
 *
 * @param string $class_name Class Name to load.
 */
function autoloader( $class_name ) {
	global $jetpack_packages_classmap;

	if ( isset( $jetpack_packages_classmap[ $class_name ] ) ) {
		if ( file_exists( $jetpack_packages_classmap[ $class_name ]['path'] ) ) {
			require_once $jetpack_packages_classmap[ $class_name ]['path'];
			return true;
		}
	}

	return false;
}

/**
 * Used for running the code that initializes class and file maps.
 */
function enqueue_files() {
	$active_plugins = (array) get_option( 'active_plugins', array() );

	foreach ( $active_plugins as $plugin ) {
		$plugin_path = plugin_dir_path( trailingslashit( WP_PLUGIN_DIR ) . $plugin );

		$classmap_path = trailingslashit( $plugin_path ) . 'vendor/composer/jetpack_autoload_classmap.php';

		if ( is_readable( $classmap_path ) ) {
			$class_map = require $classmap_path;

			if ( is_array( $class_map ) ) {
				foreach ( $class_map as $class_name => $class_info ) {
					enqueue_package_class( $class_name, $class_info['version'], $class_info['path'] );
				}
			}
		}

		$filemap_path = trailingslashit( $plugin_path ) . 'vendor/composer/jetpack_autoload_filemap.php';

		if ( is_readable( $filemap_path ) ) {
			$file_map = require $filemap_path;

			if ( is_array( $file_map ) ) {
				foreach ( $file_map as $file_identifier => $file_data ) {
					enqueue_package_file( $file_identifier, $file_data['version'], $file_data['path'] );
				}
			}
		}
	}

	// TODO: The plugins_loaded action checks aren't necessary anymore.
	if (
		function_exists( 'has_action' )
		&& function_exists( 'did_action' )
		&& ! did_action( 'plugins_loaded' )
		&& false === has_action( 'plugins_loaded', __NAMESPACE__ . '\file_loader' )
	) {
		// Add action if it has not been added and has not happened yet.
		// Priority -10 to load files as early as possible in case plugins try to use them during `plugins_loaded`.
		add_action( 'plugins_loaded', __NAMESPACE__ . '\file_loader', 0, -10 );

	} elseif ( ! function_exists( 'did_action' ) || did_action( 'plugins_loaded' ) ) {
		file_loader(); // Either WordPress is not loaded or plugin is doing it wrong. Either way we'll load the files so nothing breaks.
	}
}

/**
 * Find the latest installed autoloader and set up the classmap and filemap.
 */
function set_up_autoloader() {
	global $latest_autoloader_version;
	global $jetpack_packages_classmap;

	$classmap_file       = trailingslashit( dirname( __FILE__ ) ) . 'composer/jetpack_autoload_classmap.php';
	$autoloader_packages = require $classmap_file;

	$loaded_autoloader_version = $autoloader_packages['Automattic\\Jetpack\\Autoloader\\AutoloadGenerator']['version'];

	$autoloader_version = $loaded_autoloader_version;
	$autoloader_path    = __FILE__;

	// Find the latest autoloader.
	if ( ! $latest_autoloader_version ) {
		$active_plugins = (array) get_option( 'active_plugins', array() );

		foreach ( $active_plugins as $plugin ) {
			$plugin_path   = plugin_dir_path( trailingslashit( WP_PLUGIN_DIR ) . $plugin );
			$classmap_path = trailingslashit( $plugin_path ) . 'vendor/composer/jetpack_autoload_classmap.php';
			if ( file_exists( $classmap_path ) ) {
				$packages = require $classmap_path;

				$current_version = $packages['Automattic\\Jetpack\\Autoloader\\AutoloadGenerator']['version'];

				// TODO: This comparison needs to properly handle dev versions.
				if ( version_compare( $autoloader_version, $current_version, '<' ) ) {
					$autoloader_version = $current_version;
					$autoloader_path    = trailingslashit( $plugin_path ) . 'vendor/autoload_packages.php';
				}
			}
		}

		$latest_autoloader_version = $autoloader_version;
		if ( __FILE__ !== $autoloader_path ) {
			require $autoloader_path;
		}
	}

	// This is the latest autoloader, so generate the classmap and filemap and register the autoloader function.
	if ( empty( $jetpack_packages_classmap ) && $loaded_autoloader_version === $latest_autoloader_version ) {
		enqueue_files();

		spl_autoload_register( __NAMESPACE__ . '\autoloader' );

		$autoload_chain = spl_autoload_functions();
		if ( in_array( 'Automattic\Jetpack\Autoloader\autoloader', $autoload_chain, true ) ) {
			// Move the old autoloader function to the end of the spl autoloader chaain.
			spl_autoload_unregister( 'Automattic\Jetpack\Autoloader\autoloader' );
			spl_autoload_register( 'Automattic\Jetpack\Autoloader\autoloader' );
		}
	}
}
