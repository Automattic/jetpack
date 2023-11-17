<?php
/**
 * Acceptance test suite for the current autoloader.
 *
 * @package automattic/jetpack-autoloader
 */

/**
 * Test suite class for verifying the functionality of the current autoloader.
 *
 * @runTestsInSeparateProcesses Ensure each test has a fresh process as if it was a real request.
 * @preserveGlobalState disabled
 */
class AutoloaderTest extends Acceptance_Test_Case {

	/**
	 * Tests that the autoloader works properly in the standard case.
	 */
	public function test_autoloader_as_active_plugin() {
		// Activate the current autoloader so it won't be unknown.
		$this->activate_autoloader( Test_Plugin_Factory::CURRENT );

		// Load and shutdown the autoloader safely.
		$this->load_plugin_autoloader( Test_Plugin_Factory::CURRENT );
		$this->trigger_shutdown( true );

		// Make sure the autoloader worked as expected.
		$this->assertAutoloaderVersion( Test_Plugin_Factory::CURRENT );
		$this->assertAutoloaderResetCount( 0 );
		$this->assertAutoloaderNotFoundUnknown( Test_Plugin_Factory::CURRENT );
		$this->assertAutoloaderCacheEquals( Test_Plugin_Factory::CURRENT );
		$this->assertAutoloaderProvidesClass( \Automattic\Jetpack\AutoloaderTesting\Current\UniqueTestClass::class );
	}

	/**
	 * Tests that the autoloader works properly as an mu-plugin.
	 */
	public function test_autoloader_as_mu_plugin() {
		// Load and shutdown the autoloader safely.
		$this->load_plugin_autoloader( self::CURRENT_MU );
		$this->trigger_shutdown( true );

		// Make sure the autoloader worked as expected.
		$this->assertAutoloaderVersion( self::CURRENT_MU );
		$this->assertAutoloaderResetCount( 0 );
		$this->assertAutoloaderFoundUnknown( self::CURRENT_MU );
		$this->assertAutoloaderCacheEquals( self::CURRENT_MU );
		$this->assertAutoloaderProvidesClass( \Automattic\Jetpack\AutoloaderTesting\Currentmu\UniqueTestClass::class );
	}

	/**
	 * Tests that the autoloader does not reset when all of the plugins are known during initialization.
	 */
	public function test_autoloader_does_not_reset_when_all_plugins_are_known() {
		// Activate the current autoloader so that the mu-plugin autoloader can see it.
		$this->activate_autoloader( Test_Plugin_Factory::CURRENT );

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
	 * Tests that the autoloader resets when it encounters unknown plugins.
	 */
	public function test_autoloader_resets_when_plugins_are_unknown() {
		// Do not activate any plugins so that all are considered unknown.

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
		$this->assertAutoloaderResetCount( 1 );
		$this->assertAutoloaderFoundUnknown( self::CURRENT_MU );
		$this->assertAutoloaderCacheEquals( array( self::CURRENT_MU, Test_Plugin_Factory::CURRENT ) );
		$this->assertAutoloaderProvidesClass( \Automattic\Jetpack\AutoloaderTesting\SharedTestClass::class );

		$this->markTestIncomplete( 'The autoloader does not currently support PSR-4 loading from multiple directories.' );
		$this->assertAutoloaderProvidesClass( \Automattic\Jetpack\AutoloaderTesting\Current\UniqueTestClass::class );
		$this->assertAutoloaderProvidesClass( \Automattic\Jetpack\AutoloaderTesting\Currentmu\UniqueTestClass::class );
	}

	/**
	 * Tests that the autoloader resolves symlinks to plugins so that those environments can be handled correctly.
	 */
	public function test_autoloader_resolves_symlinks() {
		$symlink_key = 'current_symlink';

		// Install the autoloader as a symlink so that we can execute it.
		$this->install_autoloader_symlink( Test_Plugin_Factory::CURRENT, false, $symlink_key );

		// Activate the symlink autoloader so it won't be unknown.
		$this->activate_autoloader( $symlink_key );

		// Load and shutdown the autoloader safely.
		$this->load_plugin_autoloader( $symlink_key );
		$this->trigger_shutdown( true );

		// Make sure the autoloader worked as expected.
		$this->assertAutoloaderVersion( Test_Plugin_Factory::CURRENT );
		$this->assertAutoloaderResetCount( 0 );
		$this->assertAutoloaderNotFoundUnknown( $symlink_key );
		// The symlink is stored in the cache resolved to the original directory.
		$this->assertAutoloaderCacheEquals( Test_Plugin_Factory::CURRENT );
		$this->assertAutoloaderProvidesClass( \Automattic\Jetpack\AutoloaderTesting\Current\UniqueTestClass::class );
	}
}
