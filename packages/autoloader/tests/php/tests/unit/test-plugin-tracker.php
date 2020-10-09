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
class Test_Plugin_Tracker extends TestCase {

	/**
	 * The plugin guesser that we're testing.
	 *
	 * @var Plugin_Tracker
	 */
	private $tracker;

	/**
	 * Setup runs before each test.
	 */
	public function setUp() {
		parent::setUp();

		$this->tracker = new Plugin_Tracker();

		// Make sure the content directory is set so the cache file can be written/read.
		define( 'WP_CONTENT_DIR', TEST_DATA_PATH );
	}

	/**
	 * Teardown runs after each test.
	 */
	public function tearDown() {
		parent::tearDown();

		// Make sure all of the tests have no cache file.
		// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		@unlink( TEST_DATA_PATH . '/cache/jetpack-autoloader-plugin-cache.json' );
	}

	/**
	 * Tests that loaded plugins are added to internal storage.
	 */
	public function test_adds_loaded_plugins() {
		$plugins = $this->tracker->get_plugins();

		$this->assertIsArray( $plugins );
		$this->assertEmpty( $plugins );

		$this->tracker->add_loaded_plugin( TEST_DATA_PATH . '/plugins/plugin_current' );

		$plugins = $this->tracker->get_plugins();

		$this->assertIsArray( $plugins );
		$this->assertCount( 1, $plugins );
		$this->assertContains( TEST_DATA_PATH . '/plugins/plugin_current', $plugins );
	}

	/**
	 * Tests that nothing is loaded from an empty cache.
	 */
	public function test_loads_nothing_from_empty_cache() {
		$this->tracker->load_cache();

		$plugins = $this->tracker->get_plugins();

		$this->assertIsArray( $plugins );
		$this->assertEmpty( $plugins );
	}

	/**
	 * Tests that the constant is used as a path instead of the default path when present.
	 */
	public function test_loads_cache_using_constant() {
		define( 'JETPACK_AUTOLOAD_CACHE_PATH', TEST_DATA_PATH . '/test-cache.json' );
		$this->tracker->load_cache();

		$plugins = $this->tracker->get_plugins();

		$this->assertIsArray( $plugins );
		$this->assertCount( 1, $plugins );
		$this->assertContains( '/var/www/public_html/wp-content/plugins/plugin_current', $plugins );
	}

	/**
	 * Tests that the cached and loaded plugins are both returned when checking.
	 */
	public function test_merges_cache_with_loaded() {
		define( 'JETPACK_AUTOLOAD_CACHE_PATH', TEST_DATA_PATH . '/test-cache.json' );
		$this->tracker->load_cache();
		$this->tracker->add_loaded_plugin( TEST_DATA_PATH . '/plugins/plugin_current' );

		$plugins = $this->tracker->get_plugins();

		$this->assertIsArray( $plugins );
		$this->assertCount( 2, $plugins );
		$this->assertContains( '/var/www/public_html/wp-content/plugins/plugin_current', $plugins );
		$this->assertContains( TEST_DATA_PATH . '/plugins/plugin_current', $plugins );
	}

	/**
	 * Tests that the tracker is able to save a cache file and then load that cache file successfully.
	 */
	public function test_saves_and_loads_cache() {
		// Write the cache file first!
		$this->tracker->add_loaded_plugin( TEST_DATA_PATH . '/plugins/plugin_current' );
		$this->tracker->write_cache();

		$plugins = $this->tracker->get_plugins();

		$this->assertIsArray( $plugins );
		$this->assertCount( 1, $plugins );
		$this->assertContains( TEST_DATA_PATH . '/plugins/plugin_current', $plugins );

		$this->assertFileExists( TEST_DATA_PATH . '/cache/jetpack-autoloader-plugin-cache.json' );

		// Now we need to make sure it loads the cache file correctly too.
		$this->tracker = new Plugin_Tracker();
		$this->tracker->load_cache();

		$plugins = $this->tracker->get_plugins();

		$this->assertIsArray( $plugins );
		$this->assertCount( 1, $plugins );
		$this->assertContains( TEST_DATA_PATH . '/plugins/plugin_current', $plugins );
	}
}
