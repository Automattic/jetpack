<?php
/**
 * PHP prepend file to suppress PHP 8.4 deprecation warnings from thecodingmachine/safe vendor library.
 *
 * This is run via `php -d auto_prepend_file=...` so that it runs before the Composer autoloader loads
 * thecodingmachine/safe's function files, which trigger deprecations. A bootstrap runs too late.
 *
 * @todo: Remove this when we drop support for PHP <8.0 and we can bump `thecodingmachine/safe` to v2.
 *
 * @package automattic/jetpack-crm
 */

if ( PHP_VERSION_ID >= 80400 ) {
	set_error_handler(
		function ( $errno, $errstr, $errfile = '' ) {
			return E_DEPRECATED === $errno
				&& str_contains( $errstr, 'the explicit nullable type must be used instead' )
				&& str_contains( $errfile, 'crm/vendor/thecodingmachine/safe/' );
		},
		E_ALL
	);
}
