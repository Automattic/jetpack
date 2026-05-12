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

// Initialize the shared WordPress test environment (WorDBless-backed).
\Automattic\Jetpack\Test_Environment::init( 'jetpack-protect' );
