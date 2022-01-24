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

/**
 * Load WorDBless
 */
\WorDBless\Load::load();

/**
 * Include the test data for the Test_Data_Settings tests.
 */
require_once __DIR__ . '/data-test-data-settings.php';
