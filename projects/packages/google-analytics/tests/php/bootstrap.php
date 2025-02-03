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

define( 'WP_DEBUG', true );

// Initialize WordPress test environment
\Automattic\Jetpack\Test_Environment::init();
require_once ABSPATH . WPINC . '/class-IXR.php';
