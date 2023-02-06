<?php
/**
 * Initialize the testing environment.
 *
 * @package automattic/jetpack-connection
 */

/**
 * Load the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

// Disable warning about deprecated request library.
// @todo Remove this once we drop support for WordPress 6.1
define( 'REQUESTS_SILENCE_PSR0_DEPRECATIONS', true );

// Work around WordPress bug when `@runInSeparateProcess` is used.
if ( empty( $_SERVER['SCRIPT_FILENAME'] ) ) {
	$_SERVER['SCRIPT_FILENAME'] = __DIR__ . '/vendor/phpunit/phpunit/phpunit';
}

if ( empty( $_SERVER['SCRIPT_NAME'] ) ) {
	$_SERVER['SCRIPT_NAME'] = __DIR__ . '/vendor/phpunit/phpunit/phpunit';
}

if ( empty( $_SERVER['PHP_SELF'] ) ) {
	$_SERVER['PHP_SELF'] = '';
}

define( 'WP_DEBUG', true );

// Preloading the file to reconcile Brain\Monkey with Wordbless.
require_once __DIR__ . '/../../vendor/antecedent/patchwork/Patchwork.php';

\WorDBless\Load::load();
require_once ABSPATH . WPINC . '/class-IXR.php';
