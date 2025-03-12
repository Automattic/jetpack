<?php
/**
 * Bootstrap.
 *
 * @package automattic/automattic-for-agencies-client
 */

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

\Automattic\Jetpack\Test_Environment::init();
require_once __DIR__ . '/../../automattic-for-agencies-client.php';
