<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Plugin guesser test suite.
 *
 * @package automattic/jetpack-autoloader
 */

use PHPUnit\Framework\TestCase;

/**
 * Test suite class for the Autoloader part that handles active plugin guessing.
 *
 * @runClassInSeparateProcess
 * @preserveGlobalState disabled
 */
class Test_Plugin_Guesser extends TestCase {

	/**
	 * The plugin guesser that we're testing.
	 *
	 * @var Plugin_Guesser
	 */
	private $guesser;

	/**
	 * Setup runs before each test.
	 */
	public function setUp() {
		parent::setUp();

		$this->guesser = new Plugin_Guesser();

		// Make sure the plugin directory points to the test plugins!
		define( 'WP_PLUGIN_DIR', TEST_DATA_PATH . '/plugins' );
	}

	/**
	 * Teardown runs after each test.
	 */
	public function tearDown() {
		parent::tearDown();

		// Make sure all of the test data we made use of is cleaned up after each test.
		cleanup_test_wordpress_data();
	}

	/**
	 * Tests that guessing using option doesn't break when looking for plugins that don't exist.
	 */
	public function test_using_option_does_nothing_without_valid_plugin() {
		$plugin_paths = $this->guesser->find_using_option( 'test_plugin_paths' );
		$this->assertIsArray( $plugin_paths );
		$this->assertEmpty( $plugin_paths );

		add_test_option(
			'test_plugin_paths',
			array( 'test/test.php' )
		);

		$plugin_paths = $this->guesser->find_using_option( 'test_plugin_paths' );
		$this->assertIsArray( $plugin_paths );
		$this->assertEmpty( $plugin_paths );
	}

	/**
	 * Tests that it does not return file plugins since they aren't capable of using the autoloader.
	 */
	public function test_using_option_ignores_file_plugins() {
		add_test_option(
			'test_plugin_paths',
			array( 'file-plugin.php' )
		);

		$plugin_paths = $this->guesser->find_using_option( 'test_plugin_paths' );

		$this->assertIsArray( $plugin_paths );
		$this->assertEmpty( $plugin_paths );
	}

	/**
	 * Tests that it can guess plugins that are stored in an option.
	 */
	public function test_using_option_finds_in_option() {
		add_test_option(
			'test_plugin_paths',
			array( 'plugin_current/plugin_current.php' )
		);

		$plugin_paths = $this->guesser->find_using_option( 'test_plugin_paths' );

		$this->assertIsArray( $plugin_paths );
		$this->assertCount( 1, $plugin_paths );
		$this->assertContains( TEST_DATA_PATH . '/plugins/plugin_current', $plugin_paths );
	}

	/**
	 * Tests that it can find plugins that are stored in a site option.
	 */
	public function test_using_option_finds_in_site_option() {
		add_test_site_option(
			'test_plugin_paths',
			array( 'plugin_current/plugin_current.php' )
		);

		$plugin_paths = $this->guesser->find_using_option( 'test_plugin_paths', true );

		$this->assertIsArray( $plugin_paths );
		$this->assertCount( 1, $plugin_paths );
		$this->assertContains( TEST_DATA_PATH . '/plugins/plugin_current', $plugin_paths );
	}

	/**
	 * Tests that it can guess plugins that are stored in an option's key.
	 */
	public function test_using_option_finds_plugin_in_key() {
		add_test_option(
			'test_plugin_paths',
			array( 'plugin_current/plugin_current.php' => 123456 )
		);

		$plugin_paths = $this->guesser->find_using_option( 'test_plugin_paths' );

		$this->assertIsArray( $plugin_paths );
		$this->assertCount( 1, $plugin_paths );
		$this->assertContains( TEST_DATA_PATH . '/plugins/plugin_current', $plugin_paths );
	}

	/**
	 * Tests that plugins activating this request are not discovered if a nonce is not set.
	 */
	public function test_activating_this_request_does_nothing_without_nonce() {
		$plugin_paths = $this->guesser->find_activating_this_request();

		$this->assertIsArray( $plugin_paths );
		$this->assertEmpty( $plugin_paths );
	}

