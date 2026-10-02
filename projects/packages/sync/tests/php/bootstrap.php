<?php
/**
 * Bootstrap.
 *
 * @package automattic/jetpack-sync
 */

/**
 * Include the Composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

// Work around WordPress bug when `@runInSeparateProcess` is used.
if ( empty( $_SERVER['SCRIPT_FILENAME'] ) ) {
	$_SERVER['SCRIPT_FILENAME'] = __DIR__ . '/vendor/phpunit/phpunit/phpunit';
}

/**
 * Include the test data file the the Test_Data_Settings class.
 */
require_once __DIR__ . '/data-test-data-settings.php';

// Initialize WordPress test environment
\Automattic\Jetpack\Test_Environment::init();
