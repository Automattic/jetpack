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

// The `@automattic/jetpack-test-environment` package is required for this.
// This, and @automattic/jetpack-test-environment in composer.json, can be removed if WordPress is not needed for the unit tests.
if ( class_exists( '\Automattic\Jetpack\Test_Environment' ) ) {
	// Initialize WordPress test environment
	\Automattic\Jetpack\Test_Environment::init();
}
