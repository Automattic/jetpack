<?php
/**
 * Bootstraps the tests.
 *
 * @package automattic/jetpack-assets
 */

/**
 * Load the composer packages.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

// Suppress PHP 8.5 deprecation warnings from wikimedia/testing-access-wrapper.
// See here: https://phabricator.wikimedia.org/T406744
// @todo: Remove this when a new version is released with the fix.
if ( PHP_VERSION_ID >= 80500 ) {
	set_error_handler(
		function ( $errno, $errstr, $errfile = '' ) {
			return E_DEPRECATED === $errno
				&& str_contains( $errstr, 'setAccessible() is deprecated' )
				&& str_ends_with( $errfile, 'vendor/wikimedia/testing-access-wrapper/src/TestingAccessWrapper.php' );
		},
		E_ALL
	);
}
