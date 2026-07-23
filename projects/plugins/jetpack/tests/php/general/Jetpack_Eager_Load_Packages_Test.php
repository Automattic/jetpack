<?php
/**
 * Tests for Jetpack::should_eager_load_packages(), the request-type gate that
 * decides whether the admin/REST-only packages (the Import package and My
 * Jetpack) are initialized eagerly at plugins_loaded or deferred off the
 * front-end GET path.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * @covers Jetpack
 */
#[CoversClass( Jetpack::class )]
class Jetpack_Eager_Load_Packages_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * The original REQUEST_METHOD, restored after each test.
	 *
	 * @var string|null
	 */
	private $original_request_method;

	/**
	 * Original priority for the deferred Import REST callback, or false if absent.
	 *
	 * @var int|false
	 */
	private $original_import_rest_priority;

	/**
	 * Original priority for the deferred My Jetpack REST callback, or false if absent.
	 *
	 * @var int|false
	 */
	private $original_my_jetpack_rest_priority;

	/**
	 * Action-count globals stashed by force_unfire_action(), restored in tear_down.
	 *
	 * @var array<string, int>
	 */
	private $stashed_action_counts = array();

	/**
	 * Stash request state that the gate reads from $_SERVER.
	 */
	public function set_up() {
		parent::set_up();
		$this->original_request_method = $_SERVER['REQUEST_METHOD'] ?? null;

		$this->original_import_rest_priority     = has_action( 'rest_api_init', array( Jetpack::class, 'configure_import_package' ) );
		$this->original_my_jetpack_rest_priority = has_action( 'rest_api_init', array( \Automattic\Jetpack\My_Jetpack\Initializer::class, 'init' ) );

		remove_action( 'rest_api_init', array( Jetpack::class, 'configure_import_package' ), 0 );
		remove_action( 'rest_api_init', array( \Automattic\Jetpack\My_Jetpack\Initializer::class, 'init' ), 0 );
	}

	/**
	 * Restore request state and the admin screen so tests do not leak into each other.
	 */
	public function tear_down() {
		if ( null === $this->original_request_method ) {
			unset( $_SERVER['REQUEST_METHOD'] );
		} else {
			$_SERVER['REQUEST_METHOD'] = $this->original_request_method;
		}
		remove_filter( 'wp_doing_cron', '__return_true' );
		Constants::clear_single_constant( 'WP_CLI' );
		remove_action( 'rest_api_init', array( Jetpack::class, 'configure_import_package' ), 0 );
		remove_action( 'rest_api_init', array( \Automattic\Jetpack\My_Jetpack\Initializer::class, 'init' ), 0 );
		if ( false !== $this->original_import_rest_priority ) {
			add_action( 'rest_api_init', array( Jetpack::class, 'configure_import_package' ), $this->original_import_rest_priority );
		}
		if ( false !== $this->original_my_jetpack_rest_priority ) {
			add_action( 'rest_api_init', array( \Automattic\Jetpack\My_Jetpack\Initializer::class, 'init' ), $this->original_my_jetpack_rest_priority );
		}

		foreach ( $this->stashed_action_counts as $action => $count ) {
			$GLOBALS['wp_actions'][ $action ] = $count;
		}
		$this->stashed_action_counts = array();

		// The end-to-end route tests swap in a throwaway REST server; drop it so it
		// does not leak into other suites, and clear the connection-owner memo.
		$GLOBALS['wp_rest_server'] = null;
		Jetpack::connection()->reset_connection_status();

		set_current_screen( 'front' );
		parent::tear_down();
	}

	/**
	 * Force `did_action( $action )` back to 0 for the rest of the test, stashing the
	 * real count so tear_down can restore it.
	 *
	 * The package bootstraps guard on `did_action()` (Import_Main::configure() and
	 * My_Jetpack_Initializer::init() both no-op once their init action has fired),
	 * so the deferred-route tests must start from an un-fired baseline to exercise
	 * the real registration path rather than the early return.
	 *
	 * @param string $action Action hook name.
	 */
	private function force_unfire_action( $action ) {
		$this->stashed_action_counts[ $action ] = did_action( $action );
		unset( $GLOBALS['wp_actions'][ $action ] );
	}

	/**
	 * Whether any registered REST route lives under the given namespace prefix.
	 *
	 * @param string $prefix Route prefix, e.g. '/jetpack/v4/import'.
	 * @return bool
	 */
	private function has_route_under( $prefix ) {
		foreach ( array_keys( rest_get_server()->get_routes() ) as $route ) {
			if ( str_starts_with( $route, $prefix ) ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Invoke the private static gate via reflection.
	 *
	 * @return bool
	 */
	private function invoke_gate() {
		$method = new ReflectionMethod( Jetpack::class, 'should_eager_load_packages' );
		// setAccessible() is a no-op as of PHP 8.1 and deprecated in 8.5; only
		// needed (and only called) on the older PHP versions Jetpack still supports.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		return $method->invoke( null );
	}

	/**
	 * A plain front-end GET must NOT eagerly load the packages — this is the
	 * whole point of the gate (the front-end hot path stays clear).
	 */
	public function test_plain_front_end_get_does_not_eager_load() {
		set_current_screen( 'front' );
		$_SERVER['REQUEST_METHOD'] = 'GET';

		$this->assertFalse( $this->invoke_gate() );
	}

	/**
	 * An admin request must eagerly load the packages.
	 */
	public function test_admin_request_eager_loads() {
		set_current_screen( 'dashboard' );
		$_SERVER['REQUEST_METHOD'] = 'GET';

		$this->assertTrue( $this->invoke_gate() );
	}

	/**
	 * A POST request must eagerly load the packages, even on the front end.
	 */
	public function test_post_request_eager_loads() {
		set_current_screen( 'front' );
		$_SERVER['REQUEST_METHOD'] = 'POST';

		$this->assertTrue( $this->invoke_gate() );
	}

	/**
	 * A lower-case POST method still eager-loads (the gate upper-cases the value).
	 */
	public function test_lowercase_post_method_eager_loads() {
		set_current_screen( 'front' );
		$_SERVER['REQUEST_METHOD'] = 'post';

		$this->assertTrue( $this->invoke_gate() );
	}

	/**
	 * A cron request must eagerly load the packages.
	 */
	public function test_cron_request_eager_loads() {
		set_current_screen( 'front' );
		$_SERVER['REQUEST_METHOD'] = 'GET';
		add_filter( 'wp_doing_cron', '__return_true' );

		$this->assertTrue( $this->invoke_gate() );
	}

	/**
	 * A WP-CLI request must eagerly load the packages.
	 */
	public function test_wp_cli_request_eager_loads() {
		set_current_screen( 'front' );
		$_SERVER['REQUEST_METHOD'] = 'GET';
		Constants::set_constant( 'WP_CLI', true );

		$this->assertTrue( $this->invoke_gate() );
	}

	/**
	 * A plain front-end GET defers the Import package to REST requests instead of
	 * eagerly loading it at plugins_loaded.
	 */
	public function test_front_end_get_defers_import_to_rest_api_init() {
		set_current_screen( 'front' );
		$_SERVER['REQUEST_METHOD'] = 'GET';

		$jetpack = Jetpack::init();
		$jetpack->configure();

		$this->assertSame(
			0,
			has_action( 'rest_api_init', array( Jetpack::class, 'configure_import_package' ) )
		);
	}

	/**
	 * The deferred Import callback still initializes the package and fires the
	 * Config feature-enabled action.
	 */
	public function test_deferred_import_callback_initializes_import_package() {
		Jetpack::configure_import_package();

		$this->assertGreaterThanOrEqual( 1, did_action( 'jetpack_import_initialized' ) );
		$this->assertGreaterThanOrEqual( 1, did_action( 'jetpack_feature_import_enabled' ) );
	}

	/**
	 * An admin request keeps Import eager, so it does not register the deferred
	 * REST bootstrap callback.
	 */
	public function test_admin_request_does_not_defer_import_to_rest_api_init() {
		set_current_screen( 'dashboard' );
		$_SERVER['REQUEST_METHOD'] = 'GET';

		$jetpack = Jetpack::init();
		$jetpack->configure();

		$this->assertFalse(
			has_action( 'rest_api_init', array( Jetpack::class, 'configure_import_package' ) )
		);
		$this->assertGreaterThanOrEqual( 1, did_action( 'jetpack_import_initialized' ) );
		$this->assertGreaterThanOrEqual( 1, did_action( 'jetpack_feature_import_enabled' ) );
	}

	/**
	 * A plain front-end GET defers My Jetpack initialization to REST requests.
	 */
	public function test_front_end_get_defers_my_jetpack_to_rest_api_init() {
		set_current_screen( 'front' );
		$_SERVER['REQUEST_METHOD'] = 'GET';

		$jetpack = Jetpack::init();
		$jetpack->late_initialization();

		$this->assertSame(
			0,
			has_action( 'rest_api_init', array( \Automattic\Jetpack\My_Jetpack\Initializer::class, 'init' ) )
		);
	}

	/**
	 * An admin request initializes My Jetpack eagerly, so it does not register the
	 * deferred REST callback.
	 */
	public function test_admin_request_does_not_defer_my_jetpack_to_rest_api_init() {
		set_current_screen( 'dashboard' );
		$_SERVER['REQUEST_METHOD'] = 'GET';

		$jetpack = Jetpack::init();
		$jetpack->late_initialization();

		$this->assertFalse(
			has_action( 'rest_api_init', array( \Automattic\Jetpack\My_Jetpack\Initializer::class, 'init' ) )
		);
	}

	/**
	 * End-to-end: the deferred Import bootstrap runs at rest_api_init priority 0 and
	 * adds the route-registration callback at the default priority, which must still
	 * fire later in the *same* rest_api_init pass so the routes actually register.
	 *
	 * The other Import tests only assert the priority-0 callback is attached; this one
	 * fires rest_api_init and checks the routes land in the server, so a future
	 * priority tweak that broke the pri-0 -> pri-10 re-add (404-ing the importer) can't
	 * pass with the unit tests still green.
	 */
	public function test_deferred_import_routes_register_when_rest_api_init_fires() {
		// The importer only registers its REST routes for a connected owner.
		$owner = self::factory()->user->create( array( 'role' => 'administrator' ) );
		Jetpack_Options::update_option( 'blog_token', 'dummy.blogtoken' );
		Jetpack_Options::update_option( 'id', 1234 );
		Jetpack_Options::update_option( 'master_user', $owner );
		Jetpack_Options::update_option( 'user_tokens', array( $owner => "dummy.usertoken.$owner" ) );
		Jetpack::connection()->reset_connection_status();

		// Start from a clean slate so registration can only happen via the re-add below.
		$this->force_unfire_action( 'jetpack_import_initialized' );
		remove_action( 'rest_api_init', array( \Automattic\Jetpack\Import\Main::class, 'initialize_rest_api' ) );

		// Mirror the gate's deferred front-end-GET wiring.
		add_action( 'rest_api_init', array( Jetpack::class, 'configure_import_package' ), 0 );

		$GLOBALS['wp_rest_server'] = new WP_REST_Server();
		do_action( 'rest_api_init' );

		$this->assertTrue(
			$this->has_route_under( '/jetpack/v4/import' ),
			'Deferred Import bootstrap did not register its REST routes when rest_api_init fired.'
		);
	}

	/**
	 * End-to-end counterpart for My Jetpack: the deferred Initializer::init runs at
	 * rest_api_init priority 0 and its default-priority route registration must still
	 * fire in the same pass, so the my-jetpack/v1 routes actually register.
	 */
	public function test_deferred_my_jetpack_routes_register_when_rest_api_init_fires() {
		// Clean slate so registration can only happen via the re-add below.
		$this->force_unfire_action( 'my_jetpack_init' );
		remove_action( 'rest_api_init', array( \Automattic\Jetpack\My_Jetpack\Initializer::class, 'register_rest_endpoints' ) );

		// Mirror the gate's deferred front-end-GET wiring.
		add_action( 'rest_api_init', array( \Automattic\Jetpack\My_Jetpack\Initializer::class, 'init' ), 0 );

		$GLOBALS['wp_rest_server'] = new WP_REST_Server();
		do_action( 'rest_api_init' );

		$this->assertTrue(
			$this->has_route_under( '/my-jetpack/v1' ),
			'Deferred My Jetpack bootstrap did not register its REST routes when rest_api_init fired.'
		);
	}
}
