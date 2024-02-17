<?php
/**
 * Bootstrap.
 *
 * @package automattic/jetpack-crm
 */

/**
 * The root directory of Jetpack CRM.
 */
define( 'JETPACK_CRM_TESTS_ROOT', __DIR__ );

/**
 * Assume we're in tests/php/bootstrap.php.
 */
$_plugin_root = dirname( __DIR__, 2 );

/**
 * Locate WordPress or wordpress-develop. We look in several places.
 */
if ( defined( 'WP_DEV_LOCATION' ) ) {
	$test_root = WP_DEVELOP_DIR;
	if ( file_exists( "$test_root/tests/phpunit/" ) ) {
		$test_root .= '/tests/phpunit/';
	}
} elseif ( false !== getenv( 'WP_DEVELOP_DIR' ) ) {
	// Jetpack Monorepo environment variable defined on command line.
	$test_root = getenv( 'WP_DEVELOP_DIR' );
	if ( file_exists( "$test_root/tests/phpunit/" ) ) {
		$test_root .= '/tests/phpunit/';
	}
} elseif ( file_exists( '../../../../tests/phpunit/includes/bootstrap.php' ) ) {
	// Installed inside wordpress-develop.
	$test_root = '../../../../tests/phpunit';
} elseif ( file_exists( '/vagrant/www/wordpress-develop/public_html/tests/phpunit/includes/bootstrap.php' ) ) {
	// VVV.
	$test_root = '/vagrant/www/wordpress-develop/public_html/tests/phpunit';
} elseif ( file_exists( '/srv/www/wordpress-trunk/public_html/tests/phpunit/includes/bootstrap.php' ) ) {
	// VVV 3.0.
	$test_root = '/srv/www/wordpress-trunk/public_html/tests/phpunit';
} elseif ( file_exists( '/tmp/wordpress-develop/tests/phpunit/includes/bootstrap.php' ) ) {
	// Manual checkout & Jetpack's docker environment.
	$test_root = '/tmp/wordpress-develop/tests/phpunit';
} elseif ( file_exists( '/tmp/wordpress-tests-lib/includes/bootstrap.php' ) ) {
	// Legacy tests.
	$test_root = '/tmp/wordpress-tests-lib';
}

if ( ! isset( $test_root ) || ! file_exists( $test_root . '/includes/bootstrap.php' ) ) {
	fprintf(
		STDERR,
		<<<'EOF'
Failed to automatically locate WordPress or wordpress-develop to run tests.

Set the WP_DEVELOP_DIR environment variable to point to a copy of WordPress
or wordpress-develop.

EOF
	);
	exit( 1 );
}

// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
echo "Using test root $test_root\n";

if ( ! is_readable( $_plugin_root . '/vendor/autoload.php' ) ) {
	echo 'The plugin is not ready for testing.' . PHP_EOL;
	echo PHP_EOL;
	echo 'Composer dependencies must be installed.' . PHP_EOL;
	exit( 1 );
}

/**
 * Give access to tests_add_filter() function.
 */
require $test_root . '/includes/functions.php';

/**
 * Load Jetpack CRM.
 */
function _jpcrm_manually_load_plugin() {
	require_once JETPACK_CRM_TESTS_ROOT . '/../../ZeroBSCRM.php';

	// Run all register_activation_hook() functions.
	global $zbs;
	$zbs->install();
	zeroBSCRM_notifyme_createDBtable();
}

tests_add_filter( 'muplugins_loaded', '_jpcrm_manually_load_plugin' );

/**
 * Start up the WP testing environment.
 */
require $test_root . '/includes/bootstrap.php';

/**
 * Make Jetpack CRM test case available for all tests.
 */
require_once JETPACK_CRM_TESTS_ROOT . '/class-jpcrm-base-test-case.php';
require_once JETPACK_CRM_TESTS_ROOT . '/class-jpcrm-base-integration-test-case.php';

/**
 * Load all feature flags, so they will be testable.
 */
add_filter( 'jetpack_crm_feature_flag_api_v4', '__return_true' );
add_filter( 'jetpack_crm_feature_flag_automations', '__return_true' );
