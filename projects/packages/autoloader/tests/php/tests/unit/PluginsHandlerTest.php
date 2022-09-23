<?php // phpcs:ignore WordPress.Files.FileName

/**
 * Plugins handler test suite.
 *
 * @package automattic/jetpack-autoloader
 */

// We live in the namespace of the test autoloader to avoid many use statements.
namespace Automattic\Jetpack\Autoloader\jpCurrent;

use PHPUnit\Framework\TestCase;

/**
 * Test suite class for the autoloader's plugin handler.
 *
 * @runTestsInSeparateProcesses Ensure that each test has no previously autoloaded files.
 * @preserveGlobalState disabled
 */
class PluginsHandlerTest extends TestCase {
	use \Yoast\PHPUnitPolyfills\Polyfills\AssertIsType;

	/**
	 * A dependency mock for the handler.
	 *
	 * @var Plugin_Locator|\PHPUnit\Framework\MockObject\MockObject
	 */
	private $plugin_locator;

	/**
	 * A dependency mock for the handler.
	 *
	 * @var Path_Processor|\PHPUnit\Framework\MockObject\MockObject
	 */
	private $path_processor;

	/**
	 * The class under test.
	 *
	 * @var Plugins_Handler
	 */
	private $plugins_handler;

	/**
	 * Setup runs before each test.
	 *
	 * @before
	 */
	public function set_up() {
		$this->plugin_locator  = $this->getMockBuilder( Plugin_Locator::class )
			->disableOriginalConstructor()
			->getMock();
		$this->path_processor  = $this->getMockBuilder( Path_Processor::class )
			->disableOriginalConstructor()
			->getMock();
		$this->plugins_handler = new Plugins_Handler( $this->plugin_locator, $this->path_processor );
	}

	/**
	 * Teardown runs after each test.
	 *
	 * @after
	 */
	public function tear_down() {
		cleanup_test_wordpress_data();
	}

	/**
	 * Tests that all active plugins are found.
	 */
	public function test_gets_active_plugins() {
		global $jetpack_autoloader_activating_plugins_paths;
		$jetpack_autoloader_activating_plugins_paths = array( WP_PLUGIN_DIR . '/plugin_activating' );
		$this->plugin_locator->expects( $this->once() )
			->method( 'find_using_option' )
			->with( 'active_plugins', false )
			->willReturn( array( WP_PLUGIN_DIR . '/dummy_current' ) );
		$this->plugin_locator->expects( $this->once() )
			->method( 'find_using_request_action' )
			->with( array( 'activate', 'activate-selected', 'deactivate', 'deactivate-selected' ) )
			->willReturn( array( WP_PLUGIN_DIR . '/dummy_dev' ) );
		$this->plugin_locator->expects( $this->once() )
			->method( 'find_current_plugin' )
			->willReturn( WP_PLUGIN_DIR . '/dummy_newer' );

		$plugin_paths = $this->plugins_handler->get_active_plugins( true, true );

		$this->assertEquals(
			array(
				WP_PLUGIN_DIR . '/plugin_activating',
				WP_PLUGIN_DIR . '/dummy_current',
				WP_PLUGIN_DIR . '/dummy_dev',
				WP_PLUGIN_DIR . '/dummy_newer',
			),
			$plugin_paths
		);
	}

	/**
	 * Tests that all active plugins are found when the site is multisite.
	 */
	public function test_gets_active_plugins_when_multisite() {
		set_test_is_multisite( true );

		global $jetpack_autoloader_activating_plugins_paths;
		$jetpack_autoloader_activating_plugins_paths = array( WP_PLUGIN_DIR . '/plugin_activating' );
		$this->plugin_locator->expects( $this->exactly( 2 ) )
			->method( 'find_using_option' )
			->withConsecutive(
				array( 'active_plugins', false ),
				array( 'active_sitewide_plugins', true )
			)
			->willReturnOnConsecutiveCalls(
				array( WP_PLUGIN_DIR . '/dummy_current' ),
				array( WP_PLUGIN_DIR . '/dummy_newer' )
			);
		$this->plugin_locator->expects( $this->once() )
			->method( 'find_using_request_action' )
			->with( array( 'activate', 'activate-selected', 'deactivate', 'deactivate-selected' ) )
			->willReturn( array( WP_PLUGIN_DIR . '/dummy_dev' ) );
		$this->plugin_locator->expects( $this->once() )
			->method( 'find_current_plugin' )
			->willReturn( WP_PLUGIN_DIR . '' );

		$plugin_paths = $this->plugins_handler->get_active_plugins( true, true );

		$this->assertEquals(
			array(
				WP_PLUGIN_DIR . '/plugin_activating',
				WP_PLUGIN_DIR . '/dummy_current',
				WP_PLUGIN_DIR . '/dummy_newer',
				WP_PLUGIN_DIR . '/dummy_dev',
				WP_PLUGIN_DIR . '',
			),
			$plugin_paths
		);
	}

