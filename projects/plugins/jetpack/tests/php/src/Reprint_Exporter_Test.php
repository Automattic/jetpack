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
use Automattic\Jetpack\Status\Cache as Status_Cache;
use Automattic\RedefineExit\ExitException;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use WordPress\Reprint\Server\HTTPServer;
use WordPress\Reprint\Server\PublicKeyClient;
use WordPress\Reprint\Server\RequestAuthenticator;
use WordPress\Reprint\Server\Utils;

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
	 * Events captured from jetpack_reprint_export_event during a test.
	 *
	 * @var array[]
	 */
	private $recorded_events = array();

	/**
	 * REQUEST_URI before the test; WordPress core reads it, so it is restored rather than unset.
	 *
	 * @var string|null
	 */
	private $original_request_uri;

	/**
	 * Test set up.
	 */
	public function set_up() {
		parent::set_up();
		$this->original_request_uri = $_SERVER['REQUEST_URI'] ?? null; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- Restored verbatim in tear_down().
		// The test PHP has OpenSSL; tests that exercise keys force true themselves.
		Utils::override_key_auth_required_for_tests( false );
	}

	/**
	 * Test tear down.
	 */
	public function tear_down() {
		remove_role( self::TEST_ROLE );
		Constants::clear_constants();
		// Host::is_woa_site() memoizes, so a stale answer would leak between tests.
		Status_Cache::clear();
		Rest_Authentication::init()->reset_saved_auth_state();
		wp_set_current_user( 0 );
		remove_all_filters( 'jetpack_reprint_export_available' );
		delete_option( Reprint_Exporter::SECRET_OPTION );
		delete_option( Reprint_Exporter::ENABLED_OPTION );
		delete_option( Reprint_Exporter::PUBLIC_KEY_OPTION );
		unset( $_GET['reprint-api-jetpack'], $_GET['endpoint'], $_SERVER['REQUEST_METHOD'] );
		unset( $_SERVER['HTTP_X_AUTH_KEY_ID'], $_SERVER['HTTP_X_AUTH_SIGNATURE'], $_SERVER['HTTP_X_AUTH_NONCE'], $_SERVER['HTTP_X_AUTH_TIMESTAMP'] );
		if ( null === $this->original_request_uri ) {
			unset( $_SERVER['REQUEST_URI'] );
		} else {
			$_SERVER['REQUEST_URI'] = $this->original_request_uri;
		}
		Utils::override_key_auth_required_for_tests( null );
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
	 * Available on WordPress.com (Atomic).
	 */
	public function test_available_on_woa() {
		$this->pretend_woa();
		$this->assertTrue( Reprint_Exporter::is_available() );
	}

	/**
	 * WP Cloud alone is not WordPress.com.
	 *
	 * Every WP Cloud host satisfies is_atomic_platform(), so the gate uses
	 * is_woa_site(), which additionally requires wpcomsh — the marker of a
	 * WordPress.com site. Without this the gate could be widened back to the
	 * whole of WP Cloud and no other test would notice.
	 */
	public function test_not_available_on_wp_cloud_without_wordpress_com() {
		Constants::set_constant( 'ATOMIC_SITE_ID', 123 );
		Constants::set_constant( 'ATOMIC_CLIENT_ID', 456 );
		// Stated rather than assumed: the wpcomsh suite really does define this,
		// and Constants prefers its own value over a define().
		Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', false );
		Status_Cache::clear();

		$this->assertFalse( Reprint_Exporter::is_available() );
	}

	/**
	 * The filter acts as a kill switch on WoA too.
	 */
	public function test_filter_kill_switch_on_woa() {
		$this->pretend_woa();
		$this->assertTrue( Reprint_Exporter::is_available(), 'Fixture must be available before the filter is added.' );

		Status_Cache::clear();
		add_filter( 'jetpack_reprint_export_available', '__return_false' );
		$this->assertFalse( Reprint_Exporter::is_available() );
	}

	/**
	 * Sets the constants that make Host::is_woa_site() true.
	 */
	private function pretend_woa() {
		Constants::set_constant( 'ATOMIC_SITE_ID', 123 );
		Constants::set_constant( 'ATOMIC_CLIENT_ID', 456 );
		Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', '/wp-content/plugins/wpcomsh/wpcomsh.php' );
		Status_Cache::clear();
	}

	/**
	 * The filter cannot switch the feature on off a supported host.
	 *
	 * The host check is the policy, so third-party code must not be able to
	 * expose a full-site export on a site we do not run.
	 */
	public function test_filter_cannot_enable_off_supported_hosts() {
		add_filter( 'jetpack_reprint_export_available', '__return_true' );
		$this->assertFalse( Reprint_Exporter::is_available() );
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
	 * The option guard goes up even where the exporter itself does not.
	 *
	 * Asserted on the unavailable path on purpose: it pins both that
	 * maybe_init() wires the guard up at all, and that it does so ahead of the
	 * availability check. Every other guard test calls protect_options()
	 * directly, so without this one the call could be dropped from maybe_init()
	 * and nothing would fail.
	 */
	public function test_maybe_init_protects_the_options_even_when_unavailable() {
		Reprint_Exporter::maybe_init();

		$this->assertNotFalse( has_filter( 'pre_update_option_' . Reprint_Exporter::SECRET_OPTION, array( Reprint_Exporter::class, 'veto_foreign_update' ) ) );
		$this->assertNotFalse( has_filter( 'pre_update_option_' . Reprint_Exporter::ENABLED_OPTION, array( Reprint_Exporter::class, 'veto_foreign_update' ) ) );
		$this->assertNotFalse( has_action( 'add_option', array( Reprint_Exporter::class, 'veto_foreign_add' ) ) );

		// And it actually bites: a foreign write is refused.
		Reprint_Exporter::store_secret( 'the-real-secret' );
		update_option( Reprint_Exporter::SECRET_OPTION, 'attacker-chosen' );
		$this->assertSame( 'the-real-secret', get_option( Reprint_Exporter::SECRET_OPTION ) );
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
		Constants::set_constant( 'IS_PRESSABLE', true );
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

		$this->assertFalse( get_option( Reprint_Exporter::ENABLED_OPTION ) );
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
	 * WP-CLI does not bypass the guard while Jetpack is loaded.
	 *
	 * An operator who needs a raw option write can explicitly skip Jetpack.
	 */
	public function test_wp_cli_does_not_bypass_guard() {
		Reprint_Exporter::store_secret( 'the-real-secret' );
		Reprint_Exporter::protect_options();
		Constants::set_constant( 'WP_CLI', true );

		update_option( Reprint_Exporter::SECRET_OPTION, 'set-from-cli' );
		update_option( Reprint_Exporter::ENABLED_OPTION, time() );

		$this->assertSame( 'the-real-secret', get_option( Reprint_Exporter::SECRET_OPTION ) );
		$this->assertFalse( get_option( Reprint_Exporter::ENABLED_OPTION ) );
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
	 * A foreign write to the public key is refused, as for the secret.
	 */
	public function test_foreign_update_of_the_public_key_is_refused() {
		Reprint_Exporter::store_public_key( 'MIIBkey' );
		Reprint_Exporter::protect_options();

		update_option( Reprint_Exporter::PUBLIC_KEY_OPTION, 'attacker-chosen' );

		$this->assertSame( 'MIIBkey', get_option( Reprint_Exporter::PUBLIC_KEY_OPTION ) );
	}

	/**
	 * A direct add_option() of the public key stops the request.
	 */
	public function test_foreign_add_option_of_the_public_key_aborts() {
		Reprint_Exporter::protect_options();

		$this->expectException( WPDieException::class );
		add_option( Reprint_Exporter::PUBLIC_KEY_OPTION, 'attacker-chosen' );
	}

	/**
	 * Discarding clears the public key.
	 */
	public function test_discard_credentials_clears_the_public_key() {
		Reprint_Exporter::store_public_key( 'MIIBkey' );

		Reprint_Exporter::discard_credentials();

		$this->assertFalse( get_option( Reprint_Exporter::PUBLIC_KEY_OPTION ) );
	}

	/**
	 * Only a credential of the scheme the host accepts counts as configured.
	 *
	 * @dataProvider provide_credential_states
	 *
	 * @param bool   $key_auth   Whether the host requires key auth.
	 * @param string $credential 'secret' or 'key'.
	 * @param bool   $counts     Expected has_credential.
	 */
	#[DataProvider( 'provide_credential_states' )]
	public function test_get_state_counts_only_the_accepted_scheme( $key_auth, $credential, $counts ) {
		Utils::override_key_auth_required_for_tests( $key_auth );
		if ( 'secret' === $credential ) {
			Reprint_Exporter::store_secret( 'a-secret' );
		} else {
			Reprint_Exporter::store_public_key( 'MIIBkey' );
		}

		$this->assertSame( $counts, Reprint_Exporter::get_state()['has_credential'] );
	}

	/**
	 * Host mode, stored credential, whether it counts.
	 *
	 * @return array<string, array{bool, string, bool}>
	 */
	public static function provide_credential_states() {
		return array(
			'key host, key'      => array( true, 'key', true ),
			'key host, secret'   => array( true, 'secret', false ),
			'token host, secret' => array( false, 'secret', true ),
			'token host, key'    => array( false, 'key', false ),
		);
	}

	/**
	 * Activation throws away credentials it did not mint.
	 *
	 * Anything in these options at activation was written while Jetpack was
	 * not running, so protect_options() never saw it. Discarding costs a real
	 * client one rotation and closes the plant-then-activate sequence.
	 */
	public function test_discard_credentials_clears_planted_values() {
		$this->plant_option( Reprint_Exporter::SECRET_OPTION, 'planted-by-someone-else' );
		$this->plant_option( Reprint_Exporter::ENABLED_OPTION, time() );
		$this->assertTrue( Reprint_Exporter::is_export_window_open(), 'Fixture must look usable before activation.' );

		Reprint_Exporter::discard_credentials();

		$this->assertFalse( get_option( Reprint_Exporter::SECRET_OPTION ) );
		$this->assertFalse( Reprint_Exporter::is_export_window_open() );
	}

	/**
	 * Activation throws away credentials too.
	 *
	 * Covers the wiring in Jetpack::plugin_activation(), which the unit test
	 * for discard_credentials() does not reach.
	 */
	public function test_activation_discards_planted_credentials() {
		$this->plant_option( Reprint_Exporter::SECRET_OPTION, 'planted-while-deactivated' );
		$this->plant_option( Reprint_Exporter::ENABLED_OPTION, time() );
		$this->assertTrue( Reprint_Exporter::is_export_window_open(), 'Fixture must look usable before activation.' );

		Jetpack::plugin_activation( false );

		$this->assertFalse( get_option( Reprint_Exporter::SECRET_OPTION ) );
		$this->assertFalse( Reprint_Exporter::is_export_window_open() );
	}

	/**
	 * Connecting the site throws away credentials it did not mint.
	 *
	 * The guard is not registered while the site is neither connected nor in
	 * offline mode, so a planted secret can survive that window. Clearing on
	 * the transition means it is gone by the time the endpoint could serve.
	 */
	public function test_connecting_discards_planted_credentials() {
		$this->plant_option( Reprint_Exporter::SECRET_OPTION, 'planted-while-disconnected' );
		$this->plant_option( Reprint_Exporter::ENABLED_OPTION, time() );
		$this->assertTrue( Reprint_Exporter::is_export_window_open(), 'Fixture must look usable before connecting.' );

		do_action( 'jetpack_site_registered' );

		$this->assertFalse( get_option( Reprint_Exporter::SECRET_OPTION ) );
		$this->assertFalse( Reprint_Exporter::is_export_window_open() );
	}

	/**
	 * Disconnecting throws them away too, so the ungated window starts empty.
	 */
	public function test_disconnecting_discards_credentials() {
		Reprint_Exporter::store_secret( 'a-secret' );
		Reprint_Exporter::open_export_window();

		Jetpack::jetpack_site_disconnected();

		$this->assertFalse( get_option( Reprint_Exporter::SECRET_OPTION ) );
		$this->assertFalse( Reprint_Exporter::is_export_window_open() );
	}

	// -- Event reporting ------------------------------------------------------

	/**
	 * Starts collecting jetpack_reprint_export_event payloads.
	 *
	 * Recorded into $recorded_events as array( event, context ).
	 */
	private function capture_events() {
		$this->recorded_events = array();
		add_action(
			'jetpack_reprint_export_event',
			function ( $event, $context ) {
				$this->recorded_events[] = array( $event, $context );
			},
			10,
			2
		);
	}

	/**
	 * A served export reports itself.
	 */
	public function test_served_export_reports_an_event() {
		$this->capture_events();

		$stub             = $this->make_ready_stub();
		$_GET['endpoint'] = 'sql_chunk';
		Reprint_Exporter::store_secret( 'a-secret' );
		$this->run_handler( $stub, $this->make_wp( '' ) );

		$this->assertTrue( $stub->served );

		$served = array_values( array_filter( $this->recorded_events, fn( $e ) => 'export_served' === $e[0] ) );
		$this->assertCount( 1, $served );
		$this->assertSame( 'sql_chunk', $served[0][1]['endpoint'] );
	}

	/**
	 * An endpoint the export server would not accept is not passed through.
	 */
	public function test_served_event_rejects_an_unknown_endpoint() {
		$this->capture_events();

		$stub             = $this->make_ready_stub();
		$_GET['endpoint'] = 'something-else';
		Reprint_Exporter::store_secret( 'a-secret' );
		$this->run_handler( $stub, $this->make_wp( '' ) );

		$served = array_values( array_filter( $this->recorded_events, fn( $e ) => 'export_served' === $e[0] ) );
		$this->assertSame( 'unknown', $served[0][1]['endpoint'] );
	}

	/**
	 * A refusal reports the status code and reason.
	 */
	public function test_refusal_reports_an_event() {
		$this->capture_events();

		$stub                  = $this->make_ready_stub();
		$stub->signature_error = array(
			'message' => 'Invalid signature.',
			'reason'  => 'signature_mismatch',
		);
		Reprint_Exporter::store_secret( 'a-secret' );
		$this->run_handler( $stub, $this->make_wp( '' ) );

		$refusals = array_values( array_filter( $this->recorded_events, fn( $e ) => 'export_refused' === $e[0] ) );
		$this->assertCount( 1, $refusals );
		$this->assertSame( 403, $refusals[0][1]['code'] );
		$this->assertSame( 'signature_mismatch', $refusals[0][1]['reason'] );
	}

	/**
	 * A request that falls through to WordPress reports nothing.
	 *
	 * Otherwise an unarmed site would emit an event for every stray probe.
	 */
	public function test_silent_fall_through_reports_nothing() {
		$this->capture_events();

		Constants::set_constant( 'IS_PRESSABLE', true );
		$_GET['reprint-api-jetpack'] = '1';
		$_SERVER['REQUEST_METHOD']   = 'GET';
		$stub                        = new Reprint_Exporter_Test_Stub();
		$this->run_handler( $stub, $this->make_wp( '' ) );

		$this->assertSame( array(), $this->recorded_events );
	}

	/**
	 * Both control-plane routes report the acting user.
	 */
	public function test_control_plane_reports_the_acting_user() {
		$this->capture_events();
		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		( new REST_Controller() )->rotate_secret();
		( new REST_Controller() )->enable_export();

		$names = array_column( $this->recorded_events, 0 );
		$this->assertContains( 'window_opened', $names );
		$this->assertContains( 'secret_rotated', $names );
		foreach ( $this->recorded_events as $event ) {
			$this->assertSame( $user_id, $event[1]['user_id'] );
		}
	}

	/**
	 * Discarding reports only when it removed something, and says which boundary.
	 */
	public function test_discard_reports_only_when_it_removed_something() {
		$this->capture_events();

		Reprint_Exporter::discard_credentials();
		$this->assertSame( array(), $this->recorded_events, 'Nothing stored, so nothing to report.' );

		Reprint_Exporter::store_secret( 'a-secret' );
		Reprint_Exporter::discard_credentials();

		$discards = array_values( array_filter( $this->recorded_events, fn( $e ) => 'credentials_discarded' === $e[0] ) );
		$this->assertCount( 1, $discards );
		$this->assertArrayHasKey( 'boundary', $discards[0][1] );
	}

	/**
	 * No event, served or refused, ever carries the secret.
	 */
	public function test_events_never_carry_the_secret() {
		$this->capture_events();
		wp_set_current_user( $this->factory()->user->create( array( 'role' => 'administrator' ) ) );
		$secret = ( new REST_Controller() )->rotate_secret()->get_data()['secret'];
		( new REST_Controller() )->enable_export();

		$served = $this->make_ready_stub();
		$this->run_handler( $served, $this->make_wp( '' ) );
		$refused                  = $this->make_ready_stub();
		$refused->signature_error = array(
			'message' => 'Invalid signature.',
			'reason'  => 'signature_mismatch',
		);
		$this->run_handler( $refused, $this->make_wp( '' ) );

		$this->assertTrue( $served->served, 'Fixture must serve once.' );
		$this->assertSame( 403, $refused->error_code, 'Fixture must refuse once.' );
		$this->assertStringNotContainsString( $secret, wp_json_encode( $this->recorded_events, JSON_UNESCAPED_SLASHES ) );
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
		$this->assertArrayHasKey( '/jetpack/v4/reprint/install-public-key', $routes );
		$this->assertArrayHasKey( '/jetpack/v4/reprint/enable-export', $routes );

		remove_action( 'rest_api_init', array( Reprint_Exporter::class, 'register_rest_routes' ) );
		$wp_rest_server = null;
	}

	// -- Provisioning ------------------------------------------------------

	/**
	 * Re-saving an unchanged secret still reports success.
	 */
	public function test_store_secret_reports_success_for_an_unchanged_secret() {
		Reprint_Exporter::store_secret( 'a-secret' );
		$this->assertTrue( Reprint_Exporter::store_secret( 'a-secret' ) );
	}

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
	 *
	 * Single site only: on multisite the administrator role is per-subsite and
	 * says nothing about the network, so the rule there is different — see
	 * test_permission_check_denies_subsite_administrator().
	 */
	public function test_permission_check_allows_administrative_user_token() {
		$this->skipWithMultisite();

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
	 * On multisite, a subsite administrator is refused.
	 *
	 * The export takes every table in the database and everything under
	 * ABSPATH, so a subsite administrator would obtain every other site's
	 * users, content and uploads.
	 */
	public function test_permission_check_denies_subsite_administrator() {
		$this->skipWithoutMultisite();

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		$this->assertFalse( is_super_admin( $user_id ), 'Fixture must not be a network administrator.' );

		wp_set_current_user( $user_id );
		$this->set_jetpack_rest_authentication_type( 'user' );

		$this->assertFalse( ( new REST_Controller() )->permission_check() );
	}

	/**
	 * On multisite, a network administrator is allowed.
	 */
	public function test_permission_check_allows_network_administrator() {
		$this->skipWithoutMultisite();

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		grant_super_admin( $user_id );

		wp_set_current_user( $user_id );
		$this->set_jetpack_rest_authentication_type( 'user' );

		$this->assertTrue( ( new REST_Controller() )->permission_check() );

		revoke_super_admin( $user_id );
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
	 * Rotate, open, export: the normal path end to end.
	 */
	public function test_rotate_open_and_export_round_trip() {
		Constants::set_constant( 'IS_PRESSABLE', true );
		$secret = ( new REST_Controller() )->rotate_secret()->get_data()['secret'];
		( new REST_Controller() )->enable_export();
		$_GET['reprint-api-jetpack'] = '1';
		$_SERVER['REQUEST_METHOD']   = 'GET';

		$stub = new Reprint_Exporter_Test_Stub();
		$this->run_handler( $stub, $this->make_wp( '' ) );

		$this->assertTrue( $stub->served );
		$this->assertNull( $stub->error_code );
		$this->assertSame( $secret, $stub->verified_secret );
	}

	/**
	 * Builds an install-public-key request.
	 *
	 * @param mixed $public_key The public_key param.
	 * @return WP_REST_Request
	 */
	private function install_request( $public_key ) {
		$request = new WP_REST_Request( 'POST', '/jetpack/v4/reprint/install-public-key' );
		$request->set_param( 'public_key', $public_key );
		return $request;
	}

	/**
	 * Installing returns the key id the client derives, stores the canonical form, and replaces an earlier key.
	 */
	public function test_install_public_key_stores_and_replaces() {
		Utils::override_key_auth_required_for_tests( true );
		list( $private_key, $public_key ) = self::keypair();
		Reprint_Exporter::store_public_key( 'MIIBearlier' );
		$pem = "-----BEGIN PUBLIC KEY-----\r\n" . chunk_split( $public_key, 64, "\r\n" ) . "-----END PUBLIC KEY-----\r\n  ";

		$response = ( new REST_Controller() )->install_public_key( $this->install_request( $pem ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( ( new PublicKeyClient( $private_key ) )->get_key_id(), $response->get_data()['key_id'] );
		$this->assertSame( home_url( '/?reprint-api-jetpack' ), $response->get_data()['export_url'] );
		$this->assertSame( $public_key, get_option( Reprint_Exporter::PUBLIC_KEY_OPTION ) );
		$this->assertTrue( Reprint_Exporter::get_state()['has_credential'] );
	}

	/**
	 * Re-installing the stored key succeeds, though update_option() reports no change.
	 */
	public function test_install_public_key_retry_with_the_same_key_succeeds() {
		Utils::override_key_auth_required_for_tests( true );
		$public_key = self::keypair()[1];
		$first      = ( new REST_Controller() )->install_public_key( $this->install_request( $public_key ) );

		$retry = ( new REST_Controller() )->install_public_key( $this->install_request( $public_key ) );

		$this->assertSame( 200, $retry->get_status() );
		$this->assertSame( $first->get_data()['key_id'], $retry->get_data()['key_id'] );
	}

	/**
	 * Provisioning one scheme deletes the other, so it cannot revive if OpenSSL availability changes.
	 *
	 * @dataProvider provide_provisioning_routes
	 *
	 * @param bool   $key_auth Whether the host requires key auth.
	 * @param string $route    'install' or 'rotate'.
	 * @param string $cleared  The option the route must delete.
	 */
	#[DataProvider( 'provide_provisioning_routes' )]
	public function test_provisioning_clears_the_other_scheme( $key_auth, $route, $cleared ) {
		Reprint_Exporter::store_secret( 'a-secret' );
		Reprint_Exporter::store_public_key( 'MIIBkey' );
		Utils::override_key_auth_required_for_tests( $key_auth );

		$response = 'install' === $route
			? ( new REST_Controller() )->install_public_key( $this->install_request( self::keypair()[1] ) )
			: ( new REST_Controller() )->rotate_secret();

		$this->assertSame( 200, $response->get_status() );
		$this->assertFalse( get_option( $cleared ) );
	}

	/**
	 * Host mode, route, the option it must clear.
	 *
	 * @return array<string, array{bool, string, string}>
	 */
	public static function provide_provisioning_routes() {
		return array(
			'install clears the secret' => array( true, 'install', Reprint_Exporter::SECRET_OPTION ),
			'rotate clears the key'     => array( false, 'rotate', Reprint_Exporter::PUBLIC_KEY_OPTION ),
		);
	}

	/**
	 * Installing reports the key id and never the key itself.
	 */
	public function test_install_public_key_reports_an_event_without_the_key() {
		Utils::override_key_auth_required_for_tests( true );
		$this->capture_events();
		$public_key = self::keypair()[1];

		( new REST_Controller() )->install_public_key( $this->install_request( $public_key ) );

		$this->assertSame( array( 'public_key_installed' ), array_column( $this->recorded_events, 0 ) );
		$this->assertArrayHasKey( 'key_id', $this->recorded_events[0][1] );
		$this->assertStringNotContainsString( $public_key, wp_json_encode( $this->recorded_events, JSON_UNESCAPED_SLASHES ) );
	}

	/**
	 * Keys that are not RSA public keys of at least 3072 bits are refused.
	 *
	 * @dataProvider provide_invalid_public_keys
	 *
	 * @param string $kind Which bad key to build.
	 */
	#[DataProvider( 'provide_invalid_public_keys' )]
	public function test_install_public_key_rejects_invalid_keys( $kind ) {
		Utils::override_key_auth_required_for_tests( true );
		switch ( $kind ) {
			case 'private':
				$value = self::keypair()[0];
				break;
			case 'pkcs1':
				$value = "-----BEGIN RSA PUBLIC KEY-----\nMIIBCgKCAQEA\n-----END RSA PUBLIC KEY-----";
				break;
			case 'rsa-2048':
				$value = openssl_pkey_get_details(
					openssl_pkey_new(
						array(
							'private_key_bits' => 2048,
							'private_key_type' => OPENSSL_KEYTYPE_RSA,
						)
					)
				)['key'];
				break;
			case 'ec':
				$value = openssl_pkey_get_details(
					openssl_pkey_new(
						array(
							'curve_name'       => 'prime256v1',
							'private_key_type' => OPENSSL_KEYTYPE_EC,
						)
					)
				)['key'];
				break;
			default:
				$value = 'not a key';
		}

		$response = ( new REST_Controller() )->install_public_key( $this->install_request( $value ) );

		$this->assertWPError( $response );
		$this->assertSame( 'jetpack_reprint_invalid_public_key', $response->get_error_code() );
		$this->assertSame( 400, $response->get_error_data()['status'] );
		$this->assertFalse( get_option( Reprint_Exporter::PUBLIC_KEY_OPTION ) );
	}

	/**
	 * Bad key kinds.
	 *
	 * @return array<string, array{string}>
	 */
	public static function provide_invalid_public_keys() {
		return array(
			'private key'  => array( 'private' ),
			'PKCS#1'       => array( 'pkcs1' ),
			'2048-bit RSA' => array( 'rsa-2048' ),
			'EC'           => array( 'ec' ),
			'garbage'      => array( 'garbage' ),
		);
	}

	/**
	 * Each provisioning route refuses the scheme the host does not accept.
	 *
	 * @dataProvider provide_unsupported_schemes
	 *
	 * @param bool   $key_auth Whether the host requires key auth.
	 * @param string $method   Controller method.
	 * @param string $code     Expected error code.
	 */
	#[DataProvider( 'provide_unsupported_schemes' )]
	public function test_provisioning_refuses_the_unaccepted_scheme( $key_auth, $method, $code ) {
		Utils::override_key_auth_required_for_tests( $key_auth );

		$response = ( new REST_Controller() )->$method( $this->install_request( self::keypair()[1] ) );

		$this->assertWPError( $response );
		$this->assertSame( $code, $response->get_error_code() );
		$this->assertSame( 501, $response->get_error_data()['status'] );
		$this->assertFalse( get_option( Reprint_Exporter::SECRET_OPTION ) );
		$this->assertFalse( get_option( Reprint_Exporter::PUBLIC_KEY_OPTION ) );
	}

	/**
	 * Host mode, route method, error code.
	 *
	 * @return array<string, array{bool, string, string}>
	 */
	public static function provide_unsupported_schemes() {
		return array(
			'secret on a key host' => array( true, 'rotate_secret', 'jetpack_reprint_secret_auth_unsupported' ),
			'key on a token host'  => array( false, 'install_public_key', 'jetpack_reprint_key_auth_unsupported' ),
		);
	}

	/**
	 * The enable-export route opens a window only for a credential the host accepts.
	 *
	 * @dataProvider provide_enable_export_cases
	 *
	 * @param bool   $key_auth   Whether the host requires key auth.
	 * @param string $credential 'secret' or 'key'.
	 * @param int    $status     Expected status.
	 */
	#[DataProvider( 'provide_enable_export_cases' )]
	public function test_enable_export_requires_an_accepted_credential( $key_auth, $credential, $status ) {
		Utils::override_key_auth_required_for_tests( $key_auth );
		if ( 'secret' === $credential ) {
			Reprint_Exporter::store_secret( 'a-secret' );
		} else {
			Reprint_Exporter::store_public_key( 'MIIBkey' );
		}
		$secret_before = get_option( Reprint_Exporter::SECRET_OPTION );
		$key_before    = get_option( Reprint_Exporter::PUBLIC_KEY_OPTION );

		$response = rest_ensure_response( ( new REST_Controller() )->enable_export() );

		$this->assertSame( $status, is_wp_error( $response ) ? $response->get_error_data()['status'] : $response->get_status() );
		$this->assertSame( 200 === $status, Reprint_Exporter::is_export_window_open() );
		if ( 200 === $status ) {
			$this->assertSame( (int) get_option( Reprint_Exporter::ENABLED_OPTION ), $response->get_data()['enabled_at'] );
			$this->assertSame( $secret_before, get_option( Reprint_Exporter::SECRET_OPTION ) );
			$this->assertSame( $key_before, get_option( Reprint_Exporter::PUBLIC_KEY_OPTION ) );
		}
	}

	/**
	 * Host mode, stored credential, expected status.
	 *
	 * @return array<string, array{bool, string, int}>
	 */
	public static function provide_enable_export_cases() {
		return array(
			'key host, key'      => array( true, 'key', 200 ),
			'key host, secret'   => array( true, 'secret', 409 ),
			'token host, secret' => array( false, 'secret', 200 ),
			'token host, key'    => array( false, 'key', 409 ),
		);
	}

	/**
	 * Dispatches a request through a fresh REST server with the Reprint routes registered.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response
	 */
	private function dispatch_rest( WP_REST_Request $request ) {
		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		add_action( 'rest_api_init', array( Reprint_Exporter::class, 'register_rest_routes' ) );
		do_action( 'rest_api_init' );

		$response = $wp_rest_server->dispatch( $request );

		remove_action( 'rest_api_init', array( Reprint_Exporter::class, 'register_rest_routes' ) );
		$wp_rest_server = null;
		return $response;
	}

	/**
	 * The route refuses unauthenticated callers, so it cannot be registered with a weaker check.
	 */
	public function test_install_public_key_route_refuses_unauthenticated_requests() {
		Utils::override_key_auth_required_for_tests( true );

		$response = $this->dispatch_rest( $this->install_request( self::keypair()[1] ) );

		$this->assertSame( 401, $response->get_status() );
		$this->assertFalse( get_option( Reprint_Exporter::PUBLIC_KEY_OPTION ) );
	}

	/**
	 * Malformed public_key params are refused by the schema before OpenSSL sees them.
	 *
	 * @dataProvider provide_malformed_public_key_params
	 *
	 * @param mixed $public_key The param.
	 */
	#[DataProvider( 'provide_malformed_public_key_params' )]
	public function test_install_public_key_route_rejects_malformed_params( $public_key ) {
		Utils::override_key_auth_required_for_tests( true );

		$response = $this->dispatch_rest( $this->install_request( $public_key ) );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_invalid_param', $response->get_data()['code'] );
	}

	/**
	 * Oversized and non-string params.
	 *
	 * @return array<string, array{mixed}>
	 */
	public static function provide_malformed_public_key_params() {
		return array(
			'over 4096 bytes' => array( str_repeat( 'A', 4097 ) ),
			'array'           => array( array( 'MIIB' ) ),
			'number'          => array( 12345 ),
		);
	}

	// -- Export window helper -------------------------------------------------

	/**
	 * A missing, stale, or future enabled timestamp keeps the window closed.
	 */
	public function test_export_window_closed_when_missing_stale_or_future() {
		// One fixed time for both the stored value and the check, so the
		// boundaries below are exact.
		$now  = time();
		$skew = Reprint_Exporter::CLOCK_SKEW;

		$this->assertFalse( Reprint_Exporter::is_export_window_open( $now ) );

		$this->plant_option( Reprint_Exporter::ENABLED_OPTION, $now - ( HOUR_IN_SECONDS + 1 ) );
		$this->assertFalse( Reprint_Exporter::is_export_window_open( $now ), 'A second past the hour is stale.' );

		$this->plant_option( Reprint_Exporter::ENABLED_OPTION, $now - HOUR_IN_SECONDS );
		$this->assertTrue( Reprint_Exporter::is_export_window_open( $now ), 'Exactly an hour old still counts.' );

		$this->plant_option( Reprint_Exporter::ENABLED_OPTION, $now + $skew + 1 );
		$this->assertFalse( Reprint_Exporter::is_export_window_open( $now ), 'A second past the skew tolerance is rejected.' );

		$this->plant_option( Reprint_Exporter::ENABLED_OPTION, $now + $skew );
		$this->assertTrue( Reprint_Exporter::is_export_window_open( $now ), 'Exactly the skew tolerance is allowed.' );

		Reprint_Exporter::open_export_window();
		$this->assertTrue( Reprint_Exporter::is_export_window_open() );
	}

	// -- Export request handler -----------------------------------------------

	/**
	 * Test key pair, generated once: 3072-bit RSA generation is slow.
	 *
	 * @var array{0:string,1:string}|null
	 */
	private static $keypair = null;

	/**
	 * The shared test key pair: private PEM, one-line public key.
	 *
	 * @return array{0:string,1:string}
	 */
	private static function keypair() {
		if ( null === self::$keypair ) {
			self::$keypair = PublicKeyClient::generate_keypair();
		}
		return self::$keypair;
	}

	/**
	 * Signs the current export request with a Reprint client, as it would in production.
	 *
	 * @param PublicKeyClient|\Site_Export_HMAC_Client $client Signing client.
	 */
	private function sign_request( $client ) {
		$_SERVER['REQUEST_URI'] = '/?reprint-api-jetpack&endpoint=preflight';
		$headers                = $client->get_auth_headers( 'GET', home_url( $_SERVER['REQUEST_URI'] ) );
		foreach ( $headers as $name => $value ) {
			$_SERVER[ 'HTTP_' . strtoupper( str_replace( '-', '_', $name ) ) ] = $value;
		}
	}

	/**
	 * A request signed with the enrolled key is served, with a leftover secret ignored.
	 */
	public function test_key_signed_request_serves_export() {
		Utils::override_key_auth_required_for_tests( true );
		list( $private_key, $public_key ) = self::keypair();
		Reprint_Exporter::store_secret( 'leftover-secret' );
		Reprint_Exporter::store_public_key( $public_key );
		$stub                    = $this->make_ready_stub();
		$stub->real_verification = true;
		$this->sign_request( new PublicKeyClient( $private_key ) );

		$this->run_handler( $stub, $this->make_wp( '' ) );

		$this->assertNull( $stub->error_code );
		$this->assertTrue( $stub->served );
	}

	/**
	 * A request signed with the stored secret by the real HMAC client is served on a token host.
	 */
	public function test_hmac_signed_request_serves_export() {
		Reprint_Exporter::store_secret( 'a-secret' );
		$stub                    = $this->make_ready_stub();
		$stub->real_verification = true;
		$this->sign_request( new \Site_Export_HMAC_Client( 'a-secret' ) );

		$this->run_handler( $stub, $this->make_wp( '' ) );

		$this->assertNull( $stub->error_code );
		$this->assertTrue( $stub->served );
	}

	/**
	 * A request signed with a key that is not enrolled is refused with its reason.
	 */
	public function test_request_signed_with_another_key_is_refused() {
		Utils::override_key_auth_required_for_tests( true );
		Reprint_Exporter::store_public_key( self::keypair()[1] );
		$this->capture_events();
		$stub                      = $this->make_ready_stub();
		$stub->real_verification   = true;
		list( $other_private_key ) = PublicKeyClient::generate_keypair();
		$this->sign_request( new PublicKeyClient( $other_private_key ) );

		$body = $this->run_handler( $stub, $this->make_wp( '' ) );

		$this->assertSame( 403, $stub->error_code );
		$this->assertSame( RequestAuthenticator::REASON_UNKNOWN_KEY, $stub->error_reason );
		$this->assertStringContainsString( '"reason":"unknown_key"', $body );
		$this->assertStringContainsString( '"auth_version":' . Utils::AUTH_VERSION, $body );
		$this->assertFalse( $stub->served );

		// Event consumers must not receive the attacker-controlled key id.
		$refused = array_values( array_filter( $this->recorded_events, fn( $e ) => 'export_refused' === $e[0] ) );
		$this->assertCount( 1, $refused );
		$this->assertSame( RequestAuthenticator::REASON_UNKNOWN_KEY, $refused[0][1]['reason_code'] );
		$this->assertStringNotContainsString( $_SERVER['HTTP_X_AUTH_KEY_ID'], wp_json_encode( $refused[0][1], JSON_UNESCAPED_SLASHES ) );
	}

	/**
	 * Authentication reasons map to status codes the Reprint client reads.
	 *
	 * @dataProvider provide_auth_failure_statuses
	 *
	 * @param string $reason Reprint reason code.
	 * @param int    $status Expected HTTP status.
	 */
	#[DataProvider( 'provide_auth_failure_statuses' )]
	public function test_auth_failure_reason_sets_the_status( $reason, $status ) {
		$stub                  = $this->make_ready_stub();
		$stub->signature_error = array(
			'message' => 'Refused.',
			'reason'  => $reason,
		);
		Reprint_Exporter::store_secret( 'a-secret' );

		$this->run_handler( $stub, $this->make_wp( '' ) );

		$this->assertSame( $status, $stub->error_code );
		$this->assertSame( $reason, $stub->error_reason );
	}

	/**
	 * Reason, status.
	 *
	 * @return array<string, array{string, int}>
	 */
	public static function provide_auth_failure_statuses() {
		return array(
			'not configured'   => array( RequestAuthenticator::REASON_NOT_CONFIGURED, 503 ),
			'no keys enrolled' => array( RequestAuthenticator::REASON_NO_KEYS_ENROLLED, 503 ),
			'bad signature'    => array( 'signature_mismatch', 403 ),
		);
	}

	/**
	 * Push endpoints write to the site, so the exporter must never register them.
	 *
	 * @dataProvider provide_push_endpoints
	 *
	 * @param string $endpoint A push endpoint name.
	 */
	#[DataProvider( 'provide_push_endpoints' )]
	public function test_push_endpoints_are_not_served( $endpoint ) {
		$this->expectException( InvalidArgumentException::class );
		$this->expectExceptionMessage( "Invalid endpoint: '{$endpoint}'" );

		( new HTTPServer( Reprint_Exporter::http_server_options() ) )->dispatch( array( 'endpoint' => $endpoint ) );
	}

	/**
	 * Push endpoint names from both push families.
	 *
	 * @return array<string, array{string}>
	 */
	public static function provide_push_endpoints() {
		return array(
			'file push'     => array( 'push_create' ),
			'database push' => array( 'push_db_create' ),
		);
	}

	/**
	 * Builds a stub with the feature available and the window open.
	 *
	 * @return Reprint_Exporter_Test_Stub
	 */
	private function make_ready_stub() {
		Constants::set_constant( 'IS_PRESSABLE', true );
		Reprint_Exporter::open_export_window();
		$_GET['reprint-api-jetpack'] = '1';
		$_SERVER['REQUEST_METHOD']   = 'GET';
		return new Reprint_Exporter_Test_Stub();
	}

	/**
	 * No reprint-api-jetpack query param: the handler does nothing.
	 */
	public function test_ignores_request_without_query_param() {
		Constants::set_constant( 'IS_PRESSABLE', true );
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
		Constants::set_constant( 'IS_PRESSABLE', true );
		$_GET['reprint-api-jetpack'] = '1';
		$_SERVER['REQUEST_METHOD']   = 'GET';
		$stub                        = new Reprint_Exporter_Test_Stub();
		$this->run_handler( $stub, $this->make_wp( '' ) );
		$this->assertFalse( $stub->served );
		$this->assertFalse( $stub->terminated );
	}

	/**
	 * A closed window with a valid signature reports 409 rather than nothing.
	 *
	 * Lets a client tell "the site still has the exporter, re-arm it" from "the
	 * site no longer has it", which were the same silent response before.
	 */
	public function test_closed_window_returns_409_to_a_valid_signature() {
		Constants::set_constant( 'IS_PRESSABLE', true );
		Reprint_Exporter::store_secret( 'a-secret' );
		$_GET['reprint-api-jetpack'] = '1';
		$_SERVER['REQUEST_METHOD']   = 'GET';

		$stub = new Reprint_Exporter_Test_Stub();
		$body = $this->run_handler( $stub, $this->make_wp( '' ) );

		$this->assertSame( 409, $stub->error_code );
		$this->assertStringContainsString( '"code":409', $body );
		$this->assertSame( 'a-secret', $stub->verified_secret, 'The signature must be checked before reporting the window state.' );
		$this->assertFalse( $stub->served );
	}

	/**
	 * A closed window still says nothing to a caller without a valid signature.
	 */
	public function test_closed_window_stays_silent_without_a_valid_signature() {
		Constants::set_constant( 'IS_PRESSABLE', true );
		Reprint_Exporter::store_secret( 'a-secret' );
		$_GET['reprint-api-jetpack'] = '1';
		$_SERVER['REQUEST_METHOD']   = 'GET';

		$stub                  = new Reprint_Exporter_Test_Stub();
		$stub->signature_error = array(
			'message' => 'Invalid signature.',
			'reason'  => 'signature_mismatch',
		);
		$body                  = $this->run_handler( $stub, $this->make_wp( '' ) );

		$this->assertNull( $stub->error_code );
		$this->assertSame( '', $body );
		$this->assertFalse( $stub->terminated );
	}

	/**
	 * A closed window says nothing when no secret has ever been minted.
	 */
	public function test_closed_window_stays_silent_without_a_secret() {
		Constants::set_constant( 'IS_PRESSABLE', true );
		$_GET['reprint-api-jetpack'] = '1';
		$_SERVER['REQUEST_METHOD']   = 'GET';

		$stub = new Reprint_Exporter_Test_Stub();
		$body = $this->run_handler( $stub, $this->make_wp( '' ) );

		$this->assertNull( $stub->error_code );
		$this->assertSame( '', $body );
	}

	/**
	 * The preflight answers even when the window is closed.
	 *
	 * A client whose window lapsed has to complete a preflight before it can
	 * send the signed request that earns the 409.
	 */
	public function test_options_preflight_answers_when_window_closed() {
		Constants::set_constant( 'IS_PRESSABLE', true );
		$_GET['reprint-api-jetpack'] = '1';
		$_SERVER['REQUEST_METHOD']   = 'OPTIONS';

		$stub = new Reprint_Exporter_Test_Stub();
		$this->run_handler( $stub, $this->make_wp( '' ) );

		$this->assertTrue( $stub->terminated );
		$this->assertFalse( $stub->served );
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
	public function test_invalid_signature_returns_403() {
		$stub                  = $this->make_ready_stub();
		$stub->signature_error = array(
			'message' => 'Invalid signature.',
			'reason'  => 'signature_mismatch',
		);
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
	public function test_valid_signature_serves_export() {
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
		$this->capture_events();
		$stub              = $this->make_ready_stub();
		$stub->serve_error = new \InvalidArgumentException( 'endpoint parameter is required.' );
		Reprint_Exporter::store_secret( 'a-secret' );

		$body = $this->run_handler( $stub, $this->make_wp( '' ) );

		$this->assertSame( 400, $stub->error_code );
		$this->assertStringContainsString( '"code":400', $body );
		$this->assertStringContainsString( 'endpoint parameter is required.', $body );
		$refused = array_values( array_filter( $this->recorded_events, fn( $e ) => 'export_refused' === $e[0] ) );
		$this->assertSame( 'invalid_request', $refused[0][1]['reason'] );
		$this->assertStringNotContainsString( 'endpoint parameter', wp_json_encode( $refused[0][1], JSON_UNESCAPED_SLASHES ) );
		$this->assertTrue( $stub->served );
		$this->assertTrue( $stub->terminated );
	}
}
