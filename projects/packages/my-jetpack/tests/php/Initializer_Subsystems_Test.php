<?php
/**
 * Test the per-subsystem Initializer init methods.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Boost_Speed_Score\Speed_Score_History;
use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;
use Automattic\Jetpack\ExPlat\REST_Controller as ExPlat_REST_Controller;
use Automattic\Jetpack\Licensing;
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
		unset( $GLOBALS['wp_rest_server'] );
	}

	/**
	 * Reset the Initializer's global state: subsystem marks, the my_jetpack_init
	 * action counter, the hooks the subsystem methods register, and the connection
	 * REST authentication singleton (WorDBless restores the hook globals between
	 * tests, but not that singleton, so without this reset a later
	 * `init_rest_api()` call could not reinstall the authentication filters).
	 */
	private static function reset_initializer_state() {
		$reflection = new \ReflectionProperty( Initializer::class, 'initialized_subsystems' );
		$reflection->setAccessible( true );
		$reflection->setValue( null, array() );

		$auth_instance = new \ReflectionProperty( Connection_Rest_Authentication::class, 'instance' );
		$auth_instance->setAccessible( true );
		$auth_instance->setValue( null, null );

		unset( $GLOBALS['wp_actions']['my_jetpack_init'] );

		remove_action( 'rest_api_init', array( Initializer::class, 'register_rest_endpoints' ) );
		remove_action( 'admin_menu', array( Initializer::class, 'add_my_jetpack_menu_item' ) );
		remove_action( 'admin_init', array( Initializer::class, 'setup_historically_active_jetpack_modules_sync' ) );
		remove_action( 'admin_menu', array( Initializer::class, 'maybe_show_red_bubble' ), 30 );
	}

	/**
	 * Read the connection REST authentication singleton without creating it.
	 *
	 * @return Connection_Rest_Authentication|false|null
	 */
	private static function get_rest_authentication_instance() {
		$reflection = new \ReflectionProperty( Connection_Rest_Authentication::class, 'instance' );
		$reflection->setAccessible( true );
		return $reflection->getValue();
	}

	/**
	 * init() wires every subsystem and fires my_jetpack_init exactly once.
	 */
	public function test_init_wires_subsystems_and_fires_action() {
		Initializer::init();

		// REST API.
		$this->assertNotFalse( has_action( 'rest_api_init', array( Initializer::class, 'register_rest_endpoints' ) ) );
		// Admin UI.
		$this->assertNotFalse( has_action( 'admin_menu', array( Initializer::class, 'add_my_jetpack_menu_item' ) ) );
		$this->assertNotFalse( has_action( 'admin_init', array( Initializer::class, 'setup_historically_active_jetpack_modules_sync' ) ) );
		$this->assertNotFalse( has_action( 'admin_menu', array( Initializer::class, 'maybe_show_red_bubble' ) ) );
		// Speed Score.
		$this->assertNotFalse( has_action( 'jetpack_boost_environment_changed', array( Speed_Score_History::class, 'mark_stale' ) ) );
		// Licensing.
		$this->assertNotFalse( has_action( 'jetpack_authorize_ending_authorized', array( Licensing::instance(), 'attach_stored_licenses_on_connection' ) ) );
		// ExPlat.
		$this->assertNotFalse( has_action( 'rest_api_init', array( ExPlat_REST_Controller::class, 'register' ) ) );
		$this->assertSame( 1, did_action( 'jetpack_explat_initialized' ) );
		// JITM.
		$this->assertNotFalse( has_action( 'rest_api_init', array( 'Automattic\Jetpack\JITMS\Rest_Api_Endpoints', 'register_endpoints' ) ) );
		// Jetpack Manage.
		$this->assertNotFalse( has_action( 'admin_menu', array( Jetpack_Manage::class, 'add_submenu_jetpack' ) ) );

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
	 * init_rest_api() registers the endpoints and installs both REST authentication filters.
	 */
	public function test_init_rest_api_alone() {
		Initializer::init_rest_api();

		$this->assertNotFalse( has_action( 'rest_api_init', array( Initializer::class, 'register_rest_endpoints' ) ) );

		$auth = self::get_rest_authentication_instance();
		$this->assertInstanceOf( Connection_Rest_Authentication::class, $auth );
		$this->assertNotFalse( has_filter( 'determine_current_user', array( $auth, 'wp_rest_authenticate' ) ) );
		$this->assertNotFalse( has_filter( 'rest_authentication_errors', array( $auth, 'wp_rest_authentication_errors' ) ) );

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

	/**
	 * After an eager init() earlier in the same process, a later deferred boot
	 * (init() hooked at rest_api_init priority 0, the way the Jetpack plugin
	 * defers My Jetpack on front-end requests) must still register the
	 * my-jetpack/v1 routes. Regression test for the one-shot marks being consumed
	 * by init() and surviving a my_jetpack_init reset.
	 */
	public function test_deferred_init_registers_routes_when_rest_api_init_fires() {
		Initializer::init();

		// Simulate the next request's deferred wiring within the same process.
		unset( $GLOBALS['wp_actions']['my_jetpack_init'] );
		remove_action( 'rest_api_init', array( Initializer::class, 'register_rest_endpoints' ) );
		add_action( 'rest_api_init', array( Initializer::class, 'init' ), 0 );

		$GLOBALS['wp_rest_server'] = new \WP_REST_Server();
		do_action( 'rest_api_init' );
		remove_action( 'rest_api_init', array( Initializer::class, 'init' ), 0 );

		$found = false;
		foreach ( array_keys( rest_get_server()->get_routes() ) as $route ) {
			if ( strpos( $route, '/my-jetpack/v1' ) === 0 ) {
				$found = true;
				break;
			}
		}
		$this->assertTrue( $found, 'Deferred init() did not register the my-jetpack/v1 routes.' );
	}
}
