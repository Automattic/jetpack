<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Integration test suite for the full autoloader.
 *
 * @package automattic/jetpack-autoloader
 */

use Automattic\Jetpack\Autoloader\AutoloadFileWriter;
use Jetpack\AutoloaderTestData\Plugin\Test;
use PHPUnit\Framework\TestCase;

/**
 * Test suite class for testing the autoloader in different deployment configurations.
 *
 * @runTestsInSeparateProcesses Ensure each test has a fresh process to work with, replicating real requests.
 * @preserveGlobalState disabled
 */
class Test_Autoloader_Scenarios extends TestCase {

	/**
	 * Indicates whether or not the autoloader has been reset by a load operation.
	 *
	 * @var bool
	 */
	private $autoloader_reset;

	/**
	 * Setup runs before each test.
	 */
	public function setUp() {
		parent::setUp();

		// Make sure the content directory is correct so we can run the autoloader.
		define( 'WP_CONTENT_DIR', TEST_DATA_PATH );
		define( 'WP_PLUGIN_DIR', TEST_DATA_PATH . '/plugins' );

		// We need to make sure there's an autoloader containing the current files for testing.
		$this->generate_autoloader( 'plugin_current' );
		$this->generate_autoloader( 'plugin_newer' );
	}

	/**
	 * Teardown runs after each test.
	 */
	public function tearDown() {
		parent::tearDown();

		cleanup_test_wordpress_data();

		// Make sure all of the tests have no cache file.
		// phpcs:disable WordPress.PHP.NoSilencedErrors.Discouraged
		@unlink( TEST_DATA_PATH . '/cache/jetpack-autoloader-' . Plugins_Handler::CACHE_KEY . '.json' );
		@rmdir( TEST_DATA_PATH . '/cache' );
		// phpcs:enable WordPress.PHP.NoSilencedErrors.Discouraged
	}

	/**
	 * Tests that the autoloader works as expected.
	 */
	public function test_autoloader_init() {
		$this->activate_plugin( 'plugin_current' );

		$this->load_autoloader( 'plugin_current' );

		$this->assertAutoloaderVersion( '2.6.0.0' );
	}

	/**
	 * Tests that the autoloader does not initialize twice.
	 */
	public function test_autoloader_init_once() {
		$this->activate_plugin( 'plugin_current' );

		$this->load_autoloader( 'plugin_current' );
		$this->load_autoloader( 'plugin_current' );

		$this->assertFalse( $this->autoloader_reset );
		$this->assertAutoloaderVersion( '2.6.0.0' );
	}

	/**
	 * Tests that the autoloader loads the latest when loading an older one first.
	 */
	public function test_autoloader_loads_latest() {
		$this->activate_plugin( 'plugin_current' );
		$this->activate_plugin( 'plugin_newer' );

		$this->load_autoloader( 'plugin_current' );
		$this->load_autoloader( 'plugin_newer' );

		$this->assertFalse( $this->autoloader_reset );
		$this->assertAutoloaderVersion( '2.7.0.0' );
	}

	/**
	 * Tests that the autoloader does not conflict with a v1 autoloader.
	 */
	public function test_autoloader_overrides_v1() {
		$this->activate_plugin( 'plugin_v1' );
		$this->activate_plugin( 'plugin_current' );

		$this->load_autoloader( 'plugin_v1' );
		$this->load_autoloader( 'plugin_current' );

		$this->assertTrue( $this->autoloader_reset );
		$this->assertAutoloaderVersion( '2.6.0.0' );
	}

	/**
	 * Tests that the autoloader is not reset when an older V2 initializes after the latest.
	 */
	public function test_autoloader_not_reset_by_older_v2() {
		$this->activate_plugin( 'plugin_current' );
		$this->activate_plugin( 'plugin_v2_2_0' );

		$this->load_autoloader( 'plugin_current' );
		$this->load_autoloader( 'plugin_v2_2_0' );

		$this->assertFalse( $this->autoloader_reset );
		$this->assertAutoloaderVersion( '2.6.0.0' );
	}

