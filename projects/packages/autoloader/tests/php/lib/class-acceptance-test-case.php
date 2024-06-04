<?php
/**
 * Base class file for all acceptance tests.
 *
 * @package automattic/jetpack-autoloader
 */

use Automattic\Jetpack\Autoloader\jpCurrent\Path_Processor;
use Automattic\Jetpack\Autoloader\jpCurrent\Plugins_Handler;
use PHPUnit\Framework\TestCase;

/**
 * Class Acceptance_Test_Case.
 */
abstract class Acceptance_Test_Case extends TestCase {

	/**
	 * A constant for identifying the current plugin installed as an mu-plugin in the tests.
	 */
	const CURRENT_MU = Test_Plugin_Factory::CURRENT . 'mu';

	/**
	 * An array containing the versions and paths of all of the autoloaders we have installed for the test class.
	 *
	 * @var string[]
	 */
	private $installed_autoloaders;

	/**
	 * An array containing the versions and paths of autoloaders that have been symlinked.
	 *
	 * @var string[]
	 */
	private $symlinked_autoloaders;

	/**
	 * Setup runs before each test.
	 *
	 * @before
	 */
	public function set_up() {
		// Ensure that the current autoloader is always installed.
		$this->installed_autoloaders = array( Test_Plugin_Factory::CURRENT => TEST_PLUGIN_DIR );
		$this->symlinked_autoloaders = array();

		// We need to install the current plugin as an mu-plugin in many tests.
		$this->install_autoloaders( self::CURRENT_MU );
	}

	/**
	 * Teardown runs after each test.
	 *
	 * @after
	 */
	public function tear_down() {
		// Erase all of the directory symlinks since we're done with them.
		foreach ( $this->symlinked_autoloaders as $dir ) {
            // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
			@unlink( $dir );
		}
	}

	/**
	 * Installs the given autoloader or autoloaders so that they can be used by tests.
	 *
	 * @param string|string[] $version_or_versions The version or array of versions of the autoloader to install.
	 *                                             A suffix of 'mu' designates that the plugin should be an mu-plugin.
	 */
	protected function install_autoloaders( $version_or_versions ) {
		if ( ! is_array( $version_or_versions ) ) {
			$version_or_versions = array( $version_or_versions );
		}

		foreach ( $version_or_versions as $version ) {
			if ( isset( $this->installed_autoloaders[ $version ] ) ) {
				$this->fail( 'The plugin has already been installed.' );
			}

			// A suffix of 'mu' means that the plugin should be installed to mu-plugins.
			$is_mu_plugin = 'mu' === substr( $version, -2 );

			$path                                    = Test_Plugin_Factory::create_test_plugin(
				$is_mu_plugin,
				$is_mu_plugin ? substr( $version, 0, -2 ) : $version
			)->make();
			$this->installed_autoloaders[ $version ] = $path;
		}
	}

	/**
	 * Installs a symlink to a plugin version.
	 *
	 * @param string $version      The version of the autoloader we want to symlink to.
	 * @param bool   $is_mu_plugin Whether or not the symlink should be an mu-plugin.
	 * @param string $symlink_key  The key for the symlink in the installed plugin list.
	 */
	protected function install_autoloader_symlink( $version, $is_mu_plugin, $symlink_key ) {
		if ( isset( $this->symlinked_autoloaders[ $symlink_key ] ) ) {
			$this->fail( 'The symlink has already been installed.' );
		}

		// The location of the symlink depends on whether it's an mu-plugin or not.
		if ( $is_mu_plugin ) {
			$symlink_dir = WPMU_PLUGIN_DIR . DIRECTORY_SEPARATOR . $symlink_key;
		} else {
			$symlink_dir = WP_PLUGIN_DIR . DIRECTORY_SEPARATOR . $symlink_key;
		}

		// Create the symlink to the plugin's version.
		$plugin_dir = $this->get_autoloader_path( $version );

        // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		@symlink( $plugin_dir, $symlink_dir );

		// Record it as installed but also as symlinked so that it can be cleaned up.
		$this->installed_autoloaders[ $symlink_key ] = $symlink_dir;
		$this->symlinked_autoloaders[ $symlink_key ] = $symlink_dir;
	}

	/**
	 * Fetches the path for an installed autoloader.
	 *
	 * @param string $version The version of autoloader we want a path to.
	 * @return string The path to the autoloader.
	 */
	protected function get_autoloader_path( $version ) {
		if ( ! isset( $this->installed_autoloaders[ $version ] ) ) {
			$this->fail( "The $version autoloader has not been installed." );
		}

		return $this->installed_autoloaders[ $version ];
	}

