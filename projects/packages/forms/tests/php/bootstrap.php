<?php
/**
 * Unit test boosstrap code.
 *
 * @package automattic/jetpack-forms
 */

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

// PHPUnit pipes process-isolated child scripts through stdin, so a child starts with an
// empty SCRIPT_FILENAME. wp_guess_url() derives a needle from it and hands the empty result
// to strpos(), which warns on PHP 7.x and errors every isolated test before it runs. Give it
// what the parent process has: a real path outside ABSPATH.
if ( empty( $_SERVER['SCRIPT_FILENAME'] ) ) {
	$_SERVER['SCRIPT_FILENAME'] = __FILE__;
}

// Initialize WordPress test environment
\Automattic\Jetpack\Test_Environment::init();

// Some of the legacy test rely on this constant
if ( ! defined( 'JETPACK__VERSION' ) ) {
	define( 'JETPACK__VERSION', '10' );
}
