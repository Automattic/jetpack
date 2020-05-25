<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * The Plugins_HandlerTest class file.
 *
 * @package automattic/jetpack-autoloader
 */

use PHPUnit\Framework\TestCase;

/**
 * Provides unit tests for the methods in the Plugins_Handler class.
 */
class PluginsHandlerTest extends TestCase {

	const DEFAULT_ACTIVE_PLUGINS        = array( 'test1/test1.php', 'test2/test2.php' );
	const DEFAULT_ACTIVE_PLUGIN_DIRS    = array( 'test1', 'test2' );
	const DEFAULT_MULTISITE_PLUGINS     = array(
		'multi1/multi1.php' => 'details',
		'multi2/multi2.php' => 'details',
	);
	const DEFAULT_MULTISITE_PLUGIN_DIRS = array( 'multi1', 'multi2' );

	/**
	 * This method is called before each test.
	 */
	public function setUp() {
		$this->plugins_handler = $this->getMockBuilder( 'Plugins_Handler' )
			->setMethods(
				array(
					'get_current_plugin_dir',
					'get_multisite_plugins',
					'get_active_plugins',
				)
			)
			->getMock();
	}

	/**
	 * Set up mock Plugins_Handler methods.
	 *
	 * @param Array   $active_plugins The names of the active plugins.
	 * @param Boolean $use_multisite Whether the env is multisite.
	 */
	private function set_up_mocks(
		$active_plugins = self::DEFAULT_ACTIVE_PLUGINS,
		$use_multisite = false ) {

		$this->plugins_handler
			->method( 'get_active_plugins' )
			->willReturn( (array) $active_plugins );

		if ( $use_multisite ) {
			$this->plugins_handler
				->method( 'get_multisite_plugins' )
				->willReturn( array_keys( self::DEFAULT_MULTISITE_PLUGINS ) );
		} else {
			$this->plugins_handler
				->method( 'get_multisite_plugins' )
				->willReturn( array() );
		}
	}

	/**
	 * Tests is_directory_plugin() with a single-file plugin.
	 *
	 * @covers Plugins_Handler::is_directory_plugin
	 */
	public function test_is_directory_plugin_single_file() {
		$this->assertFalse( $this->plugins_handler->is_directory_plugin( 'test.php' ) );
	}

	/**
	 * Tests is_directory_plugin() with a single-file plugin that begins with '/'.
	 *
	 * @covers Plugins_Handler::is_directory_plugin
	 */
	public function test_is_directory_plugin_single_file_with_slash() {
		$this->assertFalse( $this->plugins_handler->is_directory_plugin( '/test.php' ) );
	}

	/**
	 * Tests is_directory_plugin() with a plugin with a directory.
	 *
	 * @covers Plugins_Handler::is_directory_plugin
	 */
	public function test_is_directory_plugin_dir() {
		$this->assertTrue( $this->plugins_handler->is_directory_plugin( 'test/test.php' ) );
	}

	/**
	 * Tests should_autoloader_reset() with an already active plugin.
	 *
	 * @covers Plugins_Handler::should_autoloader_reset
	 */
	public function test_should_autoloader_reset_known_plugin() {
		global $jetpack_autoloader_activating_plugins;

		// 'test1/test1.php' is in self::DEFAULT_ACTIVE_PLUGINS.
		$this->plugins_handler
			->method( 'get_current_plugin_dir' )
			->willReturn( 'test1' );

		$this->set_up_mocks();

		$this->assertFalse( $this->plugins_handler->should_autoloader_reset() );
		$this->assertEmpty( $jetpack_autoloader_activating_plugins );
	}

