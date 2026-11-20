<?php
/**
 * Bootstrap.
 *
 * @package automattic/jetpack-sharing-likes
 */

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

define( 'WP_DEBUG', true );

// Process-isolated children start with an empty SCRIPT_FILENAME, which wp_guess_url() trips on under PHP 7.4.
if ( empty( $_SERVER['SCRIPT_FILENAME'] ) ) {
	$_SERVER['SCRIPT_FILENAME'] = __FILE__;
}

\Automattic\Jetpack\Test_Environment::init();
