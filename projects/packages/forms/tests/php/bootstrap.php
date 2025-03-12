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

// Initialize WordPress test environment
\Automattic\Jetpack\Test_Environment::init();

// Some of the legacy test rely on this constant
if ( ! defined( 'JETPACK__VERSION' ) ) {
	define( 'JETPACK__VERSION', '10' );
}
