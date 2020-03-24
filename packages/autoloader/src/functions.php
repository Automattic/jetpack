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
 *
 * @param Plugins_Handler $plugins_handler The Plugins_Handler object.
 */
function enqueue_files( $plugins_handler ) {
	require_once __DIR__ . '/class-classes-handler.php';
	require_once __DIR__ . '/class-files-handler.php';

	$classes_handler = new Classes_Handler( $plugins_handler );
	$classes_handler->set_class_paths();

	$files_handler = new Files_Handler( $plugins_handler );
	$files_handler->set_file_paths();

	$files_handler->file_loader();
}

/**
 * Finds the latest installed autoloader. If this is the latest autoloader, sets
 * up the classmap and filemap.
 */
function set_up_autoloader() {
	global $jetpack_autoloader_latest_version;
	global $jetpack_packages_classmap;

	require_once __DIR__ . '/class-plugins-handler.php';
	require_once __DIR__ . '/class-autoloader-handler.php';

	$plugins_handler    = new Plugins_Handler();
	$autoloader_handler = new Autoloader_Handler( $plugins_handler );

	if ( ! $plugins_handler->is_current_plugin_active() ) {
		// The current plugin is activating, so reset the autoloader.
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
		enqueue_files( $plugins_handler );

		spl_autoload_register( __NAMESPACE__ . '\autoloader' );

		$autoload_chain = spl_autoload_functions();
		if ( in_array( 'Automattic\Jetpack\Autoloader\autoloader', $autoload_chain, true ) ) {
			// Move the old autoloader function to the end of the spl autoloader chaain.
			spl_autoload_unregister( 'Automattic\Jetpack\Autoloader\autoloader' );
			spl_autoload_register( 'Automattic\Jetpack\Autoloader\autoloader' );
		}
	}
}
