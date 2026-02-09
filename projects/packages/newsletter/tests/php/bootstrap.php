<?php
/**
 * Bootstrap.
 *
 * @package automattic/jetpack-newsletter
 */

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

define( 'WP_DEBUG', true );

\Automattic\Jetpack\Test_Environment::init();
