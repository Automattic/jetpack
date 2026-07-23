<?php
/**
 * Test the per-subsystem Initializer init methods.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Boost_Speed_Score\Speed_Score;
use Automattic\Jetpack\Boost_Speed_Score\Speed_Score_History;
use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;
use Automattic\Jetpack\ExPlat\REST_Controller as ExPlat_REST_Controller;
use Automattic\Jetpack\Licensing;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use WorDBless\BaseTestCase;

/**
 * Tests for Initializer::init() and the individual init_* subsystem methods.
 */
class Initializer_Subsystems_Test extends BaseTestCase {
	/**
	 * _doing_it_wrong() calls captured during a test, as array( function_name, message ) pairs.
	 *
	 * @var array
	 */
	private $doing_it_wrong = array();

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
	 * Reset the Initializer's global state: subsystem marks, the init options skip
	 * set, the my_jetpack_init action counter, the hooks the subsystem methods
	 * register, and the connection REST authentication singleton and the Speed Score
	 * instance (WorDBless restores the hook globals between tests, but not those class
	 * statics, so without this reset a later `init_rest_api()` call could not reinstall
	 * the authentication filters and a later `init_speed_score()` call could not
	 * reinstall its hooks). Also clears the doing_it_wrong capture hooks so a leaked
	 * `__return_false` cannot mask a real _doing_it_wrong() notice in a later test.
	 */
	private static function reset_initializer_state() {
		$reflection = new \ReflectionProperty( Initializer::class, 'initialized_subsystems' );
		if ( PHP_VERSION_ID < 80100 ) {
			$reflection->setAccessible( true );
		}
		$reflection->setValue( null, array() );

		$init_options = new \ReflectionProperty( Initializer::class, 'init_options' );
		if ( PHP_VERSION_ID < 80100 ) {
			$init_options->setAccessible( true );
		}
		$init_options->setValue( null, array() );

		$speed_score = new \ReflectionProperty( Initializer::class, 'speed_score' );
		if ( PHP_VERSION_ID < 80100 ) {
			$speed_score->setAccessible( true );
		}
		$instance = $speed_score->getValue();
		if ( $instance instanceof Speed_Score ) {
			remove_action( 'rest_api_init', array( $instance, 'register_rest_routes' ) );
			remove_action( 'jetpack_boost_deactivate', array( $instance, 'clear_speed_score_request_cache' ) );
		}
		$speed_score->setValue( null, null );

		$auth_instance = new \ReflectionProperty( Connection_Rest_Authentication::class, 'instance' );
		if ( PHP_VERSION_ID < 80100 ) {
			$auth_instance->setAccessible( true );
		}
		$auth_instance->setValue( null, null );

		unset( $GLOBALS['wp_actions']['my_jetpack_init'] );

		remove_action( 'rest_api_init', array( Initializer::class, 'register_rest_endpoints' ) );
		remove_action( 'admin_menu', array( Initializer::class, 'add_my_jetpack_menu_item' ) );
		remove_action( 'admin_init', array( Initializer::class, 'setup_historically_active_jetpack_modules_sync' ) );
		remove_action( 'admin_menu', array( Initializer::class, 'maybe_show_red_bubble' ), 30 );

		// Jetpack Manage's admin_menu hook and Licensing's rest_api_init endpoint hook:
		// WorDBless restores every test to a single frozen hook snapshot taken at the
		// suite's first test, so in reverse/random order that baseline can already carry
		// these hooks from another class. Scrub them so the skip-list absence assertions
		// (and should_load_add_license_screen) start clean. Safe to re-add because both
		// Jetpack_Manage::init() and Licensing::initialize() are unconditional (no
		// did_action guard), unlike JITM/ExPlat.
		remove_action( 'admin_menu', array( Jetpack_Manage::class, 'add_submenu_jetpack' ) );
		remove_action( 'rest_api_init', array( Licensing::instance(), 'initialize_endpoints' ) );

		remove_all_filters( 'doing_it_wrong_trigger_error' );
		remove_all_actions( 'doing_it_wrong_run' );
	}

