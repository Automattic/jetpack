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

define( 'WP_DEBUG', true );
define( 'JETPACK_ENABLE_MY_JETPACK', true );

/*
 * Seed request globals before WordPress boots.
 *
 * PHPUnit separate-process tests (#[RunInSeparateProcess] / @preserveGlobalState disabled) start the
 * child with an empty $_SERVER. When WordPress then guesses the site URL, wp_guess_url() in
 * wp-includes/functions.php runs dirname( $_SERVER['SCRIPT_FILENAME'] ) and strpos() against it; on
 * PHP 7.x an empty value raises a "strpos(): Empty needle" warning, which PHPUnit promotes to a test
 * error (only on the PHP 7.x lanes -- PHP 8 allows an empty needle). Provide sane values so the URL
 * guess stays quiet and deterministic across the PHP version matrix.
 */
if ( empty( $_SERVER['SCRIPT_FILENAME'] ) ) {
	$_SERVER['SCRIPT_FILENAME'] = __FILE__;
}
if ( empty( $_SERVER['REQUEST_URI'] ) ) {
	$_SERVER['REQUEST_URI'] = '/';
}
if ( empty( $_SERVER['HTTP_HOST'] ) ) {
	$_SERVER['HTTP_HOST'] = 'example.org';
}

// Initialize WordPress test environment
\Automattic\Jetpack\Test_Environment::init();
