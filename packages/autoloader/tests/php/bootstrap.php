<?php
/**
 * Bootstrap file for the autoloader test suite.
 *
 * @package automattic/jetpack-autoloader
 */

// Make sure its easy to reference the test files.
define( 'TEST_PACKAGE_PATH', dirname( dirname( __DIR__ ) ) );
define( 'TEST_DATA_PATH', __DIR__ . '/data' );

// Give us some fake content/plugin paths to work with.
define( 'WP_CONTENT_DIR', TEST_DATA_PATH );
define( 'WP_PLUGIN_DIR', TEST_DATA_PATH . '/plugins' );
define( 'WPMU_PLUGIN_DIR', TEST_DATA_PATH . '/mu-plugins' );

// Load any of the test utilities.
require_once __DIR__ . '/lib/functions-wordpress.php';

// Load the Composer autoloader for test dependencies.
require_once __DIR__ . '/../../vendor/autoload.php';

// Create a new container to initialize all of the package dependencies.
require_once __DIR__ . '/../../src/class-autoloader.php';
require_once __DIR__ . '/../../src/class-container.php';
require_once __DIR__ . '/lib/class-test-container.php';
$GLOBALS['test_container'] = new Test_Container();