	/**
	 * Tests that the autoloader resets when an unknown plugin is encountered, and that it does not
	 * reset a second time once the unknown plugin has been recorded.
	 */
	public function test_autoloader_resets_when_unknown_plugin_is_encountered() {
		$this->activate_plugin( 'plugin_current' );

		$this->load_autoloader( 'plugin_current' );
		$this->load_autoloader( 'plugin_newer' );

		$this->assertTrue( $this->autoloader_reset );
		$this->assertAutoloaderVersion( '2.7.0.0' );
	}

	/**
	 * Tests that the autoloader uses the cache to avoid resetting when an known plugin is encountered.
	 */
	public function test_autoloader_uses_cache_to_avoid_resets() {
		$this->activate_plugin( 'plugin_current' );

		// Write the plugins to the cache so that the autoloader will see them.
		$this->cache_plugins( array( 'plugin_current', 'plugin_newer' ) );

		$this->load_autoloader( 'plugin_current' );
		$this->load_autoloader( 'plugin_newer' );

		$this->assertFalse( $this->autoloader_reset );
		$this->assertAutoloaderVersion( '2.7.0.0' );
	}

	/**
	 * Generates a new autoloader from the current source files for the "plugin_current" plugin.
	 *
	 * @param string $plugin The plugin to generate the autoloader for.
	 */
	private function generate_autoloader( $plugin ) {
		// phpcs:disable WordPress.PHP.NoSilencedErrors.Discouraged

		$autoload_dir = TEST_DATA_PATH . '/plugins/' . $plugin . '/vendor/jetpack-autoloader';

		// Erase the existing autoloader files if they exist.
		@mkdir( $autoload_dir );
		$files = scandir( $autoload_dir );
		foreach ( $files as $file ) {
			@unlink( $autoload_dir . '/' . $file );
		}
		@unlink( $autoload_dir . '/../autoload_packages.php' );

		// Copy the autoloader files to the plugin directory.
		$suffix = md5( uniqid( '', true ) );
		AutoloadFileWriter::copyAutoloaderFiles( null, $autoload_dir, $suffix );

		// phpcs:enable WordPress.PHP.NoSilencedErrors.Discouraged
	}

	/**
	 * "Activate" a plugin so that the autoloader can detect it.
	 *
	 * @param string $plugin The plugin we want to activate.
	 */
	private function activate_plugin( $plugin ) {
		$active_plugins = get_option( 'active_plugins' );
		if ( ! $active_plugins ) {
			$active_plugins = array();
		}

		$active_plugins[] = $plugin . '/' . $plugin . '.php';

		add_test_option( 'active_plugins', $active_plugins );
	}

	/**
	 * Loads the given autoloader and initializes it.
	 *
	 * @param string $plugin The plugin to load the autoloader from.
	 */
	private function load_autoloader( $plugin ) {
		// We're going to use changes in the hooks to detect if the autoloader has been reset.
		global $test_filters;
		$temp = $test_filters;

		require TEST_DATA_PATH . '/plugins/' . $plugin . '/vendor/autoload_packages.php';

		// The first time the autoloader is loaded we didn't reset.
		if ( ! isset( $this->autoloader_reset ) ) {
			$this->autoloader_reset = false;
		} else {
			$this->autoloader_reset = $temp !== $test_filters;
		}
	}

	/**
	 * Writes the plugins to the cache so that they can be read by the autoloader.
	 *
	 * @param string[] $plugins The plugins to cache.
	 */
	private function cache_plugins( $plugins ) {
		$paths = array();
		foreach ( $plugins as $plugin ) {
			$paths[] = TEST_DATA_PATH . '/plugins/' . $plugin;
		}

		// The cached plugins are always sorted!
		sort( $paths );

		$handler = new Cache_Handler();
		$handler->write_to_cache( Plugins_Handler::CACHE_KEY, $paths );
	}

	/**
	 * Asserts that the latest autoloader version is the one given.
	 *
	 * @param string $version The version to check.
	 */
	private function assertAutoloaderVersion( $version ) {
		$this->assertTrue( class_exists( Test::class ) );
		$this->assertEquals( $version, Test::VERSION, 'The class version is incorrect.' );

		global $jetpack_autoloader_latest_version;
		$this->assertEquals( $version, $jetpack_autoloader_latest_version, 'The autoloader version is incorrect.' );
	}
}
