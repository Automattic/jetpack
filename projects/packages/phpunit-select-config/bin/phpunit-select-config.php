<?php
/**
 * A shim to select a config file based on the PHPUnit version installed.
 *
 * @package automattic/phpunit-select-config
 */

// Make sure this script is being run over the PHP CLI.
if ( 'cli' !== php_sapi_name() && 'phpdbg' !== php_sapi_name() ) {
	throw new RuntimeException( 'This file must be run from the command line.' );
}

if ( ! isset( $argv ) || ! is_array( $argv ) ) {
	if ( ! isset( $_SERVER['argv'] ) || ! is_array( $_SERVER['argv'] ) ) {
		throw new RuntimeException( 'Neither $argv nor $_SERVER[\'argv\'] is an array.' );
	}
	// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
	$argv = $_SERVER['argv'];
}

if ( count( $argv ) < 2 ) {
	fprintf( STDERR, "USAGE: %s pattern [args...]\n", $argv[0] );
	fprintf( STDERR, "\n" );
	fprintf( STDERR, "The `pattern` argument should contain a `#` character, which will be replaced\n" );
	fprintf( STDERR, "by the major version of PHPUnit in use.\n" );
	exit( 1 );
}

require_once $GLOBALS['_composer_autoload_path'];

if ( ! class_exists( '\\PHPUnit\\Runner\\Version' ) ) {
	// @phan-suppress-next-line PhanUndeclaredClassMethod -- May as well support super-old phpunit since it's simple to.
	list( $version ) = explode( '.', PHPUnit_Runner_Version::id() ); // @codeCoverageIgnore
} else {
	list( $version ) = explode( '.', \PHPUnit\Runner\Version::id() );
}
array_shift( $argv );
$pattern = array_shift( $argv );
array_unshift( $argv, $GLOBALS['_composer_bin_dir'] . '/phpunit', '--configuration', str_replace( '#', $version, $pattern ) );

// Handle pcov or xdebug being configured on the command line.
foreach ( array( 'pcov', 'xdebug' ) as $ext ) {
	if ( extension_loaded( $ext ) ) {
		foreach ( ini_get_all( $ext, false ) as $k => $v ) {
			array_unshift( $argv, "-d$k=$v" );
		}
	}
}

// Assume phpdbg is being run with -qrr.
if ( 'phpdbg' === php_sapi_name() ) {
	array_unshift( $argv, '-qrr' );
}

pcntl_exec( PHP_BINARY, $argv );
fprintf( STDERR, "Failed to execute %s/phpunit\n", $GLOBALS['_composer_bin_dir'] );
exit( 1 );