	/**
	 * Capture _doing_it_wrong() calls without tripping the suite's failOnWarning gate.
	 *
	 * WP core fires the doing_it_wrong_run action before it checks the
	 * doing_it_wrong_trigger_error filter, so suppressing the trigger with
	 * __return_false records the call without emitting a notice that would fail the test.
	 */
	private function capture_doing_it_wrong() {
		$this->doing_it_wrong = array();
		add_filter( 'doing_it_wrong_trigger_error', '__return_false' );
		add_action(
			'doing_it_wrong_run',
			function ( $function_name, $message ) {
				$this->doing_it_wrong[] = array( $function_name, $message );
			},
			10,
			2
		);
	}

	/**
	 * Read the connection REST authentication singleton without creating it.
	 *
	 * @return Connection_Rest_Authentication|false|null
	 */
	private static function get_rest_authentication_instance() {
		$reflection = new \ReflectionProperty( Connection_Rest_Authentication::class, 'instance' );
		if ( PHP_VERSION_ID < 80100 ) {
			$reflection->setAccessible( true );
		}
		return $reflection->getValue();
	}

	/**
	 * Count the Speed Score instances that registered their REST routes hook.
	 *
	 * Other test classes can leave a Speed Score of their own behind, so the tests
	 * below compare against the count they start with rather than against zero.
	 *
	 * @return int
	 */
	private static function count_speed_score_instances() {
		if ( ! isset( $GLOBALS['wp_filter']['rest_api_init'] ) ) {
			return 0;
		}

		$count = 0;
		foreach ( $GLOBALS['wp_filter']['rest_api_init']->callbacks as $priority_callbacks ) {
			foreach ( $priority_callbacks as $callback ) {
				if ( is_array( $callback['function'] )
					&& $callback['function'][0] instanceof Speed_Score
					&& 'register_rest_routes' === $callback['function'][1]
				) {
					++$count;
				}
			}
		}

		return $count;
	}

