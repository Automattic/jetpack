<?php
/**
 * Bootstrap.
 *
 * @package automattic/jetpack-send
 */

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

// Initialize WordPress test environment
\Automattic\Jetpack\Test_Environment::init();

require_once __DIR__ . '/Http_Mock.php';
require_once __DIR__ . '/Fake_Provisioner.php';
