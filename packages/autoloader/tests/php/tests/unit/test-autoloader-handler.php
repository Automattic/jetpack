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
class Test_Autoloader_Handler extends TestCase {

	/**
	 * Tests that the latest autoloader can be recognized as the current.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	public function test_is_latest_autoloader_does_nothing_if_this_is_it() {
		$autoloader_handler = new Autoloader_Handler(
			$this->prepare_handler(
				TEST_DATA_PATH . '/plugins/plugin_current',
				array( TEST_DATA_PATH . '/plugins/plugin_current' )
			),
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
			$this->prepare_handler(
				TEST_DATA_PATH . '/plugins/plugin_current',
				array(
					TEST_DATA_PATH . '/plugins/plugin_current',
					TEST_DATA_PATH . '/plugins/plugin_newer',
				)
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
		global $jetpack_autoloader_cached_plugin_paths;
		$jetpack_autoloader_cached_plugin_paths = array( TEST_DATA_PATH . '/plugins/plugin_current' );

		$autoloader_handler = new Autoloader_Handler(
			$this->prepare_handler(
				TEST_DATA_PATH . '/plugins/plugin_current',
				array( TEST_DATA_PATH . '/plugins/plugin_current' )
			),
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
			$this->prepare_handler( TEST_DATA_PATH . '/plugins/plugin_current' ),
			new Autoloader_Locator( new Version_Selector() ),
			new Version_Selector()
		);

		$this->assertTrue( $autoloader_handler->should_autoloader_reset() );
		$this->assertCount( 1, $jetpack_autoloader_activating_plugins_paths );
		$this->assertEquals( TEST_DATA_PATH . '/plugins/plugin_current', $jetpack_autoloader_activating_plugins_paths[0] );
	}

	/**
	 * Tests should_autoloader_reset() with an old cache set of plugin paths.
	 */
	public function test_should_autoloader_reset_invalid_cache() {
		global $jetpack_autoloader_cached_plugin_paths;
		$jetpack_autoloader_cached_plugin_paths = array();

		$autoloader_handler = new Autoloader_Handler(
			$this->prepare_handler(
				TEST_DATA_PATH . '/plugins/plugin_current',
				array( TEST_DATA_PATH . '/plugins/plugin_current' )
			),
			new Autoloader_Locator( new Version_Selector() ),
			new Version_Selector()
		);

		$this->assertTrue( $autoloader_handler->should_autoloader_reset() );
		$this->assertEquals( array( TEST_DATA_PATH . '/plugins/plugin_current' ), $jetpack_autoloader_cached_plugin_paths );
	}

	/**
	 * Tests that the handler is able to build a loader.
	 */
	public function test_builds_autoloader() {
		$autoloader_handler = new Autoloader_Handler(
			$this->prepare_handler(
				TEST_DATA_PATH . '/plugins/plugin_current',
				array( TEST_DATA_PATH . '/plugins/plugin_current' )
			),
			new Autoloader_Locator( new Version_Selector() ),
			new Version_Selector()
		);

		$loader = $autoloader_handler->build_autoloader();

		$file = $loader->find_class_file( \Automattic\Jetpack\Autoloader\AutoloadGenerator::class );

		$this->assertFileExists( $file );
		$this->assertContains( 'AutoloadGenerator.php', $file );
	}

	/**
	 * Prepares a plugin handler set with the given plugin content.
	 *
	 * @param string $current_plugin The current plugin to return.
	 * @param array  $active_plugins The active plugins to return.
	 * @param array  $cached_plugins The cached plugins to return.
	 *
	 * @return Plugins_Handler|\PHPUnit\Framework\MockObject\MockObject
	 */
	private function prepare_handler( $current_plugin, $active_plugins = array(), $cached_plugins = array() ) {
		$handler = $this->getMockBuilder( Plugins_Handler::class )
			->disableOriginalConstructor()
			->getMock();
		$handler->method( 'get_current_plugin' )->willReturn( $current_plugin );
		$handler->method( 'get_all_plugins' )->willReturn(
			array_values(
				array_unique(
					array_merge( $active_plugins, $cached_plugins )
				)
			)
		);
		$handler->method( 'get_active_plugins' )->willReturn( $active_plugins );
		$handler->method( 'get_cached_plugins' )->willReturn( $cached_plugins );
		return $handler;
	}
}