	/**
	 * Loads an autoloader and tracks whether or not a reset occurred.
	 *
	 * @param string $version The version of the autoloader we want to load.
	 */
	protected function load_plugin_autoloader( $version ) {
		$plugin_dir = $this->get_autoloader_path( $version );

		// We're going to store a value in the classmap to detect when a reset has occurred after loading the autoloader.
		// This isn't perfect (it won't catch successive resets from a new autoloader discovering newer autoloaders) but
		// it will at least catch the most common reset scenarios that we can build assertions on.
		global $jetpack_packages_classmap;
		$reset_count = $jetpack_packages_classmap['reset_count'] ?? null;

		require_once $plugin_dir . '/vendor/autoload_packages.php';

		// Since the classmap was not erased we can assume no reset occurred.
		if ( isset( $jetpack_packages_classmap['reset_count'] ) ) {
			return;
		}

		// Since we can assume after every load we set the count we know a null value
		// means this was the first time the autoloader was executed.
		if ( $reset_count === null ) {
			$jetpack_packages_classmap['reset_count'] = 0;
		} else {
			$jetpack_packages_classmap['reset_count'] = $reset_count + 1;
		}
	}

	/**
	 * Executes all of the given autoloader versions and triggers a shutdown.
	 *
	 * Note: This method sorts all of the mu-plugins to the front of the array to replicate WordPress' loading order.
	 *
	 * @param string[] $versions             The array of versions to execute in the order they should be loaded.
	 * @param bool     $after_plugins_loaded Whether or not the shutdown should be after the plugins_loaded action.
	 */
	protected function execute_autoloader_chain( $versions, $after_plugins_loaded ) {
		// Place all of the mu-plugins at the front of the array to replicate WordPress' load order.
		// Take care not to affect the order in any other way so that the caller can define the
		// rest of the load order semantics. This functionality is mostly to prevent accidents.
		$mu_versions = array_filter(
			$versions,
			function ( $version ) {
				return 'mu' === substr( $version, -2 );
			}
		);

		foreach ( $mu_versions as $version ) {
			$this->load_plugin_autoloader( $version );
		}
		foreach ( $versions as $key => $version ) {
			// We've already loaded these!
			if ( isset( $mu_versions[ $key ] ) ) {
				continue;
			}

			$this->load_plugin_autoloader( $version );
		}

		$this->trigger_shutdown( $after_plugins_loaded );
	}

	/**
	 * Adds an autoloader plugin to the activated list.
	 *
	 * @param string $version  The version of autoloader that we want to activate.
	 * @param bool   $sitewide Indicates whether or not the plugin should be site active.
	 */
	protected function activate_autoloader( $version, $sitewide = false ) {
		$plugin_dir = $this->get_autoloader_path( $version );

		if ( false !== strpos( $plugin_dir, 'mu-plugins' ) ) {
			$this->fail( 'Plugins in mu-plugins cannot be activated.' );
		}

		// The slug is the last segment of the path in WordPress plugin slug format.
		$slug = basename( $plugin_dir );
		$slug = "$slug/$slug.php";

		// Retrieve the list from the appropriate option.
		if ( $sitewide ) {
			$active_plugins = get_site_option( 'active_sitewide_plugins' );
		} else {
			$active_plugins = get_option( 'active_plugins' );
		}

		if ( ! $active_plugins ) {
			$active_plugins = array();
		}

		if ( in_array( $slug, $active_plugins, true ) ) {
			return;
		}

		$active_plugins[] = $slug;

		// Make sure to set the list back to the appropriate option.
		if ( $sitewide ) {
			add_test_site_option( 'active_sitewide_plugins', $active_plugins );
		} else {
			add_test_option( 'active_plugins', $active_plugins );
		}
	}

	/**
	 * Triggers a shutdown action for the autoloader.
	 *
	 * @param bool $after_plugins_loaded Whether or not we should execute 'plugins_loaded' before shutting down.
	 */
	protected function trigger_shutdown( $after_plugins_loaded ) {
		if ( $after_plugins_loaded ) {
			do_action( 'plugins_loaded' );
		}

		do_action( 'shutdown' );
	}

	/**
	 * Erases the autoloader cache.
	 */
	protected function erase_cache() {
		set_transient( Plugins_Handler::TRANSIENT_KEY, array() );
	}

	/**
	 * Adds a version or array of versions to the autoloader cache.
	 *
	 * @param string|string[] $version_or_versions The version or array of versions of the autoloader that we want to cache.
	 */
	protected function cache_plugin( $version_or_versions ) {
		if ( ! is_array( $version_or_versions ) ) {
			$version_or_versions = array( $version_or_versions );
		}

		// Use the path processor so we can replicate the real cache.
		$processor = new Path_Processor();

		$plugins = array();
		foreach ( $version_or_versions as $version ) {
			$plugin    = $this->get_autoloader_path( $version );
			$plugins[] = $processor->tokenize_path_constants( $plugin );
		}

		$transient = get_transient( Plugins_Handler::TRANSIENT_KEY );
		if ( empty( $transient ) ) {
			$transient = array();
		}

		$transient = array_merge( $transient, $plugins );

		// The cache is always sorted.
		sort( $transient );

		// Store the cache now that we've added the plugin or plugins.
		set_transient( Plugins_Handler::TRANSIENT_KEY, $transient );
	}