	/**
	 * Tests that plugins activating this request are not discovered if there aren't any.
	 */
	public function test_activating_this_request_does_nothing_without_parameters() {
		$_REQUEST['action'] = 'activate';
		$_REQUEST['plugin'] = 'plugin_current/plugin_current.php';

		$plugin_paths = $this->guesser->find_activating_this_request();

		$this->assertIsArray( $plugin_paths );
		$this->assertEmpty( $plugin_paths );
	}

	/**
	 * Tests that single plugins activating this request are found.
	 */
	public function test_activating_this_request_works_for_single() {
		$_REQUEST['_wpnonce'] = '123abc';
		$_REQUEST['action']   = 'activate';
		$_REQUEST['plugin']   = 'plugin_current\\\\plugin_current.php';

		$plugin_paths = $this->guesser->find_activating_this_request();

		$this->assertIsArray( $plugin_paths );
		$this->assertCount( 1, $plugin_paths );
		$this->assertContains( TEST_DATA_PATH . '/plugins/plugin_current', $plugin_paths );
	}

	/**
	 * Tests that multiple plugins activating this request are found.
	 */
	public function test_activating_this_request_works_for_multiple() {
		$_REQUEST['_wpnonce'] = '123abc';
		$_REQUEST['action']   = 'activate-selected';
		$_REQUEST['checked']  = array( 'plugin_current\\\\plugin_current.php' );

		$plugin_paths = $this->guesser->find_activating_this_request();

		$this->assertIsArray( $plugin_paths );
		$this->assertCount( 1, $plugin_paths );
		$this->assertContains( TEST_DATA_PATH . '/plugins/plugin_current', $plugin_paths );
	}

	/**
	 * Tests that the guesser can find all of the plugins in different options and locations.
	 */
	public function test_finds_all_plugins_without_multisite() {
		set_test_is_multisite( false );
		add_test_option(
			'active_plugins',
			array( 'plugin_current/plugin_current.php' )
		);
		// This one should not be present since it is a multisite option!
		add_test_site_option(
			'active_sitewide_plugins',
			array( 'plugin_dev/plugin_dev.php' )
		);

		$_REQUEST['_wpnonce'] = '123abc';
		$_REQUEST['action']   = 'activate-selected';
		$_REQUEST['checked']  = array( 'plugin_newer\\\\plugin_newer.php' );

		$plugin_paths = $this->guesser->find_all_plugins();

		$this->assertIsArray( $plugin_paths );
		$this->assertCount( 2, $plugin_paths );
		$this->assertContains( TEST_DATA_PATH . '/plugins/plugin_current', $plugin_paths );
		$this->assertContains( TEST_DATA_PATH . '/plugins/plugin_newer', $plugin_paths );
	}

	/**
	 * Tests that the guesser can find all of the plugins in different options and locations.
	 */
	public function test_finds_all_plugins_with_multisite() {
		set_test_is_multisite( true );
		add_test_option(
			'active_plugins',
			array( 'plugin_current/plugin_current.php' )
		);
		add_test_site_option(
			'active_sitewide_plugins',
			array( 'plugin_dev/plugin_dev.php' => 123456 )
		);

		$_REQUEST['_wpnonce'] = '123abc';
		$_REQUEST['action']   = 'activate-selected';
		$_REQUEST['checked']  = array( 'plugin_newer\\\\plugin_newer.php' );

		$plugin_paths = $this->guesser->find_all_plugins();

		$this->assertIsArray( $plugin_paths );
		$this->assertCount( 3, $plugin_paths );
		$this->assertContains( TEST_DATA_PATH . '/plugins/plugin_current', $plugin_paths );
		$this->assertContains( TEST_DATA_PATH . '/plugins/plugin_newer', $plugin_paths );
		$this->assertContains( TEST_DATA_PATH . '/plugins/plugin_dev', $plugin_paths );
	}
}
