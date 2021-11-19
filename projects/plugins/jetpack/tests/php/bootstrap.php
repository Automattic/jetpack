<?php
/**
 * Bootstrap the plugin unit testing environment.
 *
 * @package automattic/jetpack
 */

// Catch `exit()` and `die()` so they won't make PHPUnit exit.
require __DIR__ . '/redefine-exit.php';

/**
 * For tests that should be skipped in Jetpack but run in WPCOM (or vice versa), test against this constant.
 *
 *	if ( defined( 'TESTING_IN_JETPACK' ) && TESTING_IN_JETPACK ) {
 *		self::markTestSkipped( 'This test only runs on WPCOM' );
 *	}
 */
define( 'TESTING_IN_JETPACK', true );

$test_root = require __DIR__ . '/find-test-root.php';
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

// WordPress until recently required PHPUnit 7.5 or earlier and hacks around a few things to
// make it work with PHP 8. Unfortunately for MockObjects they do it via
// composer.json rather than bootstrap.php, so we have to manually do it here.
// @todo: Remove this once either WP backports their bootstrap changes to 5.8.1 or they release 5.8.2.
if ( version_compare( PHP_VERSION, '8.0', '>=' ) &&
	( ! class_exists( PHPUnit\Runner\Version::class ) || version_compare( PHPUnit\Runner\Version::id(), '9.3', '<' ) )
) {
	if ( ! class_exists( PHPUnit\Framework\MockObject\InvocationMocker::class, false ) &&
		file_exists( "$test_root/includes/phpunit7/MockObject/InvocationMocker.php" )
	) {
		require "$test_root/includes/phpunit7/MockObject/Builder/NamespaceMatch.php";
		require "$test_root/includes/phpunit7/MockObject/Builder/ParametersMatch.php";
		require "$test_root/includes/phpunit7/MockObject/InvocationMocker.php";
		require "$test_root/includes/phpunit7/MockObject/MockMethod.php";
	} else {
		fprintf(
			STDOUT,
			"Warning: PHPUnit <9.3 is not compatible with PHP 8.0+, and the hack could not be loaded.\n  Class %s exists: %s\n  File %s exists: %s\n",
			PHPUnit\Framework\MockObject\InvocationMocker::class,
			class_exists( PHPUnit\Framework\MockObject\InvocationMocker::class, false ) ? 'yes (bad)' : 'no (good)',
			"$test_root/includes/phpunit7/MockObject/InvocationMocker.php",
			file_exists( "$test_root/includes/phpunit7/MockObject/InvocationMocker.php" ) ? 'yes (good)' : 'no (bad)'
		);
	}
}

if ( '1' !== getenv( 'WP_MULTISITE' ) && ( defined( 'WP_TESTS_MULTISITE' ) && ! WP_TESTS_MULTISITE ) ) {
	echo 'To run Jetpack multisite, use -c tests/php.multisite.xml' . PHP_EOL;
	echo "Disregard Core's -c tests/phpunit/multisite.xml notice below." . PHP_EOL;
}

if ( '1' != getenv( 'JETPACK_TEST_WOOCOMMERCE' ) ) {
	echo "To run Jetpack woocommerce tests, prefix phpunit with JETPACK_TEST_WOOCOMMERCE=1" . PHP_EOL;
} else {
	define( 'JETPACK_WOOCOMMERCE_INSTALL_DIR', dirname( __FILE__ ) . '/../../../woocommerce' );
}

require __DIR__ . '/lib/mock-functions.php';
require $test_root . '/includes/functions.php';

// Activates this plugin in WordPress so it can be tested.
function _manually_load_plugin() {
	if ( '1' == getenv( 'JETPACK_TEST_WOOCOMMERCE' ) ) {
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
	include( JETPACK_WOOCOMMERCE_INSTALL_DIR . '/uninstall.php' );

	WC_Install::install();

	// reload capabilities after install, see https://core.trac.wordpress.org/ticket/28374
	$GLOBALS['wp_roles'] = new WP_Roles(); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited

	echo "Installing WooCommerce..." . PHP_EOL;
}

// If we are running the uninstall tests don't load jetpack.
if ( ! ( in_running_uninstall_group() ) ) {
	tests_add_filter( 'plugins_loaded', '_manually_load_plugin', 1 );
	if ( '1' == getenv( 'JETPACK_TEST_WOOCOMMERCE' ) ) {
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

// Load the shortcodes module to test properly.
if ( ! function_exists( 'shortcode_new_to_old_params' ) && ! in_running_uninstall_group() ) {
	require dirname( __FILE__ ) . '/../../modules/shortcodes.php';
}

// Load attachment helper methods.
require dirname( __FILE__ ) . '/attachment_test_case.php';

// Load WPCOM-shared helper functions.
require dirname( __FILE__ ) . '/lib/wpcom-helper-functions.php';

// Load the Tweetstorm Requests override class.
require __DIR__ . '/_inc/lib/class-tweetstorm-requests-transport-override.php';

function in_running_uninstall_group() {
	global  $argv;
	return is_array( $argv ) && in_array( '--group=uninstall', $argv );
}
