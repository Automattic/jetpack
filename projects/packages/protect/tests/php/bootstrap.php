<?php
/**
 * Bootstrap.
 *
 * @package automattic/jetpack-protect
 */

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

// Its own plugins folder, since other projects' tests read the shared one in parallel CI runs while these tests write to it.
define( 'WP_PLUGIN_DIR', dirname( \Automattic\Jetpack\Test_Environment::find_autoloader(), 2 ) . '/wordpress/wp-content/plugins-packages-protect' );
if ( ! is_dir( WP_PLUGIN_DIR ) ) {
	mkdir( WP_PLUGIN_DIR, 0777, true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_mkdir
}

// Its own uploads folder, since WorDBless empties the shared one after every test in parallel CI runs.
\Automattic\Jetpack\Test_Environment::init( 'packages-protect' );

require_once __DIR__ . '/trait-plugin-cache.php';
