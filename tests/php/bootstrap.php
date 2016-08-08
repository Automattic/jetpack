<?php
/**
 * Bootstrap the plugin unit testing environment.
 *
 * Edit 'active_plugins' setting below to point to your main plugin file.
 *
 * @package wordpress-plugin-tests
 */

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

if ( "1" != getenv( 'WP_MULTISITE' ) &&
 ( defined( 'WP_TESTS_MULTISITE') && ! WP_TESTS_MULTISITE ) ) {
 echo "To run Jetpack multisite, use -c tests/php.multisite.xml" . PHP_EOL;
 echo "Disregard Core's -c tests/phpunit/multisite.xml notice below." . PHP_EOL;
}

require $test_root . '/includes/functions.php';

// Activates this plugin in WordPress so it can be tested.
function _manually_load_plugin() {
	require dirname( __FILE__ ) . '/../../jetpack.php';
}

// If we are running the uninstall tests don't load jepack.
if ( ! ( in_running_uninstall_group() ) ) {
	tests_add_filter( 'plugins_loaded', '_manually_load_plugin' );
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
