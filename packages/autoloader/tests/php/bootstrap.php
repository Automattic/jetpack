<?php
/**
 * Bootstrap file for the autoloader test suite.
 *
 * @package automattic/jetpack-autoloader
 */

// Make sure its easy to reference the test files.
define( 'TEST_PACKAGE_PATH', dirname( dirname( __DIR__ ) ) );
define( 'TEST_DATA_PATH', __DIR__ . '/data' );

// Load any of the test utilities.
require_once __DIR__ . '/lib/functions-wordpress.php';

// Load the Composer autoloader for test dependencies.
require_once __DIR__ . '/../../vendor/autoload.php';

// Create a new container to initialize all of the package dependencies.
require_once __DIR__ . '/../../src/class-container.php';
new Container();
