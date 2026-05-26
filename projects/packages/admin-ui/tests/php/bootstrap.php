<?php
/**
 * Bootstrap.
 *
 * @package automattic/
 */

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

if ( ! class_exists( 'Jetpack_Options' ) ) {
	require_once __DIR__ . '/../../../connection/legacy/class-jetpack-options.php';
}

if ( ! class_exists( '\Automattic\Jetpack\Connection\Manager' ) ) {
	require_once __DIR__ . '/../../../connection/src/class-manager.php';
}

define( 'WP_DEBUG', true );

// Initialize WordPress test environment
\Automattic\Jetpack\Test_Environment::init();