	/**
	 * Tests should_autoloader_reset() with an activating, unknown plugin.
	 *
	 * @covers Plugins_Handler::should_autoloader_reset
	 */
	public function test_should_autoloader_reset_unknown_plugin() {
		global $jetpack_autoloader_activating_plugins;

		$current_plugin = 'unknown';

		// 'unknown' is not in self::DEFAULT_ACTIVE_PLUGINS.
		$this->plugins_handler
			->method( 'get_current_plugin_dir' )
			->willReturn( $current_plugin );

		$this->set_up_mocks();

		$this->assertTrue( $this->plugins_handler->should_autoloader_reset() );
		$this->assertCount( 1, $jetpack_autoloader_activating_plugins );
		$this->assertEquals( $current_plugin, $jetpack_autoloader_activating_plugins[0] );
	}

	/**
	 * Tests get_all_active_plugins() with activating plugins (via request and
	 * non-request methods) and a list of active plugins.
	 *
	 * @covers Plugins_Handler::get_all_active_plugins
	 */
	public function test_get_all_active_plugins_everything() {
		global $jetpack_autoloader_activating_plugins;

		// Activating plugin.
		$activating_plugin                     = 'activating';
		$jetpack_autoloader_activating_plugins = array( $activating_plugin );

		// Plugin activating via a request.
		$request_plugin_dir   = 'request';
		$request_plugin       = $request_plugin_dir . '/request.php';
		$_REQUEST['action']   = 'activate';
		$_REQUEST['plugin']   = $request_plugin;
		$_REQUEST['_wpnonce'] = '123abc';

		// Use default active plugins.
		$this->set_up_mocks();

		$expected_output = array_merge(
			array( $activating_plugin ),
			array( $request_plugin_dir ),
			self::DEFAULT_ACTIVE_PLUGIN_DIRS
		);

		$actual_output = $this->plugins_handler->get_all_active_plugins();

		sort( $actual_output );
		sort( $expected_output );
		$this->assertEquals( $expected_output, $actual_output );
	}

	/**
	 * Tests get_all_active_plugins() with multiple plugins activating (via request and
	 * non-request methods) and a list of active plugins.
	 *
	 * @covers Plugins_Handler::get_all_active_plugins
	 */
	public function test_get_all_active_plugins_multiple_activating() {
		global $jetpack_autoloader_activating_plugins;

		// Activating plugins.
		$activating_plugins = array( 'activating1', 'activating2' );

		$jetpack_autoloader_activating_plugins = $activating_plugins;

		// Plugins activating via a request.
		$request_plugin_dirs = array(
			'request1',
			'request2',
			'request3',
		);

		$request_plugins = array();
		foreach ( $request_plugin_dirs as $request_plugin ) {
			$request_plugins[] = $request_plugin . '/' . $request_plugin . '.php';
		}

		$_REQUEST['action']   = 'activate-selected';
		$_REQUEST['checked']  = $request_plugins;
		$_REQUEST['_wpnonce'] = '123abc';

		// Use default active plugins.
		$this->set_up_mocks();

		$expected_output = array_merge(
			$activating_plugins,
			$request_plugin_dirs,
			self::DEFAULT_ACTIVE_PLUGIN_DIRS
		);

		$actual_output = $this->plugins_handler->get_all_active_plugins();

		sort( $actual_output );
		sort( $expected_output );
		$this->assertEquals( $expected_output, $actual_output );
	}

	/**
	 * Tests get_all_active_plugins() with no nonce included in the request. Since
	 * a nonce isn't included, the plugin will not be activated.
	 *
	 * @covers Plugins_Handler::get_all_active_plugins
	 */
	public function test_get_all_active_plugins_no_nonce() {
		global $jetpack_autoloader_activating_plugins;

		// Activating plugin.
		$activating_plugin                     = 'activating';
		$jetpack_autoloader_activating_plugins = array( $activating_plugin );

		// Plugin activating via a request without a nonce.
		$request_plugin     = 'request/request.php';
		$_REQUEST['action'] = 'activate';
		$_REQUEST['plugin'] = $request_plugin;

		// Use default active plugins.
		$this->set_up_mocks();

		// The plugin activating via a request should not be in the output.
		$expected_output = array_merge(
			array( $activating_plugin ),
			self::DEFAULT_ACTIVE_PLUGIN_DIRS
		);

		$actual_output = $this->plugins_handler->get_all_active_plugins();

		sort( $actual_output );
		sort( $expected_output );
		$this->assertEquals( $expected_output, $actual_output );
	}

