<?php // phpcs:ignore WordPress.Files.FileName

/**
 * Plugins handler test suite.
 *
 * @package automattic/jetpack-autoloader
 */

use PHPUnit\Framework\TestCase;

/**
 * Test suite class for the autoloader's plugin handler.
 *
 * @runClassInSeparateProcess
 * @preserveGlobalState disabled
 */
class Test_Plugins_Handler extends TestCase {

	/**
	 * A dependency mock for the handler.
	 *
	 * @var Plugin_Locator|\PHPUnit\Framework\MockObject\MockObject
	 */
	private $plugin_locator;

	/**
	 * A dependency mock for the handler.
	 *
	 * @var Cache_Handler|\PHPUnit\Framework\MockObject\MockObject
	 */
	private $cache_handler;

	/**
	 * The class under test.
	 *
	 * @var Plugins_Handler
	 */
	private $plugins_handler;

	/**
	 * Setup runs before each test.
	 */
	public function setUp() {
		parent::setUp();

		$this->plugin_locator  = $this->getMockBuilder( Plugin_Locator::class )
			->setMethods(
				array(
					'find_using_option',
					'find_activating_this_request',
				)
			)
			->getMock();
		$this->cache_handler   = $this->getMockBuilder( Cache_Handler::class )
			->setMethods(
				array(
					'read_from_cache',
					'write_to_cache',
				)
			)
			->getMock();
		$this->plugins_handler = new Plugins_Handler( $this->plugin_locator, $this->cache_handler );
	}

	/**
	 * Teardown runs after each test.
	 */
	public function tearDown() {
		parent::tearDown();

		cleanup_test_wordpress_data();
	}

	/**
	 * Tests that the handler is able to find the current plugin.
	 */
	public function test_gets_current_plugin() {
		$current = $this->plugins_handler->get_current_plugin();

		// Since we're not in our normal directory structure, just make sure it escapes 3 levels from the plugin's `src` folder.
		$this->assertEquals( dirname( TEST_PACKAGE_PATH ), $current );
	}

	/**
	 * Tests that the handler is able to get both active and cached plugins together.
	 */
	public function test_gets_all_plugins() {
		$handler = $this->getMockBuilder( Plugins_Handler::class )
			->setMethods(
				array(
					'get_active_plugins',
					'get_cached_plugins',
				)
			)
			->setConstructorArgs( array( $this->plugin_locator, $this->cache_handler ) )
			->getMock();

		$handler->method( 'get_active_plugins' )
			->willReturn( array( TEST_DATA_PATH . '/plugins/plugin_newer' ) );
		$handler->method( 'get_cached_plugins' )
			->willReturn( array( TEST_DATA_PATH . '/plugins/plugin_dev' ) );

		$plugin_paths = $handler->get_all_plugins();

		$this->assertEquals(
			array(
				TEST_DATA_PATH . '/plugins/plugin_newer',
				TEST_DATA_PATH . '/plugins/plugin_dev',
			),
			$plugin_paths
		);
	}

	/**
	 * Tests that all active plugins are found.
	 */
	public function test_gets_active_plugins() {
		global $jetpack_autoloader_activating_plugins_paths;
		$jetpack_autoloader_activating_plugins_paths = array( TEST_DATA_PATH . '/plugins/plugin_activating' );
		$this->plugin_locator->expects( $this->once() )
			->method( 'find_using_option' )
			->with( 'active_plugins', false )
			->willReturn( array( TEST_DATA_PATH . '/plugins/plugin_current' ) );
		$this->plugin_locator->expects( $this->once() )
			->method( 'find_activating_this_request' )
			->willReturn( array( TEST_DATA_PATH . '/plugins/plugin_dev' ) );

		$plugin_paths = $this->plugins_handler->get_active_plugins();

		$this->assertEquals(
			array(
				TEST_DATA_PATH . '/plugins/plugin_activating',
				TEST_DATA_PATH . '/plugins/plugin_current',
				TEST_DATA_PATH . '/plugins/plugin_dev',
			),
			$plugin_paths
		);

		// Subsequent calls should be cached.
		$this->assertSame( $plugin_paths, $this->plugins_handler->get_active_plugins() );
	}

