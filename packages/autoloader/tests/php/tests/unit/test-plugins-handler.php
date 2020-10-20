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
	public function test_finds_current_plugin() {
		$current = $this->plugins_handler->find_current_plugin();

		// Since we're not in our normal directory structure, just make sure it escapes 3 levels from the plugin's `src` folder.
		$this->assertEquals( dirname( TEST_PACKAGE_PATH ), $current );
	}

	/**
	 * Tests that all plugins are found.
	 */
	public function test_finds_all_plugins() {
		global $jetpack_autoloader_activating_plugins_paths;
		$jetpack_autoloader_activating_plugins_paths = array( TEST_DATA_PATH . '/plugins/plugin_activating' );
		$this->plugin_locator->method( 'find_using_option' )
			->with( 'active_plugins', false )
			->willReturn( array( TEST_DATA_PATH . '/plugins/plugin_current' ) );
		$this->plugin_locator->method( 'find_activating_this_request' )
			->willReturn( array( TEST_DATA_PATH . '/plugins/plugin_dev' ) );
		$this->cache_handler->method( 'read_from_cache' )
			->with( Plugins_Handler::CACHE_KEY )
			->willReturn( array( TEST_DATA_PATH . '/plugins/plugin_newer' ) );

		$plugin_paths = $this->plugins_handler->find_all_plugins( false );

		$this->assertEquals(
			array(
				TEST_DATA_PATH . '/plugins/plugin_activating',
				TEST_DATA_PATH . '/plugins/plugin_current',
				TEST_DATA_PATH . '/plugins/plugin_dev',
			),
			$plugin_paths
		);

		$plugin_paths = $this->plugins_handler->find_all_plugins( true );

		$this->assertEquals(
			array(
				TEST_DATA_PATH . '/plugins/plugin_activating',
				TEST_DATA_PATH . '/plugins/plugin_current',
				TEST_DATA_PATH . '/plugins/plugin_dev',
				TEST_DATA_PATH . '/plugins/plugin_newer',
			),
			$plugin_paths
		);
	}

	/**
	 * Tests that all plugins are found when the site is multisite.
	 */
	public function test_finds_all_plugins_when_multisite() {
		set_test_is_multisite( true );

		global $jetpack_autoloader_activating_plugins_paths;
		$jetpack_autoloader_activating_plugins_paths = array( TEST_DATA_PATH . '/plugins/plugin_activating' );
		$this->plugin_locator->method( 'find_using_option' )
			->withConsecutive(
				array( 'active_plugins', false ),
				array( 'active_sitewide_plugins', true )
			)
			->willReturnOnConsecutiveCalls(
				array( TEST_DATA_PATH . '/plugins/plugin_current' ),
				array( TEST_DATA_PATH . '/plugins/plugin_newer' )
			);
		$this->plugin_locator->method( 'find_activating_this_request' )
			->willReturn( array( TEST_DATA_PATH . '/plugins/plugin_dev' ) );

		$plugin_paths = $this->plugins_handler->find_all_plugins( false );

		$this->assertEquals(
			array(
				TEST_DATA_PATH . '/plugins/plugin_activating',
				TEST_DATA_PATH . '/plugins/plugin_current',
				TEST_DATA_PATH . '/plugins/plugin_newer',
				TEST_DATA_PATH . '/plugins/plugin_dev',
			),
			$plugin_paths
		);
	}
}
