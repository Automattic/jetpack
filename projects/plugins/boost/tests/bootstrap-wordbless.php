<?php
/**
 * Bootstrap for tests using WordBless.
 *
 * @package automattic/jetpack-boost
 */

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/../vendor/autoload.php';

// Initialize WordBless test environment.
\Automattic\Jetpack\Test_Environment::init();
