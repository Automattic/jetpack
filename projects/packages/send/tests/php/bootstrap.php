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

// PHPUnit's process-isolated children start with an empty SCRIPT_FILENAME, which wp_guess_url() trips on under PHP 7.4.
if ( empty( $_SERVER['SCRIPT_FILENAME'] ) ) {
	$_SERVER['SCRIPT_FILENAME'] = __FILE__;
}

// Initialize WordPress test environment
\Automattic\Jetpack\Test_Environment::init();

require_once __DIR__ . '/Http_Mock.php';
require_once __DIR__ . '/Fake_Provisioner.php';
require_once __DIR__ . '/Fake_Db.php';
