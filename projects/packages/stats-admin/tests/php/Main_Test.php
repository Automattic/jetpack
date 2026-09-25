<?php
namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Stats_Admin\TestCase as Stats_TestCase;
use ReflectionProperty;

/**
 * Unit tests for the Main class.
 *
 * @package automattic/jetpack-stats-admin
 */
class Main_Test extends Stats_TestCase {
	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();
		$this->reset_dashboard_registration();
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		$this->reset_dashboard_registration();
		parent::tearDown();
	}

	/**
	 * A connected site gets its Stats menu from the Jetpack plugin's stats module.
	 */
	public function test_leaves_the_dashboard_alone_when_connected() {
		Main::init();

		$this->assertFalse( has_action( 'admin_menu' ) );
	}

	/**
	 * Modules do not load before the site is connected, so nothing else would register the menu.
	 */
	public function test_registers_the_dashboard_when_not_connected() {
		$this->disconnect_site();

		Main::init();

		$this->assertTrue( has_action( 'admin_menu' ) );
	}

	/**
	 * `Main` and `Dashboard` both hold static state, and hooks an earlier test added survive in
	 * `$wp_filter`, so a test only sees what it registered itself if the run starts clean.
	 */
	private function reset_dashboard_registration() {
		remove_all_actions( 'admin_menu' );
		$this->set_static_property( Main::class, 'instance', null );
		$this->set_static_property( Dashboard::class, 'initialized', false );
	}

	/**
	 * Set a private static property.
	 *
	 * @param string $class_name The class holding the property.
	 * @param string $name       The property name.
	 * @param mixed  $value      The value to set.
	 */
	private function set_static_property( $class_name, $name, $value ) {
		$property = new ReflectionProperty( $class_name, $name );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, $value );
	}
}
