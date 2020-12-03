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

define( 'WP_DEBUG', true );

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

\WorDBless\Load::load();
require_once ABSPATH . WPINC . '/class-IXR.php';
