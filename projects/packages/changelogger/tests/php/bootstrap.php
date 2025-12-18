<?php
/**
 * Bootstrap file for the changelogger test suite.
 *
 * @package automattic/jetpack-changelogger
 */

// Include the Composer autoloader.
require_once __DIR__ . '/../../vendor/autoload.php';

// Suppress PHP 8.5 deprecation warnings from wikimedia/testing-access-wrapper.
// See here: https://phabricator.wikimedia.org/T406744
// @todo: Remove this when a new version is released with the fix.
if ( PHP_VERSION_ID >= 80500 ) {
	set_error_handler(
		function ( $errno, $errstr, $errfile = '' ) {
			return E_DEPRECATED === $errno
				&& str_contains( $errstr, 'setAccessible() is deprecated' ) // phpcs:ignore PHPCompatibility.FunctionUse.NewFunctions.str_containsFound -- this is a PHP 7.4+ function in a PHP 8.5+ block
				&& str_ends_with( $errfile, 'vendor/wikimedia/testing-access-wrapper/src/TestingAccessWrapper.php' ); // phpcs:ignore PHPCompatibility.FunctionUse.NewFunctions.str_ends_withFound -- this is a PHP 7.4+ function in a PHP 8.5+ block
		},
		E_ALL
	);
}
