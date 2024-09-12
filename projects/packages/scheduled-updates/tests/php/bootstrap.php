<?php
/**
 * Bootstrap.
 *
 * @package automattic/scheduled-updates
 */

// Constants.
const WP_PLUGIN_DIR = __DIR__ . '/data/plugins';
if ( ! file_exists( WP_PLUGIN_DIR ) ) {
	mkdir( WP_PLUGIN_DIR, 0777, true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_mkdir
}

/**
 * Include the composer autoloader and dependencies.
 */
require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/../lib/functions-wordpress.php';

/**
 * Load WorDBless.
 */
\WorDBless\Load::load();

/**
 * Load REST API endpoints.
 */
\Automattic\Jetpack\Scheduled_Updates::load_rest_api_endpoints();
