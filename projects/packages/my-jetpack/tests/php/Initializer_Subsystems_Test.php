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
	 * REST authentication singleton and the Speed Score instance (WorDBless restores
	 * the hook globals between tests, but not those class statics, so without this
	 * reset a later `init_rest_api()` call could not reinstall the authentication
	 * filters and a later `init_speed_score()` call could not reinstall its hooks).
	 */
	private static function reset_initializer_state() {
		$reflection = new \ReflectionProperty( Initializer::class, 'initialized_subsystems' );
		if ( PHP_VERSION_ID < 80100 ) {
			$reflection->setAccessible( true );
		}
		$reflection->setValue( null, array() );

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
	 * Speed Score hooks itself as an object, so WordPress cannot deduplicate a second
	 * instance. Mixing init_speed_score() with init() must still leave one instance.
	 */
	public function test_speed_score_set_up_once_when_individual_call_comes_first() {
		$before = self::count_speed_score_instances();

		Initializer::init_speed_score();
		$this->assertSame( $before + 1, self::count_speed_score_instances() );

		Initializer::init();
		$this->assertSame( $before + 1, self::count_speed_score_instances() );
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
}
