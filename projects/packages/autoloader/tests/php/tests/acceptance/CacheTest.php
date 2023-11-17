<?php
/**
 * Acceptance test suite for the current autoloader.
 *
 * @package automattic/jetpack-autoloader
 */

/**
 * Test suite class for verifying the functionality of the current autoloader's cache mechanism.
 *
 * @runTestsInSeparateProcesses Ensure each test has a fresh process as if it was a real request.
 * @preserveGlobalState disabled
 */
class CacheTest extends Acceptance_Test_Case {

	/**
	 * Tests that the autoloader erases the cache if the shutdown action happens before plugins are finished loading.
	 */
	public function test_autoloader_does_not_save_cache_on_early_shutdown() {
		// Cache the plugin so we can detect if it was erased.
		$this->cache_plugin( Test_Plugin_Factory::CURRENT );

		// Load and prematurely shutdown the autoloader.
		$this->load_plugin_autoloader( Test_Plugin_Factory::CURRENT );
		$this->trigger_shutdown( false );

		// Make sure the autoloader worked as expected.
		$this->assertAutoloaderVersion( Test_Plugin_Factory::CURRENT );
		$this->assertAutoloaderResetCount( 0 );
		$this->assertAutoloaderFoundUnknown( Test_Plugin_Factory::CURRENT );
		$this->assertAutoloaderCacheEmpty();
		$this->assertAutoloaderProvidesClass( \Automattic\Jetpack\AutoloaderTesting\Current\UniqueTestClass::class );
	}

	/**
	 * Tests that the autoloader does not write the cache when the active plugins have not changed.
	 */
	public function test_autoloader_does_not_write_unchanged_cache() {
		// Cache the plugin so that the cache is unchanged.
		$this->cache_plugin( Test_Plugin_Factory::CURRENT );

		// Load the autoloader.
		$this->load_plugin_autoloader( Test_Plugin_Factory::CURRENT );

		// We're going to erase the cache before we shut the autoloader down.
		// Since the cache is only loaded when the autoloader is, we can
		// do this to detect whether or not the cache is updated.
		$this->erase_cache();

		// Trigger the shutdown now and it should NOT update the cache.
		$this->trigger_shutdown( true );

		// Make sure the autoloader worked as expected.
		$this->assertAutoloaderVersion( Test_Plugin_Factory::CURRENT );
		$this->assertAutoloaderResetCount( 0 );
		$this->assertAutoloaderFoundUnknown( Test_Plugin_Factory::CURRENT );
		$this->assertAutoloaderCacheEmpty();
		$this->assertAutoloaderProvidesClass( \Automattic\Jetpack\AutoloaderTesting\Current\UniqueTestClass::class );
	}

	/**
	 * Tests that the autoloader does not reset when it encounters unknown plugins that are in the cache already.
	 */
	public function test_autoloader_does_not_reset_when_unknown_plugins_are_cached() {
		// Cache the plugins so that they will not be unknown.
		$this->cache_plugin( array( self::CURRENT_MU, Test_Plugin_Factory::CURRENT ) );

		// Load and shutdown the autoloaders safely.
		$this->execute_autoloader_chain(
			array(
				self::CURRENT_MU,
				Test_Plugin_Factory::CURRENT,
			),
			true
		);

		// Make sure the autoloader worked as expected.
		$this->assertAutoloaderVersion( Test_Plugin_Factory::CURRENT );
		$this->assertAutoloaderResetCount( 0 );
		$this->assertAutoloaderFoundUnknown( self::CURRENT_MU );
		$this->assertAutoloaderCacheEquals( array( self::CURRENT_MU, Test_Plugin_Factory::CURRENT ) );
		$this->assertAutoloaderProvidesClass( \Automattic\Jetpack\AutoloaderTesting\SharedTestClass::class );

		$this->markTestIncomplete( 'The autoloader does not currently support PSR-4 loading from multiple directories.' );
		$this->assertAutoloaderProvidesClass( \Automattic\Jetpack\AutoloaderTesting\Current\UniqueTestClass::class );
		$this->assertAutoloaderProvidesClass( \Automattic\Jetpack\AutoloaderTesting\Currentmu\UniqueTestClass::class );
	}

