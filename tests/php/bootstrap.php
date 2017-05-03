<?php
/**
 * Bootstrap the plugin unit testing environment.
 *
 * Edit 'active_plugins' setting below to point to your main plugin file.
 *
 * @package wordpress-plugin-tests
 */

/**
 * For tests that should be skipped in Jetpack but run in WPCOM (or vice versa), test against this constant.
 *
 *	if ( defined( 'TESTING_IN_JETPACK' ) && TESTING_IN_JETPACK ) {
 *		self::markTestSkipped( 'This test only runs on WPCOM' );
 *	}
 */
define( 'TESTING_IN_JETPACK', true );

// Support for:
// 1. `WP_DEVELOP_DIR` environment variable
// 2. Plugin installed inside of WordPress.org developer checkout
// 3. Tests checked out to /tmp
if( false !== getenv( 'WP_DEVELOP_DIR' ) ) {
	$test_root = getenv( 'WP_DEVELOP_DIR' );
} else if ( file_exists( '../../../../tests/phpunit/includes/bootstrap.php' ) ) {
	$test_root = '../../../../tests/phpunit';
} else if ( file_exists( '/tmp/wordpress-tests-lib/includes/bootstrap.php' ) ) {
	$test_root = '/tmp/wordpress-tests-lib';
}

if ( '1' != getenv( 'WP_MULTISITE' ) &&
 ( defined( 'WP_TESTS_MULTISITE') && ! WP_TESTS_MULTISITE ) ) {
 echo "To run Jetpack multisite, use -c tests/php.multisite.xml" . PHP_EOL;
 echo "Disregard Core's -c tests/phpunit/multisite.xml notice below." . PHP_EOL;
}

if ( '1' != getenv( 'JETPACK_TEST_WOOCOMMERCE' ) ) {
	echo "To run Jetpack woocommerce tests, prefix phpunit with JETPACK_TEST_WOOCOMMERCE=1" . PHP_EOL;
} else {
	define( 'JETPACK_WOOCOMMERCE_INSTALL_DIR', dirname( __FILE__ ) . '/../../../woocommerce' );
}

if ( false === function_exists( 'wp_cache_is_enabled' ) ) {
	/**
	 * "Mocking" function so that it exists and Jetpack_Sync_Actions will load Jetpack_Sync_Module_WP_Super_Cache
	 */
	function wp_cache_is_enabled() {

	}
}

require $test_root . '/includes/functions.php';

// Activates this plugin in WordPress so it can be tested.
function _manually_load_plugin() {
	if ( '1' == getenv( 'JETPACK_TEST_WOOCOMMERCE' ) ) {
		require JETPACK_WOOCOMMERCE_INSTALL_DIR . '/woocommerce.php';
	}
	require dirname( __FILE__ ) . '/../../jetpack.php';
}

function _manually_install_woocommerce() {
	global $wp_version;
	// clean existing install first
	define( 'WP_UNINSTALL_PLUGIN', true );
	define( 'WC_REMOVE_ALL_DATA', true );
	include( JETPACK_WOOCOMMERCE_INSTALL_DIR . '/uninstall.php' );

	WC_Install::install();

	// reload capabilities after install, see https://core.trac.wordpress.org/ticket/28374
	if ( version_compare( $wp_version, '4.7.0' ) >= 0 ) {
		$GLOBALS['wp_roles'] = new WP_Roles();
	} else {
		$GLOBALS['wp_roles']->reinit();
	}
	
	echo "Installing WooCommerce..." . PHP_EOL;
}

// If we are running the uninstall tests don't load jepack.
if ( ! ( in_running_uninstall_group() ) ) {
	tests_add_filter( 'plugins_loaded', '_manually_load_plugin', 1 );
	if ( '1' == getenv( 'JETPACK_TEST_WOOCOMMERCE' ) ) {
		tests_add_filter( 'setup_theme', '_manually_install_woocommerce' );	
	}
}

require $test_root . '/includes/bootstrap.php';

// Load the shortcodes module to test properly.
if ( ! function_exists( 'shortcode_new_to_old_params' ) && ! in_running_uninstall_group() ) {
	require dirname( __FILE__ ) . '/../../modules/shortcodes.php';
}

// Load attachment helper methods.
require dirname( __FILE__ ) . '/attachment_test_case.php';

function in_running_uninstall_group() {
	global  $argv;
	return is_array( $argv ) && in_array( '--group=uninstall', $argv );
}
