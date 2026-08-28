<?php
/**
 * Tests for the Reprint exporter (Pressable and WordPress.com/Atomic).
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Rest_Authentication;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Reprint_Export\Reprint_Exporter;
use Automattic\Jetpack\Reprint_Export\REST_Controller;
use Automattic\RedefineExit\ExitException;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

require_once __DIR__ . '/class-reprint-exporter-test-stub.php';

/**
 * Tests the Reprint_Exporter and REST_Controller classes.
 *
 * @covers \Automattic\Jetpack\Reprint_Export\REST_Controller
 * @covers \Automattic\Jetpack\Reprint_Export\Reprint_Exporter
 */
#[CoversClass( Reprint_Exporter::class )]
#[CoversClass( REST_Controller::class )]
class Reprint_Exporter_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Throwaway role used to prove a capability alone is not enough.
	 *
	 * @var string
	 */
	const TEST_ROLE = 'reprint_test_manager';

	/**
	 * Test tear down.
	 */
	public function tear_down() {
		remove_role( self::TEST_ROLE );
		Constants::clear_constants();
		Rest_Authentication::init()->reset_saved_auth_state();
		wp_set_current_user( 0 );
		remove_all_filters( 'jetpack_reprint_export_available' );
		delete_option( Reprint_Exporter::SECRET_OPTION );
		delete_option( Reprint_Exporter::ENABLED_OPTION );
		unset( $_GET['reprint-api-jetpack'], $_SERVER['REQUEST_METHOD'] );
		parent::tear_down();
	}

	/**
	 * Writes an export option straight past the guard.
	 *
	 * Some tests need a stale or future timestamp, which open_export_window()
	 * cannot produce because it always stamps the current time.
	 *
	 * @param string $option Option name.
	 * @param mixed  $value  Value to store.
	 */
	private function plant_option( $option, $value ) {
		// Both guards have to come off: update_option() falls through to
		// add_option() when the option does not exist yet.
		remove_filter( "pre_update_option_{$option}", array( Reprint_Exporter::class, 'veto_foreign_update' ), PHP_INT_MAX );
		remove_action( 'add_option', array( Reprint_Exporter::class, 'veto_foreign_add' ) );

		update_option( $option, $value );

		Reprint_Exporter::protect_options();
	}

	/**
	 * Builds a WP environment object with the given request path.
	 *
	 * @param string $request The resolved request path.
	 * @return WP
	 */
	private function make_wp( $request = '' ) {
		$wp          = new WP();
		$wp->request = $request;
		return $wp;
	}

	/**
	 * Runs the handler, swallowing the ExitException that stands in for exit().
	 *
	 * @param Reprint_Exporter_Test_Stub $stub The handler under test.
	 * @param WP                         $wp   The WP environment object.
	 * @return string Captured response body, if any.
	 */
	private function run_handler( $stub, $wp ) {
		ob_start();
		try {
			$stub->handle_request( $wp );
		} catch ( ExitException $e ) {
			// Stands in for exit(); expected on terminating paths.
			unset( $e );
		}
		return (string) ob_get_clean();
	}

	// -- Host gating ----------------------------------------------------------

	/**
	 * Not available by default on a generic (non-Pressable) site.
	 */
	public function test_not_available_on_non_pressable() {
		$this->assertFalse( Reprint_Exporter::is_available() );
	}

	/**
	 * Available on Pressable.
	 */
	public function test_available_on_pressable() {
		Constants::set_constant( 'IS_PRESSABLE', true );
		$this->assertTrue( Reprint_Exporter::is_available() );
	}

	/**
	 * Available on WordPress.com (Atomic). Gated on the platform constants
	 * rather than on wpcomsh being installed, so the check keeps working if
	 * wpcomsh ever goes away.
	 */
	public function test_available_on_atomic() {
		Constants::set_constant( 'ATOMIC_SITE_ID', 123 );
		Constants::set_constant( 'ATOMIC_CLIENT_ID', 456 );
		$this->assertTrue( Reprint_Exporter::is_available() );
	}

	/**
	 * The filter acts as a kill switch on Atomic too.
	 */
	public function test_filter_kill_switch_on_atomic() {
		Constants::set_constant( 'ATOMIC_SITE_ID', 123 );
		Constants::set_constant( 'ATOMIC_CLIENT_ID', 456 );
		add_filter( 'jetpack_reprint_export_available', '__return_false' );
		$this->assertFalse( Reprint_Exporter::is_available() );
	}

	/**
	 * The filter can force-enable the feature off Pressable.
	 */
	public function test_filter_enables_off_pressable() {
		add_filter( 'jetpack_reprint_export_available', '__return_true' );
		$this->assertTrue( Reprint_Exporter::is_available() );
	}

	/**
	 * The filter acts as a kill switch on Pressable.
	 */
	public function test_filter_kill_switch_on_pressable() {
		Constants::set_constant( 'IS_PRESSABLE', true );
		add_filter( 'jetpack_reprint_export_available', '__return_false' );
		$this->assertFalse( Reprint_Exporter::is_available() );
	}

	/**
	 * Counts the exporter's own parse_request callbacks.
	 *
	 * The exporter registers a fresh instance, so has_action() cannot find the
	 * callback by identity — look it up by class and method instead.
	 *
	 * @return int
	 */
	private function count_parse_request_hooks() {
		global $wp_filter;

		if ( ! isset( $wp_filter['parse_request'] ) ) {
			return 0;
		}

		$count = 0;
		foreach ( $wp_filter['parse_request']->callbacks as $by_priority ) {
			foreach ( $by_priority as $callback ) {
				if ( is_array( $callback['function'] )
					&& $callback['function'][0] instanceof Reprint_Exporter
					&& 'handle_request' === $callback['function'][1]
				) {
					++$count;
				}
			}
		}

		return $count;
	}

	/**
	 * Nothing is registered where the feature is unavailable.
	 */
	public function test_maybe_init_registers_nothing_when_unavailable() {
		Reprint_Exporter::maybe_init();

		$this->assertSame( 0, $this->count_parse_request_hooks() );
		$this->assertFalse( has_action( 'rest_api_init', array( Reprint_Exporter::class, 'register_rest_routes' ) ) );
	}

	/**
	 * The request handler and the REST routes are registered where the feature
	 * is available.
	 */
	public function test_maybe_init_registers_hooks_when_available() {
		Constants::set_constant( 'IS_PRESSABLE', true );
		Reprint_Exporter::maybe_init();

		$this->assertSame( 1, $this->count_parse_request_hooks() );
		$this->assertSame( 10, has_action( 'rest_api_init', array( Reprint_Exporter::class, 'register_rest_routes' ) ) );
	}

	/**
	 * A connected site loads Reprint through module-extras.php.
	 *
	 * Because PHP includes `module-extras.php` only once, this needs a fresh
	 * process after setting the connection state.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[PreserveGlobalState( false )]
	#[RunInSeparateProcess]
	public function test_module_extras_loads_reprint_on_connected_sites() {
		add_filter( 'jetpack_is_connection_ready', '__return_true', 1000 );
		add_filter( 'jetpack_reprint_export_available', '__return_true' );
		add_filter(
			'jetpack_tools_to_include',
			static function () {
				return array( 'reprint-export.php' );
			}
		);

		Jetpack::load_modules();

		$this->assertSame( 1, $this->count_parse_request_hooks() );
		$this->assertSame( 10, has_action( 'rest_api_init', array( Reprint_Exporter::class, 'register_rest_routes' ) ) );
	}

	/**
	 * The module-extras entry point must not be an activatable module.
	 *
	 * It sits in modules/, which Modules::get_available() globs, so leaving
	 * module headers on it would put "Reprint export" in the module list and
	 * let a user toggle a feature that is not a module.
	 */
	public function test_entry_point_is_not_a_module() {
		$this->assertFileExists( JETPACK__PLUGIN_DIR . 'modules/reprint-export.php' );
		$this->assertFalse( Jetpack::get_module( 'reprint-export' ) );
		$this->assertNotContains( 'reprint-export', Jetpack::get_available_modules() );
	}

	// -- Option guard ---------------------------------------------------------

	/**
	 * A foreign write to the secret is refused.
	 *
	 * This is the defence against an arbitrary-option-update vulnerability in
	 * some other plugin: setting the secret plus the window is all an attacker
	 * needs to stream the whole site.
	 */
	public function test_foreign_update_of_the_secret_is_refused() {
		Reprint_Exporter::store_secret( 'the-real-secret' );
		Reprint_Exporter::protect_options();

		update_option( Reprint_Exporter::SECRET_OPTION, 'attacker-chosen' );

		$this->assertSame( 'the-real-secret', get_option( Reprint_Exporter::SECRET_OPTION ) );
	}

	/**
	 * A foreign write to the window timestamp is refused.
	 */
	public function test_foreign_update_of_the_window_is_refused() {
		Reprint_Exporter::protect_options();

		update_option( Reprint_Exporter::ENABLED_OPTION, time() );

		$this->assertFalse( Reprint_Exporter::is_export_window_open() );
	}

	/**
	 * A foreign write cannot create either option from scratch either.
	 *
	 * When the option is absent, update_option() falls through to add_option(),
	 * so the veto has to hold on that path too.
	 */
	public function test_foreign_write_cannot_create_the_secret() {
		Reprint_Exporter::protect_options();

		update_option( Reprint_Exporter::SECRET_OPTION, 'attacker-chosen' );

		$this->assertFalse( get_option( Reprint_Exporter::SECRET_OPTION ) );
	}

	/**
	 * A direct add_option() stops the request.
	 *
	 * There is no filter that can cancel an add, so the only lever is to stop.
	 */
	public function test_foreign_add_option_aborts() {
		Reprint_Exporter::protect_options();

		$this->expectException( WPDieException::class );
		add_option( Reprint_Exporter::SECRET_OPTION, 'attacker-chosen' );
	}

	/**
	 * The guard leaves every other option alone.
	 */
	public function test_guard_ignores_unrelated_options() {
		Reprint_Exporter::protect_options();

		add_option( 'reprint_unrelated_option', 'value' );
		update_option( 'reprint_unrelated_option', 'changed' );

		$this->assertSame( 'changed', get_option( 'reprint_unrelated_option' ) );
		delete_option( 'reprint_unrelated_option' );
	}

	/**
	 * The exporter's own writes still go through with the guard active.
	 */
	public function test_own_writes_pass_the_guard() {
		Reprint_Exporter::protect_options();

		$this->assertTrue( Reprint_Exporter::store_secret( 'a-secret' ) );
		$this->assertSame( 'a-secret', get_option( Reprint_Exporter::SECRET_OPTION ) );

		Reprint_Exporter::open_export_window();
		$this->assertTrue( Reprint_Exporter::is_export_window_open() );
	}

	/**
	 * WP-CLI can write, since shell access already implies database access.
	 */
	public function test_wp_cli_can_write() {
		Reprint_Exporter::protect_options();
		Constants::set_constant( 'WP_CLI', true );

		update_option( Reprint_Exporter::SECRET_OPTION, 'set-from-cli' );

		$this->assertSame( 'set-from-cli', get_option( Reprint_Exporter::SECRET_OPTION ) );
	}

	/**
	 * The guard does not stay held open after a write.
	 */
	public function test_guard_closes_after_an_allowed_write() {
		Reprint_Exporter::protect_options();
		Reprint_Exporter::store_secret( 'a-secret' );

		update_option( Reprint_Exporter::SECRET_OPTION, 'attacker-chosen' );

		$this->assertSame( 'a-secret', get_option( Reprint_Exporter::SECRET_OPTION ) );
	}

	/**
	 * The REST route is registered.
	 */
	public function test_rest_route_registered() {
		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		add_action( 'rest_api_init', array( Reprint_Exporter::class, 'register_rest_routes' ) );
		do_action( 'rest_api_init' );

		$routes = $wp_rest_server->get_routes();
		$this->assertArrayHasKey( '/jetpack/v4/reprint/rotate-export-secret', $routes );
		$this->assertArrayHasKey( '/jetpack/v4/reprint/enable-export', $routes );

		remove_action( 'rest_api_init', array( Reprint_Exporter::class, 'register_rest_routes' ) );
		$wp_rest_server = null;
	}

	// -- Secret rotation ------------------------------------------------------

	/**
	 * An unsigned request fails the permission check.
	 */
	public function test_permission_check_denies_unsigned_request() {
		$this->assertFalse( ( new REST_Controller() )->permission_check() );
	}

	/**
	 * A non-administrative user-token signature cannot access the export secret.
	 */
	public function test_permission_check_denies_non_administrative_user_token() {
		$user_id = $this->factory()->user->create( array( 'role' => 'subscriber' ) );
		wp_set_current_user( $user_id );
		$this->set_jetpack_rest_authentication_type( 'user' );

		$this->assertFalse( ( new REST_Controller() )->permission_check() );
	}

	/**
	 * An administrative user-token signature can access the export secret.
	 */
	public function test_permission_check_allows_administrative_user_token() {
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$this->set_jetpack_rest_authentication_type( 'user' );

		$this->assertTrue( ( new REST_Controller() )->permission_check() );
	}

	/**
	 * A non-administrator role holding manage_options is still denied.
	 *
	 * This is the case the role check exists for. Membership, LMS and shop
	 * plugins hand manage_options to roles like shop manager or instructor so
	 * they can reach a settings screen; none of them intends to grant a copy of
	 * the whole database and file tree.
	 */
	public function test_permission_check_denies_manage_options_without_administrator_role() {
		add_role(
			self::TEST_ROLE,
			'Reprint Test Manager',
			array(
				'read'           => true,
				'manage_options' => true,
			)
		);

		$user_id = $this->factory()->user->create( array( 'role' => self::TEST_ROLE ) );
		wp_set_current_user( $user_id );
		$this->set_jetpack_rest_authentication_type( 'user' );

		$this->assertTrue( user_can( $user_id, 'manage_options' ), 'Fixture must hold manage_options for this test to mean anything.' );
		$this->assertFalse( ( new REST_Controller() )->permission_check() );
	}

	/**
	 * A blog-token signature cannot access the export secret.
	 */
	public function test_permission_check_denies_blog_token() {
		$this->set_jetpack_rest_authentication_type( 'blog' );

		$this->assertFalse( ( new REST_Controller() )->permission_check() );
	}

	/**
	 * Sets the Jetpack REST authentication state for a permission test.
	 *
	 * @param string $type Either 'user' or 'blog'.
	 */
	private function set_jetpack_rest_authentication_type( $type ) {
		$instance   = Rest_Authentication::init();
		$reflection = new ReflectionClass( $instance );

		$status_property = $reflection->getProperty( 'rest_authentication_status' );
		$type_property   = $reflection->getProperty( 'rest_authentication_type' );

		if ( PHP_VERSION_ID < 80100 ) {
			$status_property->setAccessible( true );
			$type_property->setAccessible( true );
		}

		$status_property->setValue( $instance, true );
		$type_property->setValue( $instance, $type );
	}

	/**
	 * Rotating the secret generates and stores a 64-char hex secret without
	 * opening the export window.
	 */
	public function test_rotate_secret_generates_stores_and_does_not_open_the_export_window() {
		$response = ( new REST_Controller() )->rotate_secret();
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertArrayHasKey( 'secret', $data );
		$this->assertMatchesRegularExpression( '/^[0-9a-f]{64}$/', $data['secret'] );
		$this->assertSame( $data['secret'], get_option( Reprint_Exporter::SECRET_OPTION ) );
		$this->assertFalse( get_option( Reprint_Exporter::ENABLED_OPTION, false ) );
	}

	/**
	 * Enabling the export opens the window without minting a secret.
	 */
	public function test_enable_export_opens_window_without_secret() {
		$before   = time();
		$response = ( new REST_Controller() )->enable_export();
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertArrayHasKey( 'enabled_at', $data );
		$this->assertGreaterThanOrEqual( $before, (int) $data['enabled_at'] );
		$this->assertSame( (int) $data['enabled_at'], (int) get_option( Reprint_Exporter::ENABLED_OPTION ) );
		$this->assertTrue( Reprint_Exporter::is_export_window_open() );

		// No secret is minted by the enable route.
		$this->assertFalse( get_option( Reprint_Exporter::SECRET_OPTION ) );
	}

	// -- Export window helper -------------------------------------------------

	/**
	 * A missing, stale, or future enabled timestamp keeps the window closed.
	 */
	public function test_export_window_closed_when_missing_stale_or_future() {
		$this->assertFalse( Reprint_Exporter::is_export_window_open() );

		$this->plant_option( Reprint_Exporter::ENABLED_OPTION, time() - ( HOUR_IN_SECONDS + 60 ) );
		$this->assertFalse( Reprint_Exporter::is_export_window_open() );

		$this->plant_option( Reprint_Exporter::ENABLED_OPTION, time() + Reprint_Exporter::HMAC_CLOCK_SKEW + 1 );
		$this->assertFalse( Reprint_Exporter::is_export_window_open() );

		$this->plant_option( Reprint_Exporter::ENABLED_OPTION, time() + Reprint_Exporter::HMAC_CLOCK_SKEW - 1 );
		$this->assertTrue( Reprint_Exporter::is_export_window_open() );

		Reprint_Exporter::open_export_window();
		$this->assertTrue( Reprint_Exporter::is_export_window_open() );
	}

	// -- Export request handler -----------------------------------------------

	/**
	 * Builds a stub with the feature available and the window open.
	 *
	 * @return Reprint_Exporter_Test_Stub
	 */
	private function make_ready_stub() {
		add_filter( 'jetpack_reprint_export_available', '__return_true' );
		Reprint_Exporter::open_export_window();
		$_GET['reprint-api-jetpack'] = '1';
		$_SERVER['REQUEST_METHOD']   = 'GET';
		return new Reprint_Exporter_Test_Stub();
	}

	/**
	 * No reprint-api-jetpack query param: the handler does nothing.
	 */
	public function test_ignores_request_without_query_param() {
		add_filter( 'jetpack_reprint_export_available', '__return_true' );
		Reprint_Exporter::open_export_window();
		$stub = new Reprint_Exporter_Test_Stub();
		$this->run_handler( $stub, $this->make_wp( '' ) );
		$this->assertFalse( $stub->served );
		$this->assertFalse( $stub->terminated );
	}

	/**
	 * Non-root path: the handler does nothing even with the query param.
	 */
	public function test_ignores_non_root_request() {
		$stub = $this->make_ready_stub();
		$this->run_handler( $stub, $this->make_wp( 'some/path' ) );
		$this->assertFalse( $stub->served );
		$this->assertFalse( $stub->terminated );
	}

	/**
	 * Closed window: the handler does nothing.
	 */
	public function test_ignores_when_window_closed() {
		add_filter( 'jetpack_reprint_export_available', '__return_true' );
		$_GET['reprint-api-jetpack'] = '1';
		$_SERVER['REQUEST_METHOD']   = 'GET';
		$stub                        = new Reprint_Exporter_Test_Stub();
		$this->run_handler( $stub, $this->make_wp( '' ) );
		$this->assertFalse( $stub->served );
		$this->assertFalse( $stub->terminated );
	}

	/**
	 * Not available (filter off): the handler does nothing.
	 */
	public function test_ignores_when_not_available() {
		Reprint_Exporter::open_export_window();
		$_GET['reprint-api-jetpack'] = '1';
		$_SERVER['REQUEST_METHOD']   = 'GET';
		$stub                        = new Reprint_Exporter_Test_Stub();
		$this->run_handler( $stub, $this->make_wp( '' ) );
		$this->assertFalse( $stub->served );
		$this->assertFalse( $stub->terminated );
	}

	/**
	 * OPTIONS preflight terminates before authentication, without serving.
	 */
	public function test_options_preflight_exits_before_auth() {
		$stub                      = $this->make_ready_stub();
		$_SERVER['REQUEST_METHOD'] = 'OPTIONS';
		$this->run_handler( $stub, $this->make_wp( '' ) );
		$this->assertTrue( $stub->terminated );
		$this->assertFalse( $stub->served );
		$this->assertNull( $stub->verified_secret, 'OPTIONS must not reach HMAC verification.' );
	}

	/**
	 * Missing secret returns 503.
	 */
	public function test_missing_secret_returns_503() {
		$stub = $this->make_ready_stub();
		$body = $this->run_handler( $stub, $this->make_wp( '' ) );
		$this->assertSame( 503, $stub->error_code );
		$this->assertStringContainsString( '"code":503', $body );
		$this->assertFalse( $stub->served );
	}

	/**
	 * Invalid HMAC returns 403.
	 */
	public function test_invalid_hmac_returns_403() {
		$stub             = $this->make_ready_stub();
		$stub->hmac_error = 'Invalid signature.';
		Reprint_Exporter::store_secret( 'a-secret' );
		$body = $this->run_handler( $stub, $this->make_wp( '' ) );
		$this->assertSame( 403, $stub->error_code );
		$this->assertStringContainsString( '"code":403', $body );
		$this->assertSame( 'a-secret', $stub->verified_secret );
		$this->assertFalse( $stub->served );
	}

	/**
	 * Valid HMAC serves the export and refreshes the window.
	 */
	public function test_valid_hmac_serves_export() {
		$stub = $this->make_ready_stub();
		Reprint_Exporter::store_secret( 'a-secret' );
		$this->plant_option( Reprint_Exporter::ENABLED_OPTION, time() - 30 );

		$this->run_handler( $stub, $this->make_wp( '' ) );

		$this->assertTrue( $stub->served );
		$this->assertTrue( $stub->terminated );
		$this->assertNull( $stub->error_code );
		// Window timestamp was bumped to (approximately) now.
		$this->assertGreaterThanOrEqual( time() - 5, (int) get_option( Reprint_Exporter::ENABLED_OPTION ) );
	}

	/**
	 * Invalid export parameters return JSON instead of a WordPress fatal error.
	 */
	public function test_invalid_export_request_returns_400() {
		$stub              = $this->make_ready_stub();
		$stub->serve_error = new \InvalidArgumentException( 'endpoint parameter is required.' );
		Reprint_Exporter::store_secret( 'a-secret' );

		$body = $this->run_handler( $stub, $this->make_wp( '' ) );

		$this->assertSame( 400, $stub->error_code );
		$this->assertStringContainsString( '"code":400', $body );
		$this->assertStringContainsString( 'endpoint parameter is required.', $body );
		$this->assertTrue( $stub->served );
		$this->assertTrue( $stub->terminated );
	}
}
