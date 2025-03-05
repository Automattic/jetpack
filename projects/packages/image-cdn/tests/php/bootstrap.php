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

// Initialize WordPress test environment
\Automattic\Jetpack\Test_Environment::init( 'packages-image-cdn' );

/**
 * Load helper base class
 */
require_once __DIR__ . '/class-image-cdn-attachment-testcase.php';
