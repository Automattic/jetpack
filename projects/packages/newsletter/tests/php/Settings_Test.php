<?php
/**
 * Tests for the Settings class.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter\Tests;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Newsletter\Settings;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Test class for Settings.
 *
 * @covers \Automattic\Jetpack\Newsletter\Settings
 */
#[CoversClass( Settings::class )]
class Settings_Test extends BaseTestCase {

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();

		// Reset the static initialized flag between tests.
		$reflection = new \ReflectionClass( Settings::class );
		$property   = $reflection->getProperty( 'initialized' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, false );

		// Clear any existing hooks.
		remove_all_actions( 'admin_menu' );
		remove_all_actions( 'admin_init' );
		remove_all_filters( 'jetpack_module_configuration_url_subscriptions' );
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		\Jetpack_Options::delete_option( 'id' );
		\Jetpack_Options::delete_option( 'blog_token' );
		( new Connection_Manager() )->reset_connection_status();

		parent::tear_down();
	}

	/**
	 * Test that init_hooks does not register the admin_menu action when the site is not connected.
	 */
	public function test_init_hooks_does_not_register_admin_menu_when_not_connected() {
		// Ensure disconnected state.
		\Jetpack_Options::delete_option( 'id' );
		\Jetpack_Options::delete_option( 'blog_token' );
		( new Connection_Manager() )->reset_connection_status();

		$settings = new Settings();
		$settings->init_hooks();

		$this->assertFalse(
			has_action( 'admin_menu', array( $settings, 'add_wp_admin_menu' ) ),
			'admin_menu action should not be registered when site is not connected'
		);
	}

	/**
	 * Test that init_hooks registers the admin_menu action when the site is connected.
	 */
	public function test_init_hooks_registers_admin_menu_when_connected() {
		// Simulate connected state.
		\Jetpack_Options::update_option( 'id', 1234 );
		\Jetpack_Options::update_option( 'blog_token', 'test_token.secret' );
		( new Connection_Manager() )->reset_connection_status();

		$settings = new Settings();
		$settings->init_hooks();

		$this->assertSame(
			999,
			has_action( 'admin_menu', array( $settings, 'add_wp_admin_menu' ) ),
			'admin_menu action should be registered at priority 999 when site is connected'
		);
	}
}
