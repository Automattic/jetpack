<?php // phpcs:ignore WordPress.Files.FileName
/**
 * File loader test suite.
 *
 * @package automattic/jetpack-autoloader
 */

use Jetpack\AutoloaderTestData\Plugin\Test;
use PHPUnit\Framework\TestCase;

/**
 * Test suite class for the Autoloader part that handles file loading.
 */
class WP_Test_Manifest_Handler extends TestCase {

	/**
	 * Tests whether registering a manifest file registers the individual class file.
	 */
	public function test_registering_adds_to_the_input_array() {
		$input_array      = array();
		$manifest_handler = new Manifest_Handler(
			array(
				TEST_DATA_PATH . '/plugins/plugin_current',
			),
			new Version_Selector()
		);

		$manifest_handler->register_plugin_manifests( 'vendor/composer/jetpack_autoload_classmap.php', $input_array );

		$this->assertArrayHasKey( Test::class, $input_array );
		$this->assertEquals( '1.0.0.0', $input_array[ Test::class ]['version'] );
		$this->assertEquals( $input_array[ Test::class ]['path'], TEST_DATA_PATH . '/plugins/plugin_current/includes/class-test.php' );
	}

	/**
	 * Tests whether registering a manifest file will override already registered paths with newer ones.
	 */
	public function test_registering_adds_latest_version_to_the_input_array() {
		$input_array      = array();
		$manifest_handler = new Manifest_Handler(
			array(
				TEST_DATA_PATH . '/plugins/plugin_newer',
				TEST_DATA_PATH . '/plugins/plugin_current',
			),
			new Version_Selector()
		);

		$manifest_handler->register_plugin_manifests( 'vendor/composer/jetpack_autoload_classmap.php', $input_array );

		$this->assertArrayHasKey( Test::class, $input_array );
		$this->assertEquals( '2.0.0.0', $input_array[ Test::class ]['version'] );
		$this->assertEquals( $input_array[ Test::class ]['path'], TEST_DATA_PATH . '/plugins/plugin_newer/includes/class-test.php' );
	}

	/**
	 * Tests whether registering a manifest file ignores the dev version of the file when
	 * JETPACK_AUTOLOAD_DEV is not set.
	 */
	public function test_registering_does_not_add_dev_versions_to_the_input_array() {
		$input_array      = array();
		$manifest_handler = new Manifest_Handler(
			array(
				TEST_DATA_PATH . '/plugins/plugin_dev',
				TEST_DATA_PATH . '/plugins/plugin_current',
			),
			new Version_Selector()
		);

		$manifest_handler->register_plugin_manifests( 'vendor/composer/jetpack_autoload_classmap.php', $input_array );

		$this->assertArrayHasKey( Test::class, $input_array );
		$this->assertEquals( '1.0.0.0', $input_array[ Test::class ]['version'] );
		$this->assertEquals( $input_array[ Test::class ]['path'], TEST_DATA_PATH . '/plugins/plugin_current/includes/class-test.php' );
	}

	/**
	 * Tests whether registering a manifest file prioritizes the dev version of the file when
	 * JETPACK_AUTOLOAD_DEV is set to true.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	public function test_registering_adds_the_dev_version_to_the_input_array_with_constant() {
		$input_array      = array();
		$manifest_handler = new Manifest_Handler(
			array(
				TEST_DATA_PATH . '/plugins/plugin_dev',
				TEST_DATA_PATH . '/plugins/plugin_current',
			),
			new Version_Selector()
		);
		defined( 'JETPACK_AUTOLOAD_DEV' ) || define( 'JETPACK_AUTOLOAD_DEV', true );

		$manifest_handler->register_plugin_manifests( 'vendor/composer/jetpack_autoload_classmap.php', $input_array );

		$this->assertArrayHasKey( Test::class, $input_array );
		$this->assertEquals( 'dev-main', $input_array[ Test::class ]['version'] );
		$this->assertEquals( $input_array[ Test::class ]['path'], TEST_DATA_PATH . '/plugins/plugin_dev/includes/class-test.php' );
	}
}
