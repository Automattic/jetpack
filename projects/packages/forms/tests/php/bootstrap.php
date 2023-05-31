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

\WorDBless\Load::load();

// Some of the legacy test rely on this constant
if ( ! defined( 'JETPACK__VERSION' ) ) {
	define( 'JETPACK__VERSION', '10' );
}