	/**
	 * The init() method wires every subsystem and fires my_jetpack_init exactly once.
	 */
	public function test_init_wires_subsystems_and_fires_action() {
		Initializer::init();

		// Plugins action links.
		$this->assertNotFalse( has_filter( 'plugin_action_links_jetpack/jetpack.php', array( Product::class, 'get_plugin_actions_links' ) ) );
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
	 * The init_admin_ui() method wires only the admin surfaces and does not fire my_jetpack_init.
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
	 * The init_rest_api() method registers the endpoints and installs both REST authentication filters.
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
	 * Every init_* wrapper is a no-op when the site is ineligible: each returns at its
	 * should_initialize() guard without wiring anything or firing my_jetpack_init, and
	 * without consuming its one-shot mark (so a later eligible call still boots it).
	 * Exercises the guard return in all eight wrappers.
	 */
	public function test_wrappers_are_no_ops_when_ineligible() {
		add_filter( 'jetpack_my_jetpack_should_initialize', '__return_false' );

		Initializer::init_plugins_action_links();
		Initializer::init_rest_api();
		Initializer::init_licensing();
		Initializer::init_speed_score();
		Initializer::init_admin_ui();
		Initializer::init_explat();
		Initializer::init_jitm();
		Initializer::init_jetpack_manage();

		remove_filter( 'jetpack_my_jetpack_should_initialize', '__return_false' );

		$this->assertSame( 0, did_action( 'my_jetpack_init' ) );

		// No mark was consumed: a later eligible individual call still boots (order-safe delta).
		$before = self::count_speed_score_instances();
		Initializer::init_speed_score();
		$this->assertSame( $before + 1, self::count_speed_score_instances() );
	}

	/**
	 * Speed Score hooks itself as an object, so WordPress cannot deduplicate a second
	 * instance. Mixing init_speed_score() with init() must still leave one instance.
	 */
	public function test_speed_score_set_up_once_when_individual_call_comes_first() {
		$before = self::count_speed_score_instances();

		Initializer::init_speed_score();
		$this->assertSame( $before + 1, self::count_speed_score_instances() );
		// The individual wrapper must not fire the aggregate lifecycle action.
		$this->assertSame( 0, did_action( 'my_jetpack_init' ) );

		Initializer::init();
		$this->assertSame( $before + 1, self::count_speed_score_instances() );
		// The aggregate call still wires representative work and fires its action once.
		$this->assertNotFalse( has_action( 'rest_api_init', array( Initializer::class, 'register_rest_endpoints' ) ) );
		$this->assertSame( 1, did_action( 'my_jetpack_init' ) );
	}

	/**
	 * The same, with the calls the other way round: init() first, then the individual method.
	 */
	public function test_speed_score_set_up_once_when_init_comes_first() {
		$before = self::count_speed_score_instances();

		Initializer::init();
		$this->assertSame( $before + 1, self::count_speed_score_instances() );

		Initializer::init_speed_score();
		$this->assertSame( $before + 1, self::count_speed_score_instances() );
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
	 * my-jetpack/v1 routes on a real WP_REST_Server. Regression test for the
	 * one-shot marks being consumed by init() and surviving a my_jetpack_init reset.
	 *
	 * Also covers update_init_options(): a skip list set before the eager init()
	 * keeps the skipped subsystems unbooted across the deferred rest_api_init:0
	 * boot, while skipping jetpack_manage still leaves its REST route in place,
	 * because the always-on rest_api loader registers it.
	 */
	public function test_deferred_init_registers_routes_when_rest_api_init_fires() {
		Initializer::update_init_options( array( 'skip' => array( 'jetpack_manage', 'speed_score' ) ) );
		$speed_score_before = self::count_speed_score_instances();

		Initializer::init();

		// Simulate the next request's deferred wiring within the same process.
		unset( $GLOBALS['wp_actions']['my_jetpack_init'] );
		remove_action( 'rest_api_init', array( Initializer::class, 'register_rest_endpoints' ) );
		add_action( 'rest_api_init', array( Initializer::class, 'init' ), 0 );

		$GLOBALS['wp_rest_server'] = new \WP_REST_Server();
		do_action( 'rest_api_init' );
		remove_action( 'rest_api_init', array( Initializer::class, 'init' ), 0 );

		$routes = rest_get_server()->get_routes();
		$found  = false;
		foreach ( array_keys( $routes ) as $route ) {
			if ( strpos( $route, '/my-jetpack/v1' ) === 0 ) {
				$found = true;
				break;
			}
		}
		$this->assertTrue( $found, 'Deferred init() did not register the my-jetpack/v1 routes.' );

		// The skip list held on the rest_api_init:0 deferred path: the skipped
		// subsystems stayed unbooted...
		$this->assertFalse( has_action( 'admin_menu', array( Jetpack_Manage::class, 'add_submenu_jetpack' ) ) );
		$this->assertSame( $speed_score_before, self::count_speed_score_instances() );

		// ...while skipping jetpack_manage left its REST route in place, because the
		// always-on rest_api loader registers it via Initializer::register_rest_endpoints().
		$this->assertArrayHasKey( '/my-jetpack/v1/jetpack-manage/data', $routes );
	}

	/**
	 * With no skip configured, update_init_options() is a no-op: empty options, an
	 * empty skip list, and an unrelated top-level key each record nothing and skip
	 * nothing.
	 */
	public function test_update_init_options_without_skips_is_a_noop() {
		$this->capture_doing_it_wrong();

		Initializer::update_init_options( array() );
		Initializer::update_init_options( array( 'skip' => array() ) );
		Initializer::update_init_options( array( 'unrelated' => true ) );

		$this->assertSame( array(), $this->doing_it_wrong );
		foreach ( array( 'licensing', 'speed_score', 'explat', 'jitm', 'jetpack_manage' ) as $subsystem ) {
			$this->assertFalse( Initializer::is_subsystem_skipped( $subsystem ) );
		}
	}

	/**
	 * Skips union across calls: two separate update_init_options() calls each add
	 * their key, and neither clobbers the other. init() then boots neither.
	 *
	 * Uses jetpack_manage and speed_score because both have order-safe "did init()
	 * boot it" observables (a scrubbed guard-free hook and the Speed Score instance
	 * count); the guarded jitm/explat hooks are covered per-subsystem by
	 * test_init_with_skip_boots_everything_except_the_skipped_subsystem in a fresh process.
	 */
	public function test_update_init_options_unions_across_calls() {
		$this->capture_doing_it_wrong();

		Initializer::update_init_options( array( 'skip' => array( 'jetpack_manage' ) ) );
		Initializer::update_init_options( array( 'skip' => array( 'speed_score' ) ) );

		$this->assertTrue( Initializer::is_subsystem_skipped( 'jetpack_manage' ) );
		$this->assertTrue( Initializer::is_subsystem_skipped( 'speed_score' ) );

		$before = self::count_speed_score_instances();
		Initializer::init();

		$this->assertFalse( has_action( 'admin_menu', array( Jetpack_Manage::class, 'add_submenu_jetpack' ) ) );
		$this->assertSame( $before, self::count_speed_score_instances() );
		// rest_api is always-on: an order-safe positive check that init() still ran.
		$this->assertNotFalse( has_action( 'rest_api_init', array( Initializer::class, 'register_rest_endpoints' ) ) );
		$this->assertSame( 1, did_action( 'my_jetpack_init' ) );
		$this->assertSame( array(), $this->doing_it_wrong );
	}

	/**
	 * A protected key and an unknown key are both rejected with _doing_it_wrong()
	 * and left out of the skip set, while a valid key in the same call is still
	 * recorded. The rejected protected subsystem still boots.
	 */
	public function test_update_init_options_rejects_protected_and_unknown_keys() {
		$this->capture_doing_it_wrong();

		Initializer::update_init_options( array( 'skip' => array( 'rest_api', 'nonexistent', 'jitm' ) ) );

		$this->assertCount( 2, $this->doing_it_wrong );
		$this->assertSame( 'Automattic\Jetpack\My_Jetpack\Initializer::update_init_options', $this->doing_it_wrong[0][0] );
		$this->assertSame( 'Automattic\Jetpack\My_Jetpack\Initializer::update_init_options', $this->doing_it_wrong[1][0] );
		$this->assertStringContainsString( 'rest_api', $this->doing_it_wrong[0][1] );
		$this->assertStringContainsString( 'nonexistent', $this->doing_it_wrong[1][1] );

		$this->assertFalse( Initializer::is_subsystem_skipped( 'rest_api' ) );
		$this->assertFalse( Initializer::is_subsystem_skipped( 'nonexistent' ) );
		$this->assertTrue( Initializer::is_subsystem_skipped( 'jitm' ) );

		Initializer::init();
		$this->assertNotFalse( has_action( 'rest_api_init', array( Initializer::class, 'register_rest_endpoints' ) ) );
	}

	/**
	 * A non-array skip option is rejected with _doing_it_wrong() and records no skips.
	 */
	public function test_update_init_options_rejects_non_array_skip() {
		$this->capture_doing_it_wrong();

		Initializer::update_init_options( array( 'skip' => 'jitm' ) );

		$this->assertCount( 1, $this->doing_it_wrong );
		$this->assertFalse( Initializer::is_subsystem_skipped( 'jitm' ) );
	}

	/**
	 * An explicit null skip is a malformed value, not an omission: it is rejected with
	 * _doing_it_wrong() like any other non-array skip, rather than silently doing nothing.
	 */
	public function test_update_init_options_rejects_null_skip() {
		$this->capture_doing_it_wrong();

		Initializer::update_init_options( array( 'skip' => null ) );

		$this->assertCount( 1, $this->doing_it_wrong );
	}

	/**
	 * Calling update_init_options() with a skip list after init() has run warns via
	 * _doing_it_wrong(), but still records the key (recorded-but-ineffective).
	 */
	public function test_update_init_options_after_init_warns() {
		Initializer::init();

		$this->capture_doing_it_wrong();
		Initializer::update_init_options( array( 'skip' => array( 'jitm' ) ) );

		$this->assertCount( 1, $this->doing_it_wrong );
		$this->assertStringContainsString( 'already initialized', $this->doing_it_wrong[0][1] );
		$this->assertTrue( Initializer::is_subsystem_skipped( 'jitm' ) );
	}

	/**
	 * A subsystem skipped by init() stays independently bootable through its own
	 * init_* wrapper: init() leaves its one-shot mark untouched, and the wrapper
	 * ignores the skip list.
	 */
	public function test_skipped_subsystem_remains_initializable_via_wrapper() {
		Initializer::update_init_options( array( 'skip' => array( 'jetpack_manage', 'speed_score' ) ) );
		$before = self::count_speed_score_instances();

		Initializer::init();
		$this->assertFalse( has_action( 'admin_menu', array( Jetpack_Manage::class, 'add_submenu_jetpack' ) ) );
		$this->assertSame( $before, self::count_speed_score_instances() );
		$this->assertSame( 1, did_action( 'my_jetpack_init' ) );

		Initializer::init_jetpack_manage();
		$this->assertNotFalse( has_action( 'admin_menu', array( Jetpack_Manage::class, 'add_submenu_jetpack' ) ) );

		Initializer::init_speed_score();
		$this->assertSame( $before + 1, self::count_speed_score_instances() );
	}

	/**
	 * When licensing boots normally, the Add License screen is advertised, because the
	 * licensing REST endpoints its fetches call are registered.
	 */
	public function test_add_license_screen_advertised_when_licensing_booted() {
		Initializer::init();

		$this->assertTrue( Initializer::should_load_add_license_screen() );
	}

	/**
	 * When licensing is skipped, the Add License screen is not advertised: its REST
	 * endpoints were never registered, so advertising it would produce 404s. Guards
	 * against reintroducing the UI/REST mismatch the skip list can otherwise create.
	 */
	public function test_add_license_screen_hidden_when_licensing_skipped() {
		Initializer::update_init_options( array( 'skip' => array( 'licensing' ) ) );
		Initializer::init();

		$this->assertFalse( has_action( 'rest_api_init', array( Licensing::instance(), 'initialize_endpoints' ) ) );
		$this->assertFalse( Initializer::should_load_add_license_screen() );
	}

	/**
	 * The Add License gate keys on actual route availability, not on the skip flag: a
	 * consumer that skips My Jetpack's licensing boot but has Licensing initialized
	 * independently (as the Jetpack plugin does) still advertises the screen.
	 */
	public function test_add_license_screen_advertised_when_licensing_initialized_independently() {
		Initializer::update_init_options( array( 'skip' => array( 'licensing' ) ) );
		Initializer::init();
		$this->assertFalse( Initializer::should_load_add_license_screen() );

		// Simulate the Jetpack plugin's independent Licensing::initialize().
		Licensing::instance()->initialize();

		$this->assertTrue( Initializer::should_load_add_license_screen() );
	}

	/**
	 * Each subsystem the five thin gate-and-delegate wrappers own, keyed by the wrapper's
	 * subsystem key. The `init` callable is the public wrapper; the `check` closure returns
	 * the has_action()/has_filter() result for that subsystem's distinctive hook. Shared by
	 * the mapping test and its data provider so the two never drift.
	 *
	 * @return array<string, array{init: callable, check: callable}>
	 */
	private static function thin_wrapper_cases() {
		return array(
			'plugins_action_links' => array(
				'init'  => array( Initializer::class, 'init_plugins_action_links' ),
				'check' => static function () {
					return has_filter( 'plugin_action_links_jetpack/jetpack.php', array( Product::class, 'get_plugin_actions_links' ) );
				},
			),
			'licensing'            => array(
				'init'  => array( Initializer::class, 'init_licensing' ),
				'check' => static function () {
					return has_action( 'jetpack_authorize_ending_authorized', array( Licensing::instance(), 'attach_stored_licenses_on_connection' ) );
				},
			),
			'explat'               => array(
				'init'  => array( Initializer::class, 'init_explat' ),
				'check' => static function () {
					return has_action( 'rest_api_init', array( ExPlat_REST_Controller::class, 'register' ) );
				},
			),
			'jitm'                 => array(
				'init'  => array( Initializer::class, 'init_jitm' ),
				'check' => static function () {
					return has_action( 'rest_api_init', array( 'Automattic\Jetpack\JITMS\Rest_Api_Endpoints', 'register_endpoints' ) );
				},
			),
			'jetpack_manage'       => array(
				'init'  => array( Initializer::class, 'init_jetpack_manage' ),
				'check' => static function () {
					return has_action( 'admin_menu', array( Jetpack_Manage::class, 'add_submenu_jetpack' ) );
				},
			),
		);
	}

	/**
	 * One serializable subsystem key per thin wrapper. Data-provider values must be
	 * serializable, so this yields the keys only; the test rebuilds the callables from
	 * thin_wrapper_cases().
	 *
	 * @return array<string, array{0: string}>
	 */
	public static function thin_wrapper_provider() {
		$data = array();
		foreach ( array_keys( self::thin_wrapper_cases() ) as $subsystem ) {
			$data[ $subsystem ] = array( $subsystem );
		}
		return $data;
	}

	/**
	 * Each of the five thin gate-and-delegate wrappers must wire its own subsystem and
	 * nothing else. init() calls the private load_*() bodies directly, so the public
	 * wrapper-to-loader mapping for these five is otherwise never exercised: a copy/paste
	 * bug such as init_explat() delegating to load_jitm() would pass the whole suite.
	 *
	 * Runs one fresh process per case (data provider + separate process) for two reasons.
	 * First, isolation from other classes: a prior test class's Initializer::init() leaks a
	 * priority-20 plugin_action_links filter and trips the ExPlat/JITM did_action() guards
	 * into process-wide state that reset_initializer_state() cannot clean, which is why an
	 * in-process version of this test failed under reverse/random ordering. Second, isolation
	 * between cases: because each wrapper runs alone in a pristine process, the test can assert
	 * that every *other* subsystem's hook stays absent -- catching a wrapper that wires its own
	 * subsystem plus an extra one (e.g. init_jetpack_manage() also calling load_explat()), which
	 * a single shared process cannot detect once an earlier case has registered that hook.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 * @dataProvider thin_wrapper_provider
	 *
	 * @param string $subsystem Subsystem key under test.
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	#[DataProvider( 'thin_wrapper_provider' )]
	public function test_thin_wrapper_wires_only_its_own_subsystem( $subsystem ) {
		$cases = self::thin_wrapper_cases();

		// Fresh process: every subsystem hook starts absent.
		foreach ( $cases as $name => $case ) {
			$this->assertFalse( $case['check'](), "init_$subsystem: the $name hook was present before any wrapper ran." );
		}

		call_user_func( $cases[ $subsystem ]['init'] );

		// Exactly the target subsystem is wired; every other one stays absent.
		foreach ( $cases as $name => $case ) {
			if ( $name === $subsystem ) {
				$this->assertNotFalse( $case['check'](), "init_$subsystem: did not wire its own subsystem." );
			} else {
				$this->assertFalse( $case['check'](), "init_$subsystem: must not wire the $name subsystem." );
			}
		}

		$this->assertSame( 0, did_action( 'my_jetpack_init' ), "init_$subsystem: must not fire my_jetpack_init." );
	}

	/**
	 * Each skippable subsystem, keyed by its skip-list key, with a closure that reports
	 * whether that subsystem booted (its distinctive hook / instance is present). Shared
	 * by the skip-matrix test and its data provider so the two never drift.
	 *
	 * @return array<string, callable>
	 */
	private static function skippable_subsystem_cases() {
		return array(
			'licensing'      => static function () {
				return false !== has_action( 'jetpack_authorize_ending_authorized', array( Licensing::instance(), 'attach_stored_licenses_on_connection' ) );
			},
			'speed_score'    => static function () {
				return self::count_speed_score_instances() > 0;
			},
			'explat'         => static function () {
				return false !== has_action( 'rest_api_init', array( ExPlat_REST_Controller::class, 'register' ) );
			},
			'jitm'           => static function () {
				return false !== has_action( 'rest_api_init', array( 'Automattic\Jetpack\JITMS\Rest_Api_Endpoints', 'register_endpoints' ) );
			},
			'jetpack_manage' => static function () {
				return false !== has_action( 'admin_menu', array( Jetpack_Manage::class, 'add_submenu_jetpack' ) );
			},
		);
	}

	/**
	 * One serializable skippable-subsystem key per case. Data-provider values must be
	 * serializable, so this yields the keys only; the test rebuilds the closures from
	 * skippable_subsystem_cases().
	 *
	 * @return array<string, array{0: string}>
	 */
	public static function skippable_subsystem_provider() {
		$data = array();
		foreach ( array_keys( self::skippable_subsystem_cases() ) as $subsystem ) {
			$data[ $subsystem ] = array( $subsystem );
		}
		return $data;
	}

	/**
	 * With a single subsystem in the skip list, init() boots every other subsystem but
	 * that one, always boots the three protected subsystems, and still fires
	 * my_jetpack_init once.
	 *
	 * Runs one fresh process per case (data provider + separate process): a pristine hook
	 * table makes the positive "the other four booted" assertions trustworthy despite the
	 * process-wide did_action() guards and the leaked plugin_action_links filter that make
	 * in-process positive cross-subsystem assertions order-fragile (see
	 * test_thin_wrapper_wires_only_its_own_subsystem).
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 * @dataProvider skippable_subsystem_provider
	 *
	 * @param string $subsystem Skippable subsystem key under test.
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	#[DataProvider( 'skippable_subsystem_provider' )]
	public function test_init_with_skip_boots_everything_except_the_skipped_subsystem( $subsystem ) {
		$cases = self::skippable_subsystem_cases();

		Initializer::update_init_options( array( 'skip' => array( $subsystem ) ) );
		Initializer::init();

		foreach ( $cases as $name => $is_booted ) {
			if ( $name === $subsystem ) {
				$this->assertFalse( $is_booted(), "Skipping $subsystem should leave it unbooted." );
			} else {
				$this->assertTrue( $is_booted(), "Skipping $subsystem must not stop $name from booting." );
			}
		}

		// The three protected subsystems always boot.
		$this->assertNotFalse( has_filter( 'plugin_action_links_jetpack/jetpack.php', array( Product::class, 'get_plugin_actions_links' ) ), "Skipping $subsystem must not stop plugins_action_links from booting." );
		$this->assertNotFalse( has_action( 'rest_api_init', array( Initializer::class, 'register_rest_endpoints' ) ), "Skipping $subsystem must not stop rest_api from booting." );
		$this->assertNotFalse( has_action( 'admin_menu', array( Initializer::class, 'add_my_jetpack_menu_item' ) ), "Skipping $subsystem must not stop admin_ui from booting." );

		$this->assertSame( 1, did_action( 'my_jetpack_init' ), "Skipping $subsystem must still fire my_jetpack_init once." );
	}
}
