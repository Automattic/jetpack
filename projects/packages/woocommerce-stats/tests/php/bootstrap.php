<?php
/**
 * Bootstrap.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

require_once __DIR__ . '/../../vendor/autoload.php';

define( 'WP_DEBUG', true );

// PHPUnit runs an isolated test from stdin, and wp_guess_url() warns on PHP 7.4 when the script path is empty.
if ( empty( $_SERVER['SCRIPT_FILENAME'] ) ) {
	$_SERVER['SCRIPT_FILENAME'] = __FILE__;
}

\Automattic\Jetpack\Test_Environment::init();