	/**
	 * Tests that the current plugin is recorded as unknown when it isn't found as an active plugin.
	 */
	public function test_gets_active_plugins_records_unknown_plugins() {
		$this->plugin_locator->expects( $this->once() )
			->method( 'find_using_option' )
			->with( 'active_plugins', false )
			->willReturn( array() );
		$this->plugin_locator->expects( $this->once() )
			->method( 'find_using_request_action' )
			->with( array( 'activate', 'activate-selected', 'deactivate', 'deactivate-selected' ) )
			->willReturn( array() );
		$this->plugin_locator->expects( $this->once() )
			->method( 'find_current_plugin' )
			->willReturn( WP_PLUGIN_DIR . '/dummy_newer' );

		$plugin_paths = $this->plugins_handler->get_active_plugins( true, true );

		$this->assertEquals(
			array(
				WP_PLUGIN_DIR . '/dummy_newer',
			),
			$plugin_paths
		);

		global $jetpack_autoloader_activating_plugins_paths;
		$this->assertContains( WP_PLUGIN_DIR . '/dummy_newer', $jetpack_autoloader_activating_plugins_paths );
	}

	/**
	 * Tests that the current plugin is ignored when it isn't an active plugin but the
	 * autoloader was asked to ignore them.
	 */
	public function test_gets_active_plugins_ignores_unknown_plugins_when_desired() {
		$this->plugin_locator->expects( $this->once() )
			->method( 'find_using_option' )
			->with( 'active_plugins', false )
			->willReturn( array() );
		$this->plugin_locator->expects( $this->once() )
			->method( 'find_using_request_action' )
			->with( array( 'activate', 'activate-selected', 'deactivate', 'deactivate-selected' ) )
			->willReturn( array() );
		$this->plugin_locator->expects( $this->once() )
			->method( 'find_current_plugin' )
			->willReturn( WP_PLUGIN_DIR . '/dummy_newer' );

		$plugin_paths = $this->plugins_handler->get_active_plugins( true, false );

		$this->assertEmpty( $plugin_paths );

		global $jetpack_autoloader_activating_plugins_paths;
		$this->assertEmpty( $jetpack_autoloader_activating_plugins_paths );
	}

	/**
	 * Tests that the active plugin list includes those are deactivating
	 */
	public function test_gets_active_plugins_includes_deactivating() {
		global $jetpack_autoloader_activating_plugins_paths;
		$jetpack_autoloader_activating_plugins_paths = array();
		$this->plugin_locator->expects( $this->once() )
			->method( 'find_using_option' )
			->with( 'active_plugins', false )
			->willReturn( array() );
		$this->plugin_locator->expects( $this->once() )
			->method( 'find_using_request_action' )
			->with( array( 'activate', 'activate-selected', 'deactivate', 'deactivate-selected' ) )
			->willReturn( array( WP_PLUGIN_DIR . '/dummy_newer' ) );
		$this->plugin_locator->expects( $this->once() )
			->method( 'find_current_plugin' )
			->willReturn( WP_PLUGIN_DIR . '/dummy_current' );

		$plugin_paths = $this->plugins_handler->get_active_plugins( true, true );

		$this->assertEquals(
			array(
				WP_PLUGIN_DIR . '/dummy_newer',
				WP_PLUGIN_DIR . '/dummy_current',
			),
			$plugin_paths
		);
	}

