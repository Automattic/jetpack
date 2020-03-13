<?php
/**
 * This file `autoload_packages.php`was generated by automattic/jetpack-autoloader.
 *
 * From your plugin include this file with:
 * require_once . plugin_dir_path( __FILE__ ) . '/vendor/autoload_packages.php';
 *
 * @package automattic/jetpack-autoloader
 */

// phpcs:disable PHPCompatibility.LanguageConstructs.NewLanguageConstructs.t_ns_separatorFound
// phpcs:disable PHPCompatibility.Keywords.NewKeywords.t_namespaceFound
// phpcs:disable PHPCompatibility.Keywords.NewKeywords.t_ns_cFound

namespace Automattic\Jetpack\Autoloader; // Will be amended with a suffix in the generated file.

global $jetpack_packages_classes;
global $jetpack_packages_files;

if ( ! is_array( $jetpack_packages_classes ) ) {
	$jetpack_packages_classes = array();
}

if ( ! is_array( $jetpack_packages_files ) ) {
	$jetpack_packages_files = array();
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
	global $jetpack_packages_classes;

	if ( ! isset( $jetpack_packages_classes[ $class_name ] ) ) {
		$jetpack_packages_classes[ $class_name ] = array(
			'version' => $version,
			'path'    => $path,
		);

		return;
	}
	// If we have a @dev version set always use that one!
	if ( 'dev-' === substr( $jetpack_packages_classes[ $class_name ]['version'], 0, 4 ) ) {
		return;
	}

	// Always favour the @dev version. Since that version is the same as bleeding edge.
	// We need to make sure that we don't do this in production!
	if ( 'dev-' === substr( $version, 0, 4 ) ) {
		$jetpack_packages_classes[ $class_name ] = array(
			'version' => $version,
			'path'    => $path,
		);

		return;
	}
	// Set the latest version!
	if ( version_compare( $jetpack_packages_classes[ $class_name ]['version'], $version, '<' ) ) {
		$jetpack_packages_classes[ $class_name ] = array(
			'version' => $version,
			'path'    => $path,
		);
	}
}

/**
 * Adds the version of a package file to the $jetpack_packages_files global array so that
 * we can load the most recent version after 'plugins_loaded'.
 *
 * @param string $file_identifier Unique id to file assigned by composer based on package name and filename.
 * @param string $version Version of the file.
 * @param string $path Absolute path to the file so that we can load it.
 */
function enqueue_package_file( $file_identifier, $version, $path ) {
	global $jetpack_packages_files;

	if ( ! isset( $jetpack_packages_files[ $file_identifier ] ) ) {
		$jetpack_packages_files[ $file_identifier ] = array(
			'version' => $version,
			'path'    => $path,
		);

		return;
	}
	// If we have a @dev version set always use that one!
	if ( 'dev-' === substr( $jetpack_packages_files[ $file_identifier ]['version'], 0, 4 ) ) {
		return;
	}

	// Always favour the @dev version. Since that version is the same as bleeding edge.
	// We need to make sure that we don't do this in production!
	if ( 'dev-' === substr( $version, 0, 4 ) ) {
		$jetpack_packages_files[ $file_identifier ] = array(
			'version' => $version,
			'path'    => $path,
		);

		return;
	}
	// Set the latest version!
	if ( version_compare( $jetpack_packages_files[ $file_identifier ]['version'], $version, '<' ) ) {
		$jetpack_packages_files[ $file_identifier ] = array(
			'version' => $version,
			'path'    => $path,
		);
	}
}

/**
 * Include latest version of all enqueued files. Should be called after all plugins are loaded.
 */
function file_loader() {
	global $jetpack_packages_files;
	foreach ( $jetpack_packages_files as $file_identifier => $file_data ) {
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
	global $jetpack_packages_classes;

	if ( isset( $jetpack_packages_classes[ $class_name ] ) ) {
		if ( file_exists( $jetpack_packages_classes[ $class_name ]['path'] ) ) {
			require_once $jetpack_packages_classes[ $class_name ]['path'];
			return true;
		}
	}

	return false;
}

// Add the jetpack autoloader.
spl_autoload_register( __NAMESPACE__ . '\autoloader' );

/**
 * Used for running the code that initializes class and file maps.
 */
function enqueue_files() {
	$class_map = require dirname( __FILE__ ) . '/composer/jetpack_autoload_classmap.php';

	foreach ( $class_map as $class_name => $class_info ) {
		enqueue_package_class( $class_name, $class_info['version'], $class_info['path'] );
	}

	$autoload_file = dirname( __FILE__ ) . '/composer/jetpack_autoload_filemap.php';

	$include_files = file_exists( $autoload_file ) ? require $autoload_file : array();

	foreach ( $include_files as $file_identifier => $file_data ) {
		enqueue_package_file( $file_identifier, $file_data['version'], $file_data['path'] );
	}

	if (
		function_exists( 'has_action' )
		&& function_exists( 'did_action' )
		&& ! did_action( 'plugins_loaded' )
		&& false === has_action( 'plugins_loaded', __NAMESPACE__ . '\file_loader' )
	) {
		// Add action if it has not been added and has not happened yet.
		// Priority -10 to load files as early as possible in case plugins try to use them during `plugins_loaded`.
		add_action( 'plugins_loaded', __NAMESPACE__ . '\file_loader', 0, -10 );

	} elseif (
		! function_exists( 'did_action' )
		|| did_action( 'plugins_loaded' )
	) {
		file_loader(); // Either WordPress is not loaded or plugin is doing it wrong. Either way we'll load the files so nothing breaks.
	}
}
