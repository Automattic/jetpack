<?php
/**
 * Bootstrap.
 *
 * @package automattic/jetpack-subscribers-dashboard
 */

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

define( 'WP_DEBUG', true );

// Initialize WordPress test environment
\Automattic\Jetpack\Test_Environment::init();
