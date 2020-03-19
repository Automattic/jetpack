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
			require_once $file_data['path'];

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
	$active_plugins = get_active_plugins();
	$paths          = array_map( __NAMESPACE__ . '\create_map_path_array', $active_plugins );

	foreach ( $paths as $path ) {
		if ( is_readable( $path['class'] ) ) {
			$class_map = require $path['class'];

			if ( is_array( $class_map ) ) {
				foreach ( $class_map as $class_name => $class_info ) {
					enqueue_package_class( $class_name, $class_info['version'], $class_info['path'] );
				}
			}
		}

		if ( is_readable( $path['file'] ) ) {
			$file_map = require $path['file'];

			if ( is_array( $file_map ) ) {
				foreach ( $file_map as $file_identifier => $file_data ) {
					enqueue_package_file( $file_identifier, $file_data['version'], $file_data['path'] );
				}
			}
		}
	}

	file_loader();
}

/**
 * Returns an array containing the active plugins. If plugin is activating, it
 * is included in the array.
 *
 * @return Array An array of plugin names as strings.
 */
function get_active_plugins() {
	$active_plugins = (array) get_option( 'active_plugins', array() );
	$current_plugin = get_current_plugin();

	if ( ! in_array( $current_plugin, $active_plugins, true ) ) {
		// The current plugin isn't active, so it must be activating. Add it to the list.
		$active_plugins[] = $current_plugin;
	}

	// If the activating plugin is not the only activating plugin, we need to add others too.
	$active_plugins = array_merge( $active_plugins, get_activating_plugins() );

	return $active_plugins;
}

/**
 * Creates an array containing the paths to the classmap and filemap for the given plugin.
 * The filenames are the names of the files generated by the Jetpack Autoloader version >2.0.
 *
 * @param String $plugin The plugin string.
 * @return Array An array containing the paths to the plugin's classmap and filemap.
 */
function create_map_path_array( $plugin ) {
	$plugin_path = plugin_dir_path( trailingslashit( WP_PLUGIN_DIR ) . $plugin );

	return array(
		'class' => trailingslashit( $plugin_path ) . 'vendor/composer/jetpack_autoload_classmap.php',
		'file'  => trailingslashit( $plugin_path ) . 'vendor/composer/jetpack_autoload_filemap.php',
	);
}

/**
 * Checks whether the current plugin is active.
 *
 * @return Boolean True if the current plugin is active, else false.
 */
function is_current_plugin_active() {
	$active_plugins = (array) get_option( 'active_plugins', array() );
	$current_plugin = get_current_plugin();

	return in_array( $current_plugin, $active_plugins, true );
}

/**
 * Returns the name of activating plugin if a plugin is activating via a request.
 *
 * @return Array The array of the activating plugins or empty array.
 */
function get_activating_plugins() {

	// phpcs:disable WordPress.Security.NonceVerification.Recommended

	// In case of a single plugin activation there will be a plugin slug.
	if (
		isset( $_REQUEST['action'] )
		&& 'activate' === $_REQUEST['action']
	) {
		$activating_plugin = isset( $_REQUEST['plugin'] ) ? wp_unslash( $_REQUEST['plugin'] ) : null;
		return array( $activating_plugin );
	}

	// In case of bulk activation there will be an array of plugins.
	if (
		isset( $_REQUEST['action'] )
		&& 'activate-selected' === $_REQUEST['action']
	) {
		return ( isset( $_REQUEST['checked'] ) && is_array( $_REQUEST['checked'] ) )
			? array_map( 'wp_unslash', $_REQUEST['checked'] )
			: array();
	}
	// phpcs:enable WordPress.Security.NonceVerification.Recommended

	return array();
}

/**
 * Returns the name of the current plugin.
 *
 * @return String The name of the current plugin.
 */
function get_current_plugin() {
	if ( ! function_exists( 'get_plugins' ) ) {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
	}

	$dir  = explode( '/', plugin_basename( __FILE__ ) )[0];
	$file = array_keys( get_plugins( "/$dir" ) )[0];
	return "$dir/$file";
}

/**
 * Find the latest installed autoloader and set up the classmap and filemap.
 */
function set_up_autoloader() {
	global $latest_autoloader_version;
	global $jetpack_packages_classmap;

	if ( ! is_current_plugin_active() ) {
		// The current plugin is activating, so reset the autoloader.
		$latest_autoloader_version = null;
		$jetpack_packages_classmap = array();
	}

	$classmap_file       = trailingslashit( dirname( __FILE__ ) ) . 'composer/jetpack_autoload_classmap.php';
	$autoloader_packages = require $classmap_file;

	$current_autoloader_version = $autoloader_packages['Automattic\\Jetpack\\Autoloader\\AutoloadGenerator']['version'];
	$current_autoloader_path    = trailingslashit( dirname( __FILE__ ) ) . 'autoload_packages.php';

	// Find the latest autoloader.
	if ( ! $latest_autoloader_version ) {
		$autoloader_version = $current_autoloader_version;
		$autoloader_path    = $current_autoloader_path;
		$current_plugin     = get_current_plugin();

		$active_plugins = get_active_plugins();

		foreach ( $active_plugins as $plugin ) {
			if ( $current_plugin === $plugin ) {
				continue;
			}

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
		if ( $current_autoloader_path !== $autoloader_path ) {
			require $autoloader_path;
		}
	}

	// This is the latest autoloader, so generate the classmap and filemap and register the autoloader function.
	if ( empty( $jetpack_packages_classmap ) && $current_autoloader_version === $latest_autoloader_version ) {
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
