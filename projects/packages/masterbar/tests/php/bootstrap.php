<?php
/**
 * Bootstrap.
 *
 * @package automattic/jetpack-masterbar
 */

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/../../vendor/antecedent/patchwork/Patchwork.php';

define( 'WP_DEBUG', true );

// Process-isolated tests need a script filename to avoid wp_guess_url() warnings on PHP 7.4.
if ( empty( $_SERVER['SCRIPT_FILENAME'] ) ) {
	$_SERVER['SCRIPT_FILENAME'] = __FILE__;
}

// Initialize WordPress test environment
\Automattic\Jetpack\Test_Environment::init();

\Automattic\RedefineExit::setup();