	/**
	 * Tests that the active plugin list excludes those that are deactivating.
	 */
	public function test_gets_active_plugins_excludes_deactivating() {
		global $jetpack_autoloader_activating_plugins_paths;
		$jetpack_autoloader_activating_plugins_paths = array();
		$this->plugin_locator->expects( $this->once() )
			->method( 'find_using_option' )
			->with( 'active_plugins', false )
			->willReturn( array( WP_PLUGIN_DIR . '/dummy_newer' ) );
		$this->plugin_locator->expects( $this->exactly( 2 ) )
			->method( 'find_using_request_action' )
			->withConsecutive(
				array( array( 'activate', 'activate-selected', 'deactivate', 'deactivate-selected' ) ),
				array( array( 'deactivate', 'deactivate-selected' ) )
			)
			->willReturnOnConsecutiveCalls(
				array( WP_PLUGIN_DIR . '/dummy_dev' ),
				array(
					WP_PLUGIN_DIR . '/dummy_current',
					WP_PLUGIN_DIR . '/dummy_newer',
					WP_PLUGIN_DIR . '/dummy_dev',
				)
			);
		$this->plugin_locator->expects( $this->once() )
			->method( 'find_current_plugin' )
			->willReturn( WP_PLUGIN_DIR . '/dummy_current' );

		$plugin_paths = $this->plugins_handler->get_active_plugins( false, true );

		$this->assertEmpty( $plugin_paths );
	}

	/**
	 * Tests that the plugins in the cache are loaded.
	 */
	public function test_gets_cached_plugins() {
		set_transient( Plugins_Handler::TRANSIENT_KEY, array( '{{WP_PLUGIN_PATH}}/plugins/dummy_newer' ) );

		$this->path_processor->expects( $this->once() )
			->method( 'untokenize_path_constants' )
			->with( '{{WP_PLUGIN_PATH}}/plugins/dummy_newer' )
			->willReturn( WP_PLUGIN_DIR . '/dummy_newer' );

		$plugin_paths = $this->plugins_handler->get_cached_plugins();

		$this->assertEquals( array( WP_PLUGIN_DIR . '/dummy_newer' ), $plugin_paths );
	}

	/**
	 * Tests that an empty array is returned when the cache contains invalid data.
	 */
	public function test_gets_cached_plugins_handles_invalid_data() {
		set_transient( Plugins_Handler::TRANSIENT_KEY, 'invalid' );

		$this->path_processor->expects( $this->never() )->method( 'untokenize_path_constants' );

		$plugin_paths = $this->plugins_handler->get_cached_plugins();

		$this->assertIsArray( $plugin_paths );
		$this->assertEmpty( $plugin_paths );
	}

	/**
	 * Tests that the plugins are updated when they have changed.
	 */
	public function test_updates_cache_writes_plugins() {
		$this->path_processor->expects( $this->once() )
			->method( 'tokenize_path_constants' )
			->with( WP_PLUGIN_DIR . '/dummy_newer' )
			->willReturn( '{{WP_PLUGIN_PATH}}/plugins/dummy_newer' );

		$this->plugins_handler->cache_plugins( array( WP_PLUGIN_DIR . '/dummy_newer' ) );

		$this->assertEquals( array( '{{WP_PLUGIN_PATH}}/plugins/dummy_newer' ), get_transient( Plugins_Handler::TRANSIENT_KEY ) );
	}

	/**
	 * Tests that the handler indicate whether or not the plugins have changed from the global cached list.
	 */
	public function test_detects_when_plugins_change() {
		global $jetpack_autoloader_cached_plugin_paths;

		$plugins = array();
		$this->assertTrue( $this->plugins_handler->have_plugins_changed( $plugins ) );
		$this->assertSame( $plugins, $jetpack_autoloader_cached_plugin_paths );
		$this->assertFalse( $this->plugins_handler->have_plugins_changed( $plugins ) );

		$plugins = array( WP_PLUGIN_DIR . '/dummy_newer' );
		$this->assertTrue( $this->plugins_handler->have_plugins_changed( $plugins ) );
		$this->assertSame( $plugins, $jetpack_autoloader_cached_plugin_paths );
		$this->assertFalse( $this->plugins_handler->have_plugins_changed( $plugins ) );
	}
}