	/**
	 * Tests get_all_active_plugins() with no activating plugins.
	 *
	 * @covers Plugins_Handler::get_all_active_plugins
	 */
	public function test_get_all_active_plugins_no_activating() {
		// Plugin deactivating via a request.
		$request_plugin       = 'request/request.php';
		$_REQUEST['action']   = 'deactivate';
		$_REQUEST['plugin']   = $request_plugin;
		$_REQUEST['_wpnonce'] = '123abc';

		// Use default active plugins.
		$this->set_up_mocks();

		$expected_output = self::DEFAULT_ACTIVE_PLUGIN_DIRS;
		$actual_output   = $this->plugins_handler->get_all_active_plugins();

		sort( $actual_output );
		sort( $expected_output );
		$this->assertEquals( $expected_output, $actual_output );
	}


	/**
	 * Tests get_all_active_plugins() with no activating plugins and a single
	 * active plugin.
	 *
	 * @covers Plugins_Handler::get_all_active_plugins
	 */
	public function test_get_all_active_plugins_single_active() {
		$active_plugin_dir = 'test';
		$active_plugin     = array( $active_plugin_dir . '/test.php' );
		$this->set_up_mocks( $active_plugin );

		$expected_output = array( $active_plugin_dir );
		$actual_output   = $this->plugins_handler->get_all_active_plugins();

		sort( $actual_output );
		sort( $expected_output );
		$this->assertEquals( $expected_output, $actual_output );
	}

	/**
	 * Tests get_all_active_plugins() with an active single-file plugin and single-file
	 * plugins skipped.
	 *
	 * @covers Plugins_Handler::get_all_active_plugins
	 */
	public function test_get_all_active_plugins_single_file_plugin() {
		$active_plugin_dir = 'test';
		$active_plugin     = array( $active_plugin_dir . '/test.php' );
		$active_plugins    = array_merge( $active_plugin, array( 'single_file.php' ) );
		$this->set_up_mocks( $active_plugins );

		$expected_output = array( $active_plugin_dir );
		$actual_output   = $this->plugins_handler->get_all_active_plugins();

		sort( $actual_output );
		sort( $expected_output );
		$this->assertEquals( $expected_output, $actual_output );
	}

	/**
	 * Tests get_all_active_plugins with activating plugins (via request and
	 * non-request methods) and a list of active plugins.
	 *
	 * @covers Plugins_Handler::get_all_active_plugins
	 */
	public function test_get_all_active_plugins_multisite() {
		global $jetpack_autoloader_activating_plugins;

		// Activating plugin.
		$activating_plugin                     = 'activating_plugin';
		$jetpack_autoloader_activating_plugins = array( $activating_plugin );

		// Plugin activating via a request.
		$request_plugin_dir   = 'request';
		$request_plugin       = $request_plugin_dir . '/request.php';
		$_REQUEST['action']   = 'activate';
		$_REQUEST['plugin']   = $request_plugin;
		$_REQUEST['_wpnonce'] = '123abc';

		$this->set_up_mocks( self::DEFAULT_ACTIVE_PLUGINS, true );

		$expected_output = array_merge(
			array( $activating_plugin ),
			array( $request_plugin_dir ),
			self::DEFAULT_ACTIVE_PLUGIN_DIRS,
			self::DEFAULT_MULTISITE_PLUGIN_DIRS
		);

		$actual_output = $this->plugins_handler->get_all_active_plugins();

		sort( $actual_output );
		sort( $expected_output );
		$this->assertEquals( $expected_output, $actual_output );
	}
}
