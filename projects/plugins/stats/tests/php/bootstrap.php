<?php
/**
 * Bootstrap.
 *
 * @package automattic/jetpack-stats-plugin
 */

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

\Automattic\Jetpack\Test_Environment::init();
require_once __DIR__ . '/../../jetpack-stats.php';
