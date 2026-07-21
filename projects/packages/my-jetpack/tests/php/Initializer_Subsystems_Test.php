<?php
/**
 * Test the per-subsystem Initializer init methods.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use WorDBless\BaseTestCase;

/**
 * Tests for Initializer::init() and the individual init_* subsystem methods.
 */
class Initializer_Subsystems_Test extends BaseTestCase {
	/**
	 * Set up before each test: reset subsystem marks, the init action, and hooks.
	 */
	public function set_up() {
		self::reset_initializer_state();
	}

	/**
	 * Tear down after each test, so later test classes see a pristine Initializer.
	 */
	public function tear_down() {
		self::reset_initializer_state();
	}

	/**
	 * Reset the Initializer's global state: subsystem marks, the my_jetpack_init
	 * action counter, and the hooks the subsystem methods register.
	 */
	private static function reset_initializer_state() {
		$reflection = new \ReflectionProperty( Initializer::class, 'initialized_subsystems' );
		$reflection->setAccessible( true );
		$reflection->setValue( null, array() );

		unset( $GLOBALS['wp_actions']['my_jetpack_init'] );

		remove_action( 'rest_api_init', array( Initializer::class, 'register_rest_endpoints' ) );
		remove_action( 'admin_menu', array( Initializer::class, 'add_my_jetpack_menu_item' ) );
		remove_action( 'admin_init', array( Initializer::class, 'setup_historically_active_jetpack_modules_sync' ) );
		remove_action( 'admin_menu', array( Initializer::class, 'maybe_show_red_bubble' ), 30 );
	}

	/**
	 * init() wires the subsystem hooks and fires my_jetpack_init exactly once.
	 */
	public function test_init_wires_subsystems_and_fires_action() {
		Initializer::init();

		$this->assertNotFalse( has_action( 'rest_api_init', array( Initializer::class, 'register_rest_endpoints' ) ) );
		$this->assertNotFalse( has_action( 'admin_menu', array( Initializer::class, 'add_my_jetpack_menu_item' ) ) );
		$this->assertNotFalse( has_action( 'admin_init', array( Initializer::class, 'setup_historically_active_jetpack_modules_sync' ) ) );
		$this->assertNotFalse( has_action( 'admin_menu', array( Initializer::class, 'maybe_show_red_bubble' ) ) );
		$this->assertSame( 1, did_action( 'my_jetpack_init' ) );

		Initializer::init();
		$this->assertSame( 1, did_action( 'my_jetpack_init' ) );
	}

	/**
	 * init_admin_ui() wires only the admin surfaces and does not fire my_jetpack_init.
	 */
	public function test_init_admin_ui_alone() {
		Initializer::init_admin_ui();

		$this->assertNotFalse( has_action( 'admin_menu', array( Initializer::class, 'add_my_jetpack_menu_item' ) ) );
		$this->assertNotFalse( has_action( 'admin_init', array( Initializer::class, 'setup_historically_active_jetpack_modules_sync' ) ) );
		$this->assertNotFalse( has_action( 'admin_menu', array( Initializer::class, 'maybe_show_red_bubble' ) ) );
		$this->assertFalse( has_action( 'rest_api_init', array( Initializer::class, 'register_rest_endpoints' ) ) );
		$this->assertSame( 0, did_action( 'my_jetpack_init' ) );
	}

	/**
	 * init_rest_api() wires only the REST endpoint registration.
	 */
	public function test_init_rest_api_alone() {
		Initializer::init_rest_api();

		$this->assertNotFalse( has_action( 'rest_api_init', array( Initializer::class, 'register_rest_endpoints' ) ) );
		$this->assertFalse( has_action( 'admin_menu', array( Initializer::class, 'add_my_jetpack_menu_item' ) ) );
		$this->assertSame( 0, did_action( 'my_jetpack_init' ) );
	}

	/**
	 * A subsystem method only takes effect on its first call.
	 */
	public function test_individual_methods_run_once() {
		Initializer::init_admin_ui();
		remove_action( 'admin_menu', array( Initializer::class, 'add_my_jetpack_menu_item' ) );

		Initializer::init_admin_ui();
		$this->assertFalse( has_action( 'admin_menu', array( Initializer::class, 'add_my_jetpack_menu_item' ) ) );
	}

	/**
	 * The jetpack_my_jetpack_should_initialize filter also gates the individual methods,
	 * and a blocked call does not consume the subsystem's one-shot mark.
	 */
	public function test_should_initialize_filter_blocks_individual_init() {
		add_filter( 'jetpack_my_jetpack_should_initialize', '__return_false' );
		Initializer::init_admin_ui();
		remove_filter( 'jetpack_my_jetpack_should_initialize', '__return_false' );

		$this->assertFalse( has_action( 'admin_menu', array( Initializer::class, 'add_my_jetpack_menu_item' ) ) );

		Initializer::init_admin_ui();
		$this->assertNotFalse( has_action( 'admin_menu', array( Initializer::class, 'add_my_jetpack_menu_item' ) ) );
	}

	/**
	 * Calling init() after an individual subsystem was initialized still wires
	 * the remaining subsystems and fires my_jetpack_init.
	 */
	public function test_init_after_individual_init() {
		Initializer::init_rest_api();
		Initializer::init();

		$this->assertNotFalse( has_action( 'rest_api_init', array( Initializer::class, 'register_rest_endpoints' ) ) );
		$this->assertNotFalse( has_action( 'admin_menu', array( Initializer::class, 'add_my_jetpack_menu_item' ) ) );
		$this->assertSame( 1, did_action( 'my_jetpack_init' ) );
	}
}