	/**
	 * Tests that the autoloader is able to add new plugins to the cache.
	 */
	public function test_autoloader_adds_new_plugins_to_cache() {
		// Cache only one of the plugins so that it won't be unknown.
		$this->cache_plugin( array( Test_Plugin_Factory::CURRENT ) );

		// Load and shutdown the autoloaders safely.
		$this->execute_autoloader_chain(
			array(
				self::CURRENT_MU,
				Test_Plugin_Factory::CURRENT,
			),
			true
		);

		// Make sure the autoloader worked as expected.
		$this->assertAutoloaderVersion( Test_Plugin_Factory::CURRENT );
		$this->assertAutoloaderResetCount( 0 );
		$this->assertAutoloaderFoundUnknown( self::CURRENT_MU );
		$this->assertAutoloaderCacheEquals( array( self::CURRENT_MU, Test_Plugin_Factory::CURRENT ) );
		$this->assertAutoloaderProvidesClass( \Automattic\Jetpack\AutoloaderTesting\SharedTestClass::class );

		$this->markTestIncomplete( 'The autoloader does not currently support PSR-4 loading from multiple directories.' );
		$this->assertAutoloaderProvidesClass( \Automattic\Jetpack\AutoloaderTesting\Current\UniqueTestClass::class );
		$this->assertAutoloaderProvidesClass( \Automattic\Jetpack\AutoloaderTesting\Currentmu\UniqueTestClass::class );
	}

	/**
	 * Tests that the autoloader resolves symlinks to plugins pulled from cache so that those environments can be handled correctly.
	 */
	public function test_autoloader_resolves_cached_symlinks() {
		$symlink_key = 'current_symlink';

		// Install the autoloader as a symlink so that we can execute it.
		$this->install_autoloader_symlink( Test_Plugin_Factory::CURRENT, false, $symlink_key );

		// Store the symlink in the cache so that we can make sure it is resolved correctly.
		$this->cache_plugin( $symlink_key );

		// Load and shutdown the autoloader safely.
		$this->load_plugin_autoloader( $symlink_key );
		$this->trigger_shutdown( true );

		// Make sure the autoloader worked as expected.
		$this->assertAutoloaderVersion( Test_Plugin_Factory::CURRENT );
		$this->assertAutoloaderResetCount( 0 );
		$this->assertAutoloaderNotFoundUnknown( $symlink_key );
		// The cache shouldn't get updated since nothing has technically changed.
		$this->assertAutoloaderCacheEquals( $symlink_key );
		$this->assertAutoloaderProvidesClass( \Automattic\Jetpack\AutoloaderTesting\Current\UniqueTestClass::class );
	}

	/**
	 * Tests that the autoloader does not cache plugins that are about to deactivate.
	 */
	public function test_autoloader_does_not_cache_deactivating_plugins() {
		// Store the plugin in the cache so that we can watch for removal.
		$this->cache_plugin( Test_Plugin_Factory::CURRENT );

		// Make sure that we're deactivating the plugin in the request.
		$_REQUEST['_wpnonce'] = '123abc';
		$_REQUEST['action']   = 'deactivate';
		$_REQUEST['plugin']   = Test_Plugin_Factory::CURRENT . '/' . Test_Plugin_Factory::CURRENT . '.php';

		// Load and shutdown the autoloader safely.
		$this->load_plugin_autoloader( Test_Plugin_Factory::CURRENT );
		$this->trigger_shutdown( true );

		// Make sure the autoloader worked as expected.
		$this->assertAutoloaderVersion( Test_Plugin_Factory::CURRENT );
		$this->assertAutoloaderResetCount( 0 );
		// Even though not active the plugin should be seen becasue of the request parameters.
		$this->assertAutoloaderNotFoundUnknown( Test_Plugin_Factory::CURRENT );
		// The cache should be empty since the deactivating plugin was removed.
		$this->assertAutoloaderCacheEmpty();
		$this->assertAutoloaderProvidesClass( \Automattic\Jetpack\AutoloaderTesting\Current\UniqueTestClass::class );
	}
}
