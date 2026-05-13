<?php
/**
 * Bootstrap.
 *
 * @package automattic/jetpack-external-media
 */

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

// Initialize WordPress test environment so REST and post-type registration
// helpers are available to abilities tests.
\Automattic\Jetpack\Test_Environment::init();
