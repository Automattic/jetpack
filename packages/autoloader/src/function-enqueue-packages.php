<?php
/**
 * The file that contains a function that runs on autoloader being loaded.
 *
 * @package automattic/jetpack-autoloader
 */

namespace Automattic\Jetpack\Autoloader;

$class_map = require_once $vendorPath . '/composer/autoload_classmap_package.php'; // phpcs:ignore
foreach ( $class_map as $class_name => $class_info ) {
	enqueue_package_class( $class_name, $class_info['version'], $class_info['path'] );
}

$autoload_file = $vendorPath . '/composer/autoload_files_package.php'; // phpcs:ignore

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
