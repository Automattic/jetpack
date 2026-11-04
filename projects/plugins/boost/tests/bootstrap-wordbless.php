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

// Keep uploads separate from parallel WorDBless suites, whose teardown deletes every upload.
\Automattic\Jetpack\Test_Environment::init( 'boost' );
