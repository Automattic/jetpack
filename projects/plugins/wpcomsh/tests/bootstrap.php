<?php
/**
 * PHPUnit bootstrap file.
 *
 * @package wpcomsh
 */

$_tests_dir = getenv( 'WP_TESTS_DIR' );
$_core_dir  = getenv( 'WP_CORE_DIR' );

if ( ! $_tests_dir ) {
	$_tests_dir = rtrim( sys_get_temp_dir(), '/\\' ) . '/wordpress-tests-lib';
}

if ( ! $_core_dir ) {
	$_core_dir = rtrim( sys_get_temp_dir(), '/\\' ) . '/wordpress/';
}

define( 'IS_ATOMIC', true );
define( 'WPMU_PLUGIN_DIR', "{$_core_dir}wp-content/mu-plugins" );

if ( ! file_exists( $_tests_dir . '/includes/functions.php' ) ) {
	echo "Could not find $_tests_dir/includes/functions.php, have you run bin/install-wp-tests.sh ?" . PHP_EOL; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	exit( 1 );
}

// Include library files.
$lib = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( __DIR__ . '/lib' ) );
foreach ( new RegexIterator( $lib, '/^.*\.php$/', RegexIterator::GET_MATCH ) as $file ) {
	require_once $file[0];
}

// Give access to tests_add_filter() function.
require_once $_tests_dir . '/includes/functions.php';

// Start up the WP testing environment.
require $_tests_dir . '/includes/bootstrap.php';
