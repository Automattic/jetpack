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
 * Include the test data file the the Test_Data_Settings class.
 */
require_once __DIR__ . '/data-test-data-settings.php';

/**
 * Load WorDBless
 */
\WorDBless\Load::load();
