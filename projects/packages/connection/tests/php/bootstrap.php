<?php
/**
 * Initialize the testing environment.
 *
 * @package automattic/jetpack-connection
 */

/**
 * Load the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

// Work around WordPress bug when `@runInSeparateProcess` is used.
if ( empty( $_SERVER['SCRIPT_FILENAME'] ) ) {
	$_SERVER['SCRIPT_FILENAME'] = __DIR__ . '/vendor/phpunit/phpunit/phpunit';
}

if ( empty( $_SERVER['SCRIPT_NAME'] ) ) {
	$_SERVER['SCRIPT_NAME'] = __DIR__ . '/vendor/phpunit/phpunit/phpunit';
}

if ( empty( $_SERVER['PHP_SELF'] ) ) {
	$_SERVER['PHP_SELF'] = '';
}

define( 'WP_DEBUG', true );

// Preloading the file to reconcile Brain\Monkey with Wordbless.
require_once __DIR__ . '/../../vendor/antecedent/patchwork/Patchwork.php';

// Initialize WordPress test environment
\Automattic\Jetpack\Test_Environment::init();
require_once ABSPATH . WPINC . '/class-IXR.php';
