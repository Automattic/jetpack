<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * The Plugins_HandlerTest class file.
 *
 * @package automattic/jetpack-autoloader
 */

use PHPUnit\Framework\TestCase;

define( 'WP_PLUGIN_DIR', '/var/www/wp-content/plugins' );

/**
 * Provides unit tests for the methods in the Plugins_Handler class.
 */
class PluginsHandlerTest extends TestCase {

	const DEFAULT_ACTIVE_PLUGINS = array(
		'/var/www/wp-content/plugins/test_1',
		'/var/www/wp-content/plugins/test_2',
	);

	const DEFAULT_MULTISITE_PLUGINS = array(
		'/var/www/wp-content/plugins/multi_1',
		'/var/www/wp-content/plugins/multi_2',
	);

	/**
	 * This method is called before each test.
	 */
	public function setUp() {
		$this->plugins_handler = $this->getMockBuilder( 'Plugins_Handler' )
			->setMethods(
				array(
					'get_current_plugin_path',
					'get_multisite_plugins_paths',
					'get_active_plugins_paths',
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
			->method( 'get_active_plugins_paths' )
			->willReturn( (array) $active_plugins );

		if ( $use_multisite ) {
			$this->plugins_handler
				->method( 'get_multisite_plugins_paths' )
				->willReturn( self::DEFAULT_MULTISITE_PLUGINS );
		} else {
			$this->plugins_handler
				->method( 'get_multisite_plugins_paths' )
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
	 * Tests is_directory_plugin() with an empty string.
	 *
	 * @covers Plugins_Handler::is_directory_plugin
	 */
	public function test_is_directory_plugin_single_file_with_empty_string() {
		$this->assertFalse( $this->plugins_handler->is_directory_plugin( '' ) );
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
	 * Tests get_all_active_plugins_paths() with activating plugins (via request and
	 * non-request methods) and a list of active plugins.
	 *
	 * @covers Plugins_Handler::get_all_active_plugins_paths
	 */
	public function test_get_all_active_plugins_everything() {
		global $jetpack_autoloader_activating_plugins_paths;

		// Activating plugin.
		$activating_plugin                           = '/var/www/wp-content/plugins/activating';
		$jetpack_autoloader_activating_plugins_paths = array( $activating_plugin );

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
			array( WP_PLUGIN_DIR . '/' . $request_plugin_dir ),
			self::DEFAULT_ACTIVE_PLUGINS
		);

		$actual_output = $this->plugins_handler->get_all_active_plugins_paths();

		sort( $actual_output );
		sort( $expected_output );
		$this->assertEquals( $expected_output, $actual_output );
	}

	/**
	 * Tests get_all_active_plugins_paths() with multiple plugins activating (via request and
	 * non-request methods) and a list of active plugins.
	 *
	 * @covers Plugins_Handler::get_all_active_plugins_paths
	 */
	public function test_get_all_active_plugins_multiple_activating() {
		global $jetpack_autoloader_activating_plugins_paths;

		// Activating plugins.
		$activating_plugins = array(
			'/var/www/wp-content/plugins/activating_1',
			'/var/www/wp-content/plugins/activating_2',
		);

		$jetpack_autoloader_activating_plugins_paths = $activating_plugins;

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

		$request_paths = array();
		foreach ( $request_plugin_dirs as $request_plugin ) {
			$request_paths[] = WP_PLUGIN_DIR . '/' . $request_plugin;
		}

		$_REQUEST['action']   = 'activate-selected';
		$_REQUEST['checked']  = $request_plugins;
		$_REQUEST['_wpnonce'] = '123abc';

		// Use default active plugins.
		$this->set_up_mocks();

		$expected_output = array_merge(
			$activating_plugins,
			$request_paths,
			self::DEFAULT_ACTIVE_PLUGINS
		);

		$actual_output = $this->plugins_handler->get_all_active_plugins_paths();

		sort( $actual_output );
		sort( $expected_output );
		$this->assertEquals( $expected_output, $actual_output );
	}

	/**
	 * Tests get_all_active_plugins_paths() with no nonce included in the request. Since
	 * a nonce isn't included, the plugin will not be activated.
	 *
	 * @covers Plugins_Handler::get_all_active_plugins_paths
	 */
	public function test_get_all_active_plugins_no_nonce() {
		global $jetpack_autoloader_activating_plugins_paths;

		// Activating plugin.
		$activating_plugin                           = '/var/www/wp-content/plugins/activating';
		$jetpack_autoloader_activating_plugins_paths = array( $activating_plugin );

		// Plugin activating via a request without a nonce.
		$request_plugin     = 'request/request.php';
		$_REQUEST['action'] = 'activate';
		$_REQUEST['plugin'] = $request_plugin;

		// Use default active plugins.
		$this->set_up_mocks();

		// The plugin activating via a request should not be in the output.
		$expected_output = array_merge(
			array( $activating_plugin ),
			self::DEFAULT_ACTIVE_PLUGINS
		);

		$actual_output = $this->plugins_handler->get_all_active_plugins_paths();

		sort( $actual_output );
		sort( $expected_output );
		$this->assertEquals( $expected_output, $actual_output );
	}

	/**
	 * Tests get_all_active_plugins_paths() with no activating plugins.
	 *
	 * @covers Plugins_Handler::get_all_active_plugins_paths
	 */
	public function test_get_all_active_plugins_no_activating() {
		// Plugin deactivating via a request.
		$request_plugin       = 'request/request.php';
		$_REQUEST['action']   = 'deactivate';
		$_REQUEST['plugin']   = $request_plugin;
		$_REQUEST['_wpnonce'] = '123abc';

		// Use default active plugins.
		$this->set_up_mocks();

		$expected_output = self::DEFAULT_ACTIVE_PLUGINS;
		$actual_output   = $this->plugins_handler->get_all_active_plugins_paths();

		sort( $actual_output );
		sort( $expected_output );
		$this->assertEquals( $expected_output, $actual_output );
	}

	/**
	 * Tests get_all_active_plugins_paths with activating plugins (via request and
	 * non-request methods) and a list of active plugins.
	 *
	 * @covers Plugins_Handler::get_all_active_plugins_paths
	 */
	public function test_get_all_active_plugins_multisite() {
		global $jetpack_autoloader_activating_plugins_paths;

		// Activating plugin.
		$activating_plugin                           = '/var/www/wp-content/plugins/activating';
		$jetpack_autoloader_activating_plugins_paths = array( $activating_plugin );

		// Plugin activating via a request.
		$request_plugin_dir   = 'request';
		$request_plugin       = $request_plugin_dir . '/request.php';
		$_REQUEST['action']   = 'activate';
		$_REQUEST['plugin']   = $request_plugin;
		$_REQUEST['_wpnonce'] = '123abc';

		$this->set_up_mocks( self::DEFAULT_ACTIVE_PLUGINS, true );

		$expected_output = array_merge(
			array( $activating_plugin ),
			array( WP_PLUGIN_DIR . '/' . $request_plugin_dir ),
			self::DEFAULT_ACTIVE_PLUGINS,
			self::DEFAULT_MULTISITE_PLUGINS
		);

		$actual_output = $this->plugins_handler->get_all_active_plugins_paths();

		sort( $actual_output );
		sort( $expected_output );
		$this->assertEquals( $expected_output, $actual_output );
	}
}
