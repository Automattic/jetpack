<?php
/**
 * Initialize the testing environment.
 *
 * @package automattic/jetpack-publicize
 */

/**
 * Load the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

define( 'WP_DEBUG', true );

// Process-isolated tests start without one, and wp_guess_url() warns on PHP 7.4.
if ( empty( $_SERVER['SCRIPT_FILENAME'] ) ) {
	$_SERVER['SCRIPT_FILENAME'] = __FILE__;
}

// Initialize WordPress test environment
\Automattic\Jetpack\Test_Environment::init( 'packages-publicize' );
