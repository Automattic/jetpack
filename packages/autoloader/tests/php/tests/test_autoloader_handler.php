<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Autoloader handler test suite.
 *
 * @package automattic/jetpack-autoloader
 */

use PHPUnit\Framework\TestCase;

/**
 * Test suite class for the Autoloader handler.
 */
class WP_Test_Autoloader_Handler extends TestCase {

	/**
	 * Tests that the latest autoloader can be recognized as the current.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	public function test_is_latest_autoloader_does_nothing_if_this_is_it() {
		$autoloader_handler = new Autoloader_Handler(
			TEST_DATA_PATH . '/plugins/plugin_current',
			array( TEST_DATA_PATH . '/plugins/plugin_current' ),
			new Autoloader_Locator( new Version_Selector() ),
			new Version_Selector()
		);

		$this->assertTrue( $autoloader_handler->is_latest_autoloader() );

		global $jetpack_autoloader_latest_version;
		$this->assertEquals( '2.0.0.0', $jetpack_autoloader_latest_version );
	}

	/**
	 * Tests that the latest autoloader will be required if not this.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	public function test_is_latest_autoloader_requires_latest_if_this_is_not_it() {
		$autoloader_handler = new Autoloader_Handler(
			TEST_DATA_PATH . '/plugins/plugin_current',
			array(
				TEST_DATA_PATH . '/plugins/plugin_current',
				TEST_DATA_PATH . '/plugins/plugin_newer',
			),
			new Autoloader_Locator( new Version_Selector() ),
			new Version_Selector()
		);

		$this->assertFalse( $autoloader_handler->is_latest_autoloader() );

		global $jetpack_autoloader_latest_version;
		$this->assertEquals( '2.2.0.0', $jetpack_autoloader_latest_version );
		$this->assertContains( TEST_DATA_PATH . '/plugins/plugin_newer/vendor/autoload_packages.php', get_included_files() );
	}

	/**
	 * Tests should_autoloader_reset() with an already active plugin.
	 */
	public function test_should_autoloader_reset_known_plugin() {
		global $jetpack_autoloader_activating_plugins_paths;

		$autoloader_handler = new Autoloader_Handler(
			TEST_DATA_PATH . '/plugins/plugin_current',
			array( TEST_DATA_PATH . '/plugins/plugin_current' ),
			new Autoloader_Locator( new Version_Selector() ),
			new Version_Selector()
		);

		$this->assertFalse( $autoloader_handler->should_autoloader_reset() );
		$this->assertEmpty( $jetpack_autoloader_activating_plugins_paths );
	}

	/**
	 * Tests should_autoloader_reset() with an activating, unknown plugin.
	 */
	public function test_should_autoloader_reset_unknown_plugin() {
		global $jetpack_autoloader_activating_plugins_paths;

		$autoloader_handler = new Autoloader_Handler(
			TEST_DATA_PATH . '/plugins/plugin_current',
			array(),
			new Autoloader_Locator( new Version_Selector() ),
			new Version_Selector()
		);

		$this->assertTrue( $autoloader_handler->should_autoloader_reset() );
		$this->assertCount( 1, $jetpack_autoloader_activating_plugins_paths );
		$this->assertEquals( TEST_DATA_PATH . '/plugins/plugin_current', $jetpack_autoloader_activating_plugins_paths[0] );
	}

	/**
	 * Tests that the handler is able to build a loader.
	 */
	public function test_builds_autoloader() {
		$autoloader_handler = new Autoloader_Handler(
			TEST_DATA_PATH . '/plugins/plugin_current',
			array( TEST_DATA_PATH . '/plugins/plugin_current' ),
			new Autoloader_Locator( new Version_Selector() ),
			new Version_Selector()
		);

		$loader = $autoloader_handler->build_autoloader();

		$file = $loader->find_class_file( \Automattic\Jetpack\Autoloader\AutoloadGenerator::class );

		$this->assertFileExists( $file );
		$this->assertContains( 'AutoloadGenerator.php', $file );
	}
}
