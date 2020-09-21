<?php
/* HEADER */ // phpcs:ignore

/**
 * Used for autoloading jetpack packages.
 *
 * @param string $class_name Class Name to load.
 *
 * @return Boolean Whether the class_name was found in the classmap.
 */
function autoloader( $class_name ) {
	global $jetpack_autoloader_loader;
	if ( ! isset( $jetpack_autoloader_loader ) ) {
		return false;
	}

	$file = $jetpack_autoloader_loader->find_class_file( $class_name );
	if ( ! isset( $file ) ) {
		return false;
	}

	require_once $file;
	return true;
}

/**
 * Finds the latest installed autoloader. If this is the latest autoloader, sets
 * up the classmap and filemap.
 */
function set_up_autoloader() {
	global $jetpack_autoloader_latest_version;
	global $jetpack_autoloader_loader;

	require_once __DIR__ . '/class-plugins-handler.php';
	require_once __DIR__ . '/class-version-selector.php';
	require_once __DIR__ . '/class-autoloader-locator.php';
	require_once __DIR__ . '/class-autoloader-handler.php';

	$plugins_handler    = new Plugins_Handler();
	$version_selector   = new Version_Selector();
	$autoloader_handler = new Autoloader_Handler(
		$plugins_handler->get_current_plugin_path(),
		$plugins_handler->get_all_active_plugins_paths(),
		new Autoloader_Locator( $version_selector ),
		$version_selector
	);

	// The autoloader must be reset when a plugin that was previously unknown is detected.
	if ( $autoloader_handler->should_autoloader_reset() ) {
		$jetpack_autoloader_latest_version = null;
		$jetpack_autoloader_loader         = null;
	}

	if ( ! $autoloader_handler->is_latest_autoloader() || isset( $jetpack_autoloader_loader ) ) {
		return;
	}

	require_once __DIR__ . '/class-manifest-handler.php';
	require_once __DIR__ . '/class-version-loader.php';

	$jetpack_autoloader_loader = $autoloader_handler->build_autoloader();
	$autoloader_handler->update_autoloader_chain();

	// Now that the autoloader is ready we can load the files in the filemap safely.
	$jetpack_autoloader_loader->load_filemap();
}
