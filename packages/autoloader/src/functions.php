<?php
/* HEADER */ // phpcs:ignore

/**
 * Used for autoloading jetpack packages.
 *
 * @param string $class_name Class Name to load.
 *
 * @return bool Whether the class_name was found in the classmap.
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
	global $jetpack_autoloader_hooks;

	require_once __DIR__ . '/class-hook-manager.php';
	require_once __DIR__ . '/class-plugin-locator.php';
	require_once __DIR__ . '/class-cache-handler.php';
	require_once __DIR__ . '/class-plugins-handler.php';
	require_once __DIR__ . '/class-version-selector.php';
	require_once __DIR__ . '/class-autoloader-locator.php';
	require_once __DIR__ . '/class-autoloader-handler.php';

	if ( ! isset( $jetpack_autoloader_hooks ) ) {
		$jetpack_autoloader_hooks = new Hook_Manager();
	}

	$plugin_locator     = new Plugin_Locator();
	$cache_handler      = new Cache_Handler();
	$plugins_handler    = new Plugins_Handler( $plugin_locator, $cache_handler );
	$version_selector   = new Version_Selector();
	$autoloader_handler = new Autoloader_Handler(
		$plugins_handler->find_current_plugin(),
		$plugins_handler->find_all_plugins( true ),
		new Autoloader_Locator( $version_selector ),
		$version_selector
	);

	// The autoloader must be reset when a plugin that was previously unknown is detected.
	if ( $autoloader_handler->should_autoloader_reset() ) {
		$jetpack_autoloader_hooks->reset();
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

	// Add a shutdown function to save all of the cached plugin paths.
	$jetpack_autoloader_hooks->add_action(
		'shutdown',
		function () use ( $plugins_handler, $cache_handler ) {
			// If this is triggered too early we don't want to save a broken cache.
			if ( ! did_action( 'plugins_loaded' ) ) {
				return;
			}

			// Only save the plugins that were confirmed to be activated.
			$plugin_paths = $plugins_handler->find_all_plugins( false );
			if ( empty( $plugin_paths ) ) {
				return;
			}

			$cache_handler->write_to_cache( Plugins_Handler::CACHE_KEY, $plugin_paths );
		}
	);
}
