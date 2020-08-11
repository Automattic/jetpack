<?php
/* HEADER */ // phpcs:ignore

global $jetpack_packages_classmap;
global $jetpack_packages_filemap;
global $jetpack_autoloader_activating_plugins_paths;

if ( ! is_array( $jetpack_packages_classmap ) ) {
	$jetpack_packages_classmap = array();
}

if ( ! is_array( $jetpack_packages_filemap ) ) {
	$jetpack_packages_filemap = array();
}

if ( ! is_array( $jetpack_autoloader_activating_plugins_paths ) ) {
	$jetpack_autoloader_activating_plugins_paths = array();
}

/**
 * Used for autoloading jetpack packages.
 *
 * @param string $class_name Class Name to load.
 *
 * @return Boolean Whether the class_name was found in the classmap.
 */
function autoloader( $class_name ) {
	global $jetpack_packages_classmap;

	if ( isset( $jetpack_packages_classmap[ $class_name ] ) ) {
		require_once $jetpack_packages_classmap[ $class_name ]['path'];
		return true;
	}

	return false;
}

/**
 * Used for running the code that initializes class and file maps.
 *
 * @param Plugins_Handler  $plugins_handler The Plugins_Handler object.
 * @param Version_Selector $version_selector The Version_Selector object.
 */
function enqueue_files( $plugins_handler, $version_selector ) {
	require_once __DIR__ . '/class-manifest-handler.php';

	$manifest_handler = new Manifest_Handler( $plugins_handler, $version_selector );

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

	// Include the latest versions of all the autoload files.
	foreach ( $jetpack_packages_filemap as $file_identifier => $file_data ) {
		if ( empty( $GLOBALS['__composer_autoload_files'][ $file_identifier ] ) ) {
			require_once $file_data['path'];

			$GLOBALS['__composer_autoload_files'][ $file_identifier ] = true;
		}
	}
}

/**
 * Finds the latest installed autoloader. If this is the latest autoloader, sets
 * up the classmap and filemap.
 */
function set_up_autoloader() {
	global $jetpack_autoloader_latest_version;
	global $jetpack_packages_classmap;

	require_once __DIR__ . '/../class-plugins-handler.php';
	require_once __DIR__ . '/../class-version-selector.php';
	require_once __DIR__ . '/../class-autoloader-handler.php';

	$plugins_handler    = new Plugins_Handler();
	$version_selector   = new Version_Selector();
	$autoloader_handler = new Autoloader_Handler( $plugins_handler, $version_selector );

	if ( $plugins_handler->should_autoloader_reset() ) {
		/*
		 * The autoloader must be reset when an activating plugin that was
		 * previously unknown is detected.
		 */
		$jetpack_autoloader_latest_version = null;
		$jetpack_packages_classmap         = array();
	}

	// Find the latest autoloader.
	if ( ! $jetpack_autoloader_latest_version ) {
		$autoloader_handler->find_latest_autoloader();
	}

	$current_autoloader_version = $autoloader_handler->get_current_autoloader_version();

	// This is the latest autoloader, so generate the classmap and filemap and register the autoloader function.
	if ( empty( $jetpack_packages_classmap ) && $current_autoloader_version === $jetpack_autoloader_latest_version ) {
		enqueue_files( $plugins_handler, $version_selector );
		$autoloader_handler->update_autoloader_chain();
	}
}
