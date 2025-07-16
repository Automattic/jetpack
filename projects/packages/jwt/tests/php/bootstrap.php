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

function wp_json_encode( $value, $flags = 0, $depth = 512 ) {
	return json_encode( $value, $flags, $depth );
}
