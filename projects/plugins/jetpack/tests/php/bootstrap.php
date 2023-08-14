<?php
/**
 * Bootstrap the plugin unit testing environment.
 *
 * @package automattic/jetpack
 */

// Catch `exit()` and `die()` so they won't make PHPUnit exit.
require __DIR__ . '/redefine-exit.php';

/*
 * For tests that should be skipped in Jetpack but run in WPCOM (or vice versa), test against this constant.
 *
 *  if ( defined( 'TESTING_IN_JETPACK' ) && TESTING_IN_JETPACK ) {
 *      self::markTestSkipped( 'This test only runs on WPCOM' );
 *  }
 */
define( 'TESTING_IN_JETPACK', true );

// Support for:
// 1. `WP_DEVELOP_DIR` environment variable.
// 2. Plugin installed inside of WordPress.org developer checkout.
// 3. Tests checked out to /tmp.
if ( false !== getenv( 'WP_DEVELOP_DIR' ) ) {
	// Defined on command line.
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

echo "Using test root $test_root\n";

$jp_autoloader = __DIR__ . '/../../vendor/autoload.php';

if ( ! is_readable( $jp_autoloader ) || ! is_readable( __DIR__ . '/../../modules/module-headings.php' ) ) {
	echo 'Jetpack is not ready for testing.' . PHP_EOL;
	echo PHP_EOL;
	echo 'Jetpack must have Composer dependencies installed and be built.' . PHP_EOL;
	echo 'If developing in the Jetpack monorepo, try running: jetpack build plugins/jetpack' . PHP_EOL;
	exit( 1 );
}

require $jp_autoloader;

if ( '1' !== getenv( 'WP_MULTISITE' ) && ( ! defined( 'WP_TESTS_MULTISITE' ) || ! WP_TESTS_MULTISITE ) ) {
	echo 'To run Jetpack multisite, use -c tests/php.multisite.xml' . PHP_EOL;
	echo "Disregard Core's -c tests/phpunit/multisite.xml notice below." . PHP_EOL;
}

if ( '1' !== getenv( 'JETPACK_TEST_WOOCOMMERCE' ) ) {
	echo 'To run Jetpack woocommerce tests, prefix phpunit with JETPACK_TEST_WOOCOMMERCE=1' . PHP_EOL;
} else {
	define( 'JETPACK_WOOCOMMERCE_INSTALL_DIR', __DIR__ . '/../../../woocommerce' );
}

require __DIR__ . '/lib/mock-functions.php';
require $test_root . '/includes/functions.php';

// Activates this plugin in WordPress so it can be tested.
function _manually_load_plugin() {
	if ( '1' === getenv( 'JETPACK_TEST_WOOCOMMERCE' ) ) {
		require JETPACK_WOOCOMMERCE_INSTALL_DIR . '/woocommerce.php';
	}
	require __DIR__ . '/../../jetpack.php';
	$jetpack = Jetpack::init();
	$jetpack->configure();
}

function _manually_install_woocommerce() {
	// clean existing install first
	define( 'WP_UNINSTALL_PLUGIN', true );
	define( 'WC_REMOVE_ALL_DATA', true );
	include JETPACK_WOOCOMMERCE_INSTALL_DIR . '/uninstall.php';

	WC_Install::install();

	// reload capabilities after install, see https://core.trac.wordpress.org/ticket/28374
	$GLOBALS['wp_roles'] = new WP_Roles();

	echo 'Installing WooCommerce...' . PHP_EOL;
}

// If we are running the uninstall tests don't load jetpack.
if ( ! ( in_running_uninstall_group() ) ) {
	tests_add_filter( 'plugins_loaded', '_manually_load_plugin', 1 );
	if ( '1' === getenv( 'JETPACK_TEST_WOOCOMMERCE' ) ) {
		tests_add_filter( 'setup_theme', '_manually_install_woocommerce' );
	}
}

/**
 * As of Jetpack 8.2, we are using Full_Sync_Immediately as the default full sync module.
 * Some unit tests will need to revert to the now legacy Full_Sync module. The unit tests
 * will look for a LEGACY_FULL_SYNC flag to run tests on the legacy module.
 *
 * @param array $modules Sync Modules.
 *
 * @return array
 */
function jetpack_full_sync_immediately_off( $modules ) {
	foreach ( $modules as $key => $module ) {
		if ( in_array( $module, array( 'Automattic\\Jetpack\\Sync\\Modules\\Full_Sync_Immediately' ), true ) ) {
			$modules[ $key ] = 'Automattic\\Jetpack\\Sync\\Modules\\Full_Sync';
		}
	}
	return $modules;
}

if ( '1' === getenv( 'LEGACY_FULL_SYNC' ) ) {
	tests_add_filter( 'jetpack_sync_modules', 'jetpack_full_sync_immediately_off' );
}

require $test_root . '/includes/bootstrap.php';

// Disable warning about deprecated request library.
// @todo Remove this once we drop support for WordPress 6.1
define( 'REQUESTS_SILENCE_PSR0_DEPRECATIONS', true );

// Load the shortcodes module to test properly.
if ( ! function_exists( 'shortcode_new_to_old_params' ) && ! in_running_uninstall_group() ) {
	require __DIR__ . '/../../modules/shortcodes.php';
}

// Load attachment helper methods.
require __DIR__ . '/attachment_test_case.php';

// Load WPCOM-shared helper functions.
require __DIR__ . '/lib/class-wpcom-features.php';

// Load the Tweetstorm Requests override class.
require __DIR__ . '/_inc/lib/class-tweetstorm-requests-transport-override.php';

function in_running_uninstall_group() {
	global  $argv;
	return is_array( $argv ) && in_array( '--group=uninstall', $argv, true );
}
