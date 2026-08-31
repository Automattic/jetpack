<?php
/**
 * Initialize the testing environment.
 *
 * @package automattic/jetpack-backup
 */

/**
 * Load the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

define( 'WP_DEBUG', true );

// PHPUnit's process-isolated children start with an empty SCRIPT_FILENAME (piped via stdin),
// which wp_guess_url() feeds to strpos() and errors on PHP 7.x — give it a real path outside ABSPATH.
if ( empty( $_SERVER['SCRIPT_FILENAME'] ) ) {
	$_SERVER['SCRIPT_FILENAME'] = __FILE__;
}

// Initialize WordPress test environment
\Automattic\Jetpack\Test_Environment::init();
