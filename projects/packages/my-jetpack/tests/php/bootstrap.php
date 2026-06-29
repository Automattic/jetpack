<?php
/**
 * Bootstrap.
 *
 * @package automattic/
 */

/**
 * Include the composer autoloader.
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

// REQUEST_URI/HTTP_HOST aren't part of the shared bootstrap pattern, but My Jetpack's
// separate-process tests reach wp_guess_url(), which reads them too -- so seed them as
// well to keep the URL guess quiet and deterministic across the PHP version matrix.
if ( empty( $_SERVER['REQUEST_URI'] ) ) {
	$_SERVER['REQUEST_URI'] = '/';
}

if ( empty( $_SERVER['HTTP_HOST'] ) ) {
	$_SERVER['HTTP_HOST'] = 'example.org';
}

define( 'WP_DEBUG', true );
define( 'JETPACK_ENABLE_MY_JETPACK', true );

// Initialize WordPress test environment
\Automattic\Jetpack\Test_Environment::init();
