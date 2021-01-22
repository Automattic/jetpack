<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Integration test suite for the full autoloader.
 *
 * @package automattic/jetpack-autoloader
 */

use Automattic\Jetpack\Autoloader\AutoloadFileWriter;
use Automattic\Jetpack\Autoloader\AutoloadGenerator;
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
	 *
	 * @before
	 */
	public function set_up() {
		// We need to make sure there's an autoloader containing the current files for testing.
		$this->generate_autoloader( 'plugin_current' );
		$this->generate_autoloader( 'plugin_newer' );

		// We also want a symlink version of the plugin for testing.
		// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		@symlink( WP_PLUGIN_DIR . '/plugin_current', WP_PLUGIN_DIR . '/plugin_symlink' );
	}

	/**
	 * Teardown runs after each test.
	 *
	 * @after
	 */
	public function tear_down() {
		cleanup_test_wordpress_data();

		// Make sure all of the tests have no cache file.
		// phpcs:disable WordPress.PHP.NoSilencedErrors.Discouraged
		@unlink( TEST_DATA_PATH . '/cache/jetpack-autoloader-' . Plugins_Handler::TRANSIENT_KEY . '.json' );
		@rmdir( TEST_DATA_PATH . '/cache' );
		@unlink( WP_PLUGIN_DIR . '/plugin_symlink' );
		// phpcs:enable WordPress.PHP.NoSilencedErrors.Discouraged
	}

	/**
	 * Tests that the autoloader works as expected.
	 */
	public function test_autoloader_init() {
		$this->activate_plugin( 'plugin_current' );

		$this->load_autoloader( 'plugin_current' );

		$this->assertAutoloaderVersion( '2.6.0.0' );

		$this->shutdown_autoloader( true );
		$this->assertAutoloaderCache( array( 'plugin_current' ) );
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

		$this->shutdown_autoloader( true );
		$this->assertAutoloaderCache( array( 'plugin_current' ) );
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

		$this->shutdown_autoloader( true );
		$this->assertAutoloaderCache( array( 'plugin_current', 'plugin_newer' ) );
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

		$this->shutdown_autoloader( true );
		$this->assertAutoloaderCache( array( 'plugin_current' ) );
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

		$this->shutdown_autoloader( true );
		$this->assertAutoloaderCache( array( 'plugin_current', 'plugin_v2_2_0' ) );
	}

	/**
	 * Tests that the autoloader is reset when an older V2 is initialized before the latest is known.
	 */
	public function test_autoloader_replaces_older_v2_when_unknown() {
		$this->activate_plugin( 'plugin_v2_2_0' );

		$this->load_autoloader( 'plugin_v2_2_0' );
		$this->load_autoloader( 'plugin_current' );

		$this->assertTrue( $this->autoloader_reset );
		$this->assertAutoloaderVersion( '2.6.0.0' );

		$this->shutdown_autoloader( true );
		$this->assertAutoloaderCache( array( 'plugin_current', 'plugin_v2_2_0' ) );
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

		$this->shutdown_autoloader( true );
		$this->assertAutoloaderCache( array( 'plugin_current', 'plugin_newer' ) );
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

		$this->shutdown_autoloader( true );
		$this->assertAutoloaderCache( array( 'plugin_current', 'plugin_newer' ) );
	}

	/**
	 * Tests that the autoloader updates the cache.
	 */
	public function test_autoloader_updates_cache() {
		$this->activate_plugin( 'plugin_current' );

		// Write an empty cache so we can make sure it was updated.
		$this->cache_plugins( array() );

		$this->load_autoloader( 'plugin_current' );
		$this->shutdown_autoloader( true );

		$this->assertAutoloaderVersion( '2.6.0.0' );
		$this->assertAutoloaderCache( array( 'plugin_current' ) );
	}

	/**
	 * Tests that the autoloader does not update the cache if it has not changed.
	 */
	public function test_autoloader_does_not_update_unchanged_cache() {
		$this->activate_plugin( 'plugin_current' );

		// Write a cache that we can use when loading the autoloader.
		$this->cache_plugins( array( 'plugin_current' ) );

		$this->load_autoloader( 'plugin_current' );

		// Erase the cache and then shut the autoloader down.
		// It shouldn't update the transient since the cached plugins changed.
		$this->cache_plugins( array() );

		$this->shutdown_autoloader( true );

		$this->assertAutoloaderVersion( '2.6.0.0' );
		$this->assertAutoloaderCache( array() );
	}

	/**
	 * Tests that the autoloader empties the cache if shutdown happens before plugins_loaded.
	 */
	public function test_autoloader_empties_cache_on_early_shutdown() {
		$this->activate_plugin( 'plugin_current' );

		// Write a cache that we can use when loading the autoloader.
		$this->cache_plugins( array( 'plugin_current' ) );

		$this->load_autoloader( 'plugin_current' );

		// Make sure to shutdown prematurely so that the cache will be erased instead of saved.
		$this->shutdown_autoloader( false );

		$this->assertAutoloaderVersion( '2.6.0.0' );
		$this->assertAutoloaderCache( array() );
	}

	/**
	 * Tests that the autoloader is able to resolve symbolic links to avoid duplicate plugin entries.
	 */
	public function test_autoloader_resolves_symlinks() {
		$this->activate_plugin( 'plugin_current', 'plugin_symlink' );

		$this->load_autoloader( 'plugin_symlink' );

		$this->assertAutoloaderVersion( '2.6.0.0' );

		$this->shutdown_autoloader( true );
		// Since there's no cache we should expect the resolved path.
		$this->assertAutoloaderCache( array( 'plugin_current' ) );
	}

	/**
	 * Tests that the autoloader can handle cases where the cached path is a symlink.
	 */
	public function test_autoloader_resolves_cached_symlinks() {
		$this->cache_plugins( array( 'plugin_symlink' ) );

		$this->activate_plugin( 'plugin_current', 'plugin_symlink' );

		$this->load_autoloader( 'plugin_symlink' );

		$this->assertAutoloaderVersion( '2.6.0.0' );

		$this->shutdown_autoloader( true );
		// The cache shouldn't be updated since internally real paths are always used.
		$this->assertAutoloaderCache( array( 'plugin_symlink' ) );
	}

	/**
	 * Tests that the autoloader does not cache plugins that are deactivating in the request.
	 */
	public function test_autoloader_does_not_cache_deactivating_plugins() {
		// Make sure to cache the plugin so that the cache is dirty on shutdown.
		$this->cache_plugins( array( 'plugin_current' ) );

		// Make sure that we're deactivating the plugin in the request.
		$_REQUEST['_wpnonce'] = '123abc';
		$_REQUEST['action']   = 'deactivate';
		$_REQUEST['plugin']   = 'plugin_current/plugin_current.php';

		$this->activate_plugin( 'plugin_current' );

		$this->load_autoloader( 'plugin_current' );

		$this->shutdown_autoloader( true );

		$this->assertAutoloaderVersion( '2.6.0.0' );
		$this->assertAutoloaderCache( array() );
	}

	/**
	 * Tests that the autoloader does not cache the latest plugin when the cache caused it
	 * to be used while the plugin was deactivated.
	 */
	public function test_autoloader_does_not_cache_latest_plugin_when_deactivated() {
		$this->cache_plugins( array( 'plugin_newer' ) );

		// Don't activate the newer plugin because we want the autoloader to be used but not have it be cached.
		$this->activate_plugin( 'plugin_current' );

		$this->load_autoloader( 'plugin_current' );

		$this->shutdown_autoloader( true );

		$this->assertAutoloaderVersion( '2.7.0.0' );
		$this->assertAutoloaderCache( array( 'plugin_current' ) );
	}

	/**
	 * Tests that the autoloader appropriately handles multiple replacements when discovering
	 * unknown plugins where each is newer than the
	 */
	public function test_autoloader_consecutive_unknown_replacements() {
		$this->load_autoloader( 'plugin_v2_2_0' );
		$this->load_autoloader( 'plugin_v2_4_0' );
		$this->load_autoloader( 'plugin_current' );

		$this->assertTrue( $this->autoloader_reset );
		$this->assertAutoloaderVersion( '2.6.0.0' );

		$this->shutdown_autoloader( true );
		$this->assertAutoloaderCache( array( 'plugin_v2_2_0', 'plugin_v2_4_0', 'plugin_current' ) );
	}

	/**
	 * Tests that the autoloader operates correctly when an unknown plugin is included from the cache
	 * but multiple unknown resets have resulted in an ambiguous initialization check.
	 */
	public function test_autoloader_with_ambiguous_initialization_check() {
		// When including from another autoloader the latest version contains the new autoloader's version.
		global $jetpack_autoloader_latest_version;
		$jetpack_autoloader_latest_version = '2.6.0.0';
		// Make sure the classmap is not empty to simulate the reset semantics of older autoloaders.
		global $jetpack_packages_classmap;
		$jetpack_packages_classmap = array(
			AutoloadGenerator::class => array(
				'version' => '2.4.0.0',
				'path'    => '',
			),
		);

		// The state we've set above simulates what the global state looks like when an older autoloader is
		// including a newer one. This is not an inclusion from a plugin so it shouldn't be recorded as active.
		$this->load_autoloader( 'plugin_current' );

		$this->assertAutoloaderVersion( '2.6.0.0' );

		$this->shutdown_autoloader( true );
		// The cache should be empty because plugin_current was never loaded by a plugin.
		$this->assertAutoloaderCache( array() );
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
	 * @param string $folder The folder that the plugin is in. If empty this will default to $plugin.
	 */
	private function activate_plugin( $plugin, $folder = '' ) {
		$active_plugins = get_option( 'active_plugins' );
		if ( ! $active_plugins ) {
			$active_plugins = array();
		}

		if ( empty( $folder ) ) {
			$folder = $plugin;
		}

		$active_plugins[] = $folder . '/' . $plugin . '.php';

		add_test_option( 'active_plugins', $active_plugins );
	}

	/**
	 * "Deactivate" a plugin so that the autoloader can't detect it.
	 *
	 * @param string $plugin The plugin we want to deactivate.
	 * @param string $folder The folder that the plugin is in. If empty this will default to $plugin.
	 */
	private function deactivate_plugin( $plugin, $folder = '' ) {
		$active_plugins = get_option( 'active_plugins' );
		if ( ! $active_plugins ) {
			$active_plugins = array();
		}
		if ( empty( $folder ) ) {
			$folder = $plugin;
		}

		$key = array_search( $folder . '/' . $plugin . '.php', $active_plugins, true );
		if ( false === $key ) {
			return;
		}

		array_splice( $active_plugins, $key, 1 );

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
			$paths[] = '{{WP_PLUGIN_DIR}}/' . $plugin;
		}

		// The cached plugins are always sorted!
		sort( $paths );

		set_transient( Plugins_Handler::TRANSIENT_KEY, $paths );
	}

	/**
	 * Runs the autoloader's shutdown action.
	 *
	 * @param bool $plugins_loaded Indicates whether or not the plugins_loaded action should have fired.
	 */
	private function shutdown_autoloader( $plugins_loaded = true ) {
		if ( $plugins_loaded ) {
			do_action( 'plugins_loaded' );
		}

		do_action( 'shutdown' );
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

	/**
	 * Asserts that the autoloader cache contains the plugins given.
	 *
	 * @param array $plugins The plugins to check the cache for.
	 */
	private function assertAutoloaderCache( $plugins ) {
		$paths = array();
		foreach ( $plugins as $plugin ) {
			$paths[] = '{{WP_PLUGIN_DIR}}/' . $plugin;
		}

		// The cached plugins are always sorted!
		sort( $paths );

		// Change "false" to an empty array so that the check is easily understood.
		$transient = get_transient( Plugins_Handler::TRANSIENT_KEY );
		if ( empty( $transient ) ) {
			$transient = array();
		}

		$this->assertEquals( $paths, $transient, 'The autoloader cache does not match' );
	}
}