	/**
	 * Asserts that the autoloader was reset a given number of times.
	 *
	 * @param int $count The number of resets we expect.
	 */
	protected function assertAutoloaderResetCount( $count ) {
		global $jetpack_packages_classmap;
		$reset_count = $jetpack_packages_classmap['reset_count'] ?? 0;
		$this->assertEquals( $count, $reset_count, 'The number of autoloader resets did not match what was expected.' );
	}

	/**
	 * Asserts that the autoloader has been initialized to a specific version.
	 *
	 * @param string $version The version of the autoloader we expect.
	 */
	protected function assertAutoloaderVersion( $version ) {
		if ( Test_Plugin_Factory::CURRENT === $version || self::CURRENT_MU === $version ) {
			$version = Test_Plugin_Factory::VERSION_CURRENT;
		}

		global $jetpack_autoloader_latest_version;
		$this->assertEquals( $version, $jetpack_autoloader_latest_version, 'The version of the autoloader did not match what was expected.' );
	}

	/**
	 * Asserts that the autoloader is able to provide the given class.
	 *
	 * @param string $fqn The fully qualified name of the class we want to load.
	 */
	protected function assertAutoloaderProvidesClass( $fqn ) {
		global $jetpack_autoloader_latest_version;
		if ( ! isset( $jetpack_autoloader_latest_version ) ) {
			$this->fail( 'There is no autoloader loaded to check.' );
		}

		// We're going to check for v1, < v2.4, and >= v2.4 autoloaders directly.
		// This is prefereable to trying to load the class because it controls
		// for other autoloaders that may have been registered by mistake.
		global $jetpack_packages_classes; // v1 used this global.
		global $jetpack_packages_classmap; // v2.0 - v2.3 used only the classmap.
		global $jetpack_autoloader_loader; // v2.4 introduced the loader with PSR-4 support.

		$file = null;
		if ( isset( $jetpack_autoloader_loader ) ) {
			$file = $jetpack_autoloader_loader->find_class_file( $fqn );
		} elseif ( isset( $jetpack_packages_classmap[ $fqn ] ) ) {
			$file = $jetpack_packages_classmap[ $fqn ];
		} elseif ( isset( $jetpack_packages_classes[ $fqn ] ) ) {
			$file = $jetpack_packages_classes[ $fqn ];
		}

		$this->assertNotNull( $file, "The autoloader did not provide the '$fqn' class." );
	}

	/**
	 * Asserts that the autoloader did not find an unknown plugin.
	 *
	 * @param string $version The version of autoloader we expect to be known.
	 */
	protected function assertAutoloaderNotFoundUnknown( $version ) {
		$plugin = $this->get_autoloader_path( $version );

		global $jetpack_autoloader_activating_plugins_paths;
		$this->assertNotContains( $plugin, $jetpack_autoloader_activating_plugins_paths, 'The autoloader registered the plugin as unknown.' );
	}

	/**
	 * Asserts that the autoloader found an unknown pugin.
	 *
	 * @param string $version The version of autoloader we expect to be unknown.
	 */
	protected function assertAutoloaderFoundUnknown( $version ) {
		$plugin = $this->get_autoloader_path( $version );

		global $jetpack_autoloader_activating_plugins_paths;
		$this->assertContains( $plugin, $jetpack_autoloader_activating_plugins_paths, 'The autoloader did not register the plugin as unknown.' );
	}

	/**
	 * Asserts that the autoloader cache is empty.
	 */
	protected function assertAutoloaderCacheEmpty() {
		$transient = get_transient( Plugins_Handler::TRANSIENT_KEY );
		if ( empty( $transient ) ) {
			$transient = array();
		}

		$this->assertEmpty( $transient, 'The autoloader cache was not empty.' );
	}

	/**
	 * Asserts that the autoloader cache only contains the given version or array of version.
	 *
	 * @param string|string[] $version_or_versions The version or array of versions that we expect.
	 */
	protected function assertAutoloaderCacheEquals( $version_or_versions ) {
		if ( ! is_array( $version_or_versions ) ) {
			$version_or_versions = array( $version_or_versions );
		}

		// Use the path processor so we can replicate the real cache.
		$processor = new Path_Processor();

		$plugins = array();
		foreach ( $version_or_versions as $version ) {
			$plugin    = $this->get_autoloader_path( $version );
			$plugins[] = $processor->tokenize_path_constants( $plugin );
		}

		// The autoloader cache is always sorted.
		sort( $plugins );

		$transient = get_transient( Plugins_Handler::TRANSIENT_KEY );
		if ( empty( $transient ) ) {
			$transient = array();
		}

		$this->assertEquals( $plugins, $transient, 'The autoloader cache did not match what was expected.' );
	}
}
