<?php
/**
 * Bootstrap.
 *
 * @package automattic/jetpack-protect
 */

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

// Its own uploads folder, since WorDBless empties the shared one after every test in parallel CI runs.
\Automattic\Jetpack\Test_Environment::init( 'packages-protect' );
