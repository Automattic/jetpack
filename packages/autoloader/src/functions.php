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

	require_once __DIR__ . '/class-autoloader-container.php';
	$container = new Autoloader_Container();

	$autoloader_handler = $container->get( Autoloader_Handler::class );

	// The autoloader must be reset when a plugin that was previously unknown is detected.
	if ( $autoloader_handler->should_autoloader_reset() ) {
		$container->get( Hook_Manager::class )->reset();
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
	$container->get( Hook_Manager::class )->add_action(
		'shutdown',
		function () use ( $container ) {
			// If this is triggered too early we don't want to save a broken cache.
			if ( ! did_action( 'plugins_loaded' ) ) {
				return;
			}

			$container->get( Plugins_Handler::class )->update_plugin_cache();
		}
	);
}
