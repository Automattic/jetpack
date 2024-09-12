<?php
/**
 * PHPUnit bootstrap file.
 *
 * @package wpcomsh
 */

$_tests_dir = getenv( 'WP_TESTS_DIR' );
$_core_dir  = getenv( 'WP_CORE_DIR' );
$wp_branch  = getenv( 'WP_BRANCH' );

if ( ! $_tests_dir ) {
	if ( $wp_branch ) {
		$_tests_dir = '/tmp/wordpress-' . $wp_branch . '/tests/phpunit';
	} else {
		$_tests_dir = rtrim( sys_get_temp_dir(), '/\\' ) . '/wordpress-tests-lib';
	}
}

if ( ! $_core_dir ) {
	if ( $wp_branch ) {
		$_core_dir = '/tmp/wordpress-' . $wp_branch . '/src';
	} else {
		$_core_dir = rtrim( sys_get_temp_dir(), '/\\' ) . '/wordpress/';
	}
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

/**
 * Manually load the plugin being tested.
 */
function _manually_load_plugin() {
	if ( file_exists( WPMU_PLUGIN_DIR . '/wpcomsh-loader.php' ) ) {
		return;
	}
	require_once dirname( __DIR__ ) . '/wpcomsh.php';
}
tests_add_filter( 'muplugins_loaded', '_manually_load_plugin' );

// Start up the WP testing environment.
require_once $_tests_dir . '/includes/bootstrap.php';
