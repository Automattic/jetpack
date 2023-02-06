<?php
/**
 * PHPUnit bootstrap file.
 *
 * @package automattic/jetpack
 */

// Assume we're in tests/php/bootstrap.php.
$_plugin_root = dirname( dirname( __DIR__ ) );

// Locate WordPress or wordpress-develop. We look in several places.
if ( false !== getenv( 'WP_DEVELOP_DIR' ) ) {
	// Jetpack Monorepo environment variable.
	$_tests_dir = getenv( 'WP_DEVELOP_DIR' );
	if ( file_exists( "$_tests_dir/tests/phpunit/" ) ) {
		$_tests_dir .= '/tests/phpunit/';
	}
} elseif ( false !== getenv( 'WP_TESTS_DIR' ) ) {
	// WordPress core environment variable.
	$_tests_dir = getenv( 'WP_TESTS_DIR' );
} elseif ( file_exists( dirname( dirname( $_plugin_root ) ) . '/tests/phpunit/includes/bootstrap.php' ) ) {
	// Installed inside wordpress-develop.
	$_tests_dir = dirname( dirname( $_plugin_root ) ) . '/tests/phpunit/includes/bootstrap.php';
} elseif ( file_exists( '/vagrant/www/wordpress-develop/public_html/tests/phpunit/includes/bootstrap.php' ) ) {
	// VVV.
	$_tests_dir = '/vagrant/www/wordpress-develop/public_html/tests/phpunit';
} elseif ( file_exists( '/srv/www/wordpress-trunk/public_html/tests/phpunit/includes/bootstrap.php' ) ) {
	// VVV 3.0.
	$_tests_dir = '/srv/www/wordpress-trunk/public_html/tests/phpunit';
} elseif ( file_exists( '/tmp/wordpress-develop/tests/phpunit/includes/bootstrap.php' ) ) {
	// Manual checkout & Jetpack's docker environment.
	$_tests_dir = '/tmp/wordpress-develop/tests/phpunit';
} elseif ( file_exists( rtrim( sys_get_temp_dir(), '/\\' ) . '/wordpress-tests-lib/includes/bootstrap.php' ) ) {
	// Legacy tests.
	$_tests_dir = rtrim( sys_get_temp_dir(), '/\\' ) . '/wordpress-tests-lib';
}

if ( ! isset( $_tests_dir ) || ! file_exists( $_tests_dir . '/includes/bootstrap.php' ) ) {
	echo 'Failed to automatically locate WordPress or wordpress-develop to run tests.' . PHP_EOL;
	echo PHP_EOL;
	echo 'Set the WP_DEVELOP_DIR environment variable to point to a copy of WordPress' . PHP_EOL;
	echo 'or wordpress-develop.' . PHP_EOL;
	exit( 1 );
}

// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
echo "Using test root $_tests_dir\n";

if ( ! is_readable( $_plugin_root . '/vendor/autoload.php' ) ) {
	echo 'The plugin is not ready for testing.' . PHP_EOL;
	echo PHP_EOL;
	echo 'Composer dependencies must be installed.' . PHP_EOL;
	exit( 1 );
}

// Give access to tests_add_filter() function.
require_once $_tests_dir . '/includes/functions.php';

/**
 * Manually load the plugin being tested.
 */
function _manually_load_plugin() {
	global $_plugin_root;
	require $_plugin_root . '/plugin.php';
}
tests_add_filter( 'muplugins_loaded', '_manually_load_plugin' );

// Start up the WP testing environment.
require $_tests_dir . '/includes/bootstrap.php';

// Load Composer autoloader.
require $_plugin_root . '/vendor/autoload.php';
