<?php
/**
 * Bootstrap.
 *
 * @package automattic/jetpack-jitm
 */

if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

if ( ! defined( 'MINUTE_IN_SECONDS' ) ) {
	define( 'MINUTE_IN_SECONDS', 60 );
}

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';
