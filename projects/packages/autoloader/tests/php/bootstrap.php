<?php
/**
 * Bootstrap file for the autoloader test suite.
 *
 * @package automattic/jetpack-autoloader
 */

// Note: Make sure to normalize the path constants so that the test environment is the same on both Windows.
define( 'TEST_DIR', str_replace( '\\', '/', __DIR__ ) );

// Make sure its easy to reference the test files.
define( 'TEST_PACKAGE_DIR', dirname( dirname( TEST_DIR ) ) );
define( 'TEST_TEMP_DIR', __DIR__ . DIRECTORY_SEPARATOR . 'tmp' );

// phpcs:disable WordPress.PHP.NoSilencedErrors.Discouraged

// We need a bin directory to execute Composer files from.
define( 'TEST_TEMP_BIN_DIR', TEST_TEMP_DIR . DIRECTORY_SEPARATOR . 'bin' );
@mkdir( TEST_TEMP_BIN_DIR, 0777, true );

// Since many of our tests rely on a WordPress directory structure we will simulate it.
define( 'WP_CONTENT_DIR', TEST_TEMP_DIR . DIRECTORY_SEPARATOR . 'wp-content' );
@mkdir( WP_CONTENT_DIR, 0777, true );
define( 'WP_PLUGIN_DIR', WP_CONTENT_DIR . DIRECTORY_SEPARATOR . 'plugins' );
@mkdir( WP_PLUGIN_DIR, 0777, true );
define( 'WPMU_PLUGIN_DIR', WP_CONTENT_DIR . DIRECTORY_SEPARATOR . 'mu-plugins' );
@mkdir( WPMU_PLUGIN_DIR, 0777, true );

// phpcs:enable WordPress.PHP.NoSilencedErrors.Discouraged

// Load all of the test dependencies.
require_once TEST_PACKAGE_DIR . '/vendor/autoload.php';
require_once __DIR__ . '/lib/functions-wordpress.php';
require_once __DIR__ . '/lib/functions.php';
require_once __DIR__ . '/lib/class-test-plugin-factory.php';
require_once __DIR__ . '/lib/class-acceptance-test-case.php';

// As a Composer plugin the autoloader takes the contents of the `src` directory and generates an autoloader specific to each plugin.
// In order to more effectively test the package we need to test it within that context since that is how it will be executed.
// To that end we need to create a plugin that can be used for testing the autoloader.
define( 'TEST_PLUGIN_DIR', Test_Plugin_Factory::create_test_plugin( false, Test_Plugin_Factory::CURRENT )->make() );

// Since we're going to be testing the generated autoloader files we need to
// register an autoloader that can load them.
spl_autoload_register(
	function ( $class ) {
		$namespace = 'Automattic\\Jetpack\\Autoloader\\jpCurrent\\';

		// We're only going to autoload the test autoloader files.
		$check = substr( $class, 0, strlen( $namespace ) );
		if ( $namespace !== $check ) {
			return false;
		}

		// Remove the namespace.
		$class = substr( $class, strlen( $namespace ) );

		// Build a path to the file we're looking for.
		$path = implode(
			DIRECTORY_SEPARATOR,
			array(
				TEST_PLUGIN_DIR,
				'vendor',
				'jetpack-autoloader',
				'class-' . strtolower( str_replace( '_', '-', $class ) ) . '.php',
			)
		);
		if ( ! is_file( $path ) ) {
			return false;
		}

		require_once $path;
		return true;
	}
);

// Now that we've registered the autoloader load any classes that depend on the autoloader.
require_once __DIR__ . '/lib/class-test-container.php';
