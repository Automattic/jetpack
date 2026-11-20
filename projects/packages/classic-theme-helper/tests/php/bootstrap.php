<?php
/**
 * Bootstrap.
 *
 * @package automattic/jetpack-classic-theme-helper
 */

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

// Initialize WordPress test environment.
\Automattic\Jetpack\Test_Environment::init( 'packages-classic-theme-helper' );