	/**
	 * Tests that all active plugins are found when the site is multisite.
	 */
	public function test_gets_active_plugins_when_multisite() {
		set_test_is_multisite( true );

		global $jetpack_autoloader_activating_plugins_paths;
		$jetpack_autoloader_activating_plugins_paths = array( TEST_DATA_PATH . '/plugins/plugin_activating' );
		$this->plugin_locator->expects( $this->exactly( 2 ) )
			->method( 'find_using_option' )
			->withConsecutive(
				array( 'active_plugins', false ),
				array( 'active_sitewide_plugins', true )
			)
			->willReturnOnConsecutiveCalls(
				array( TEST_DATA_PATH . '/plugins/plugin_current' ),
				array( TEST_DATA_PATH . '/plugins/plugin_newer' )
			);
		$this->plugin_locator->expects( $this->once() )
			->method( 'find_activating_this_request' )
			->willReturn( array( TEST_DATA_PATH . '/plugins/plugin_dev' ) );

		$plugin_paths = $this->plugins_handler->get_active_plugins();

		$this->assertEquals(
			array(
				TEST_DATA_PATH . '/plugins/plugin_activating',
				TEST_DATA_PATH . '/plugins/plugin_current',
				TEST_DATA_PATH . '/plugins/plugin_newer',
				TEST_DATA_PATH . '/plugins/plugin_dev',
			),
			$plugin_paths
		);

		// Subsequent calls should be cached.
		$this->assertSame( $plugin_paths, $this->plugins_handler->get_active_plugins() );
	}

	/**
	 * Tests that the plugins in the cache are loaded.
	 */
	public function test_gets_cached_plugins() {
		$this->cache_handler->expects( $this->once() )
			->method( 'read_from_cache' )
			->with( Plugins_Handler::CACHE_KEY )
			->willReturn( array( TEST_DATA_PATH . '/plugins/plugin_newer' ) );

		$plugin_paths = $this->plugins_handler->get_cached_plugins();

		$this->assertEquals( array( TEST_DATA_PATH . '/plugins/plugin_newer' ), $plugin_paths );

		// Subsequent calls should be cached.
		$this->assertSame( $plugin_paths, $this->plugins_handler->get_cached_plugins() );
	}

	/**
	 * Tests that the plugins are not updated when they haven't changed
	 */
	public function test_updates_cached_plugins_does_nothing_when_identical() {
		$handler = $this->getMockBuilder( Plugins_Handler::class )
			->setMethods(
				array(
					'get_active_plugins',
					'get_cached_plugins',
				)
			)
			->setConstructorArgs( array( $this->plugin_locator, $this->cache_handler ) )
			->getMock();

		$handler->method( 'get_active_plugins' )
			->willReturn( array( TEST_DATA_PATH . '/plugins/plugin_newer' ) );
		$handler->method( 'get_cached_plugins' )
			->willReturn( array( TEST_DATA_PATH . '/plugins/plugin_newer' ) );

		$this->cache_handler->expects( $this->never() )
			->method( 'write_to_cache' );

		$handler->update_plugin_cache();
	}

	/**
	 * Tests that the plugins are updated when they have changed.
	 */
	public function test_updates_cache_writes_plugins() {
		$handler = $this->getMockBuilder( Plugins_Handler::class )
			->setMethods(
				array(
					'get_active_plugins',
					'get_cached_plugins',
				)
			)
			->setConstructorArgs( array( $this->plugin_locator, $this->cache_handler ) )
			->getMock();

		$handler->method( 'get_active_plugins' )
			->willReturn( array( TEST_DATA_PATH . '/plugins/plugin_newer' ) );
		$handler->method( 'get_cached_plugins' )
			->willReturn( array( TEST_DATA_PATH . '/plugins/plugin_dev' ) );

		$this->cache_handler->expects( $this->once() )
			->method( 'write_to_cache' )
			->with( Plugins_Handler::CACHE_KEY, array( TEST_DATA_PATH . '/plugins/plugin_newer' ) );

		$handler->update_plugin_cache();
	}
}
