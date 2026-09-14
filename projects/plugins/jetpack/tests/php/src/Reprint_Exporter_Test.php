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
	 * Events captured from jetpack_reprint_export_event during a test.
	 *
	 * @var array[]
	 */
	private $recorded_events = array();

	/**
	 * Test set up.
	 */
	public function set_up() {
		parent::set_up();
		// The WordPress test config fills every salt with the placeholder, which
		// the exporter refuses, so give the tests a salt it will accept.
		$this->use_usable_salt();
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
		delete_option( Reprint_Exporter::SECRET_HASH_OPTION );
		delete_option( Reprint_Exporter::ENABLED_HASH_OPTION );
		unset( $_GET['reprint-api-jetpack'], $_GET['endpoint'], $_SERVER['REQUEST_METHOD'] );
		parent::tear_down();
	}

	/**
	 * Sets AUTH_SALT to a value the exporter accepts.
	 *
	 * @param string $salt The salt; defaults to one long enough to pass.
	 * @return string The salt in force.
	 */
	private function use_usable_salt( $salt = 'first-usable-salt-value-first-usable-salt-value-first-usable-salt' ) {
		Constants::set_constant( 'AUTH_SALT', $salt );
		return $salt;
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
	 * Plants a window timestamp with the hash the current AUTH_SALT gives it.
	 *
	 * Stands in for a stamp the exporter itself made at some other time, which
	 * open_export_window() cannot produce because it always stamps now.
	 *
	 * @param int $enabled_at Unix timestamp to store.
	 */
	private function plant_window( $enabled_at ) {
		$this->plant_option( Reprint_Exporter::ENABLED_OPTION, $enabled_at );
		$this->plant_option(
			Reprint_Exporter::ENABLED_HASH_OPTION,
			hash_hmac( 'sha256', Reprint_Exporter::ENABLED_HASH_OPTION . "\0" . $enabled_at, Constants::get_constant( 'AUTH_SALT' ) )
		);
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

		// The option itself, not the window state: a stamp without a hash reads
		// as closed anyway, so that alone would not show the guard held.
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
	 * A foreign write to either hash is refused, as for the two original options.
	 *
	 * A hash an attacker could rewrite would be no protection at all: they
	 * would store their own secret and then a hash for it.
	 */
	public function test_foreign_update_of_the_hashes_is_refused() {
		Reprint_Exporter::store_secret( 'the-real-secret' );
		Reprint_Exporter::open_export_window();
		Reprint_Exporter::protect_options();
		$secret_hash = get_option( Reprint_Exporter::SECRET_HASH_OPTION );
		$window_hash = get_option( Reprint_Exporter::ENABLED_HASH_OPTION );
		$this->assertNotFalse( $secret_hash, 'Fixture must have stored a secret hash.' );
		$this->assertNotFalse( $window_hash, 'Fixture must have stored a window hash.' );

		update_option( Reprint_Exporter::SECRET_HASH_OPTION, 'attacker-chosen' );
		update_option( Reprint_Exporter::ENABLED_HASH_OPTION, 'attacker-chosen' );

		$this->assertSame( $secret_hash, get_option( Reprint_Exporter::SECRET_HASH_OPTION ) );
		$this->assertSame( $window_hash, get_option( Reprint_Exporter::ENABLED_HASH_OPTION ) );
	}

	/**
	 * A foreign write cannot create either hash from scratch either.
	 */
	public function test_foreign_write_cannot_create_the_hashes() {
		Reprint_Exporter::protect_options();

		update_option( Reprint_Exporter::SECRET_HASH_OPTION, 'attacker-chosen' );
		update_option( Reprint_Exporter::ENABLED_HASH_OPTION, 'attacker-chosen' );

		$this->assertFalse( get_option( Reprint_Exporter::SECRET_HASH_OPTION ) );
		$this->assertFalse( get_option( Reprint_Exporter::ENABLED_HASH_OPTION ) );
	}

	/**
	 * A direct add_option() of a hash stops the request.
	 */
	public function test_foreign_add_option_of_a_hash_aborts() {
		Reprint_Exporter::protect_options();

		$this->expectException( WPDieException::class );
		add_option( Reprint_Exporter::ENABLED_HASH_OPTION, 'attacker-chosen' );
	}

	/**
	 * Discarding clears the hashes along with the values they cover.
	 */
	public function test_discard_credentials_clears_the_hashes() {
		Reprint_Exporter::store_secret( 'a-secret' );
		Reprint_Exporter::open_export_window();
		$this->assertNotFalse( get_option( Reprint_Exporter::SECRET_HASH_OPTION ), 'Fixture must have stored a secret hash.' );
		$this->assertNotFalse( get_option( Reprint_Exporter::ENABLED_HASH_OPTION ), 'Fixture must have stored a window hash.' );

		Reprint_Exporter::discard_credentials();

		$this->assertFalse( get_option( Reprint_Exporter::SECRET_HASH_OPTION ) );
		$this->assertFalse( get_option( Reprint_Exporter::ENABLED_HASH_OPTION ) );
	}

	/**
	 * Discarding reports a stray hash too, not only a stray value.
	 */
	public function test_discard_reports_a_planted_hash() {
		$this->capture_events();
		$this->plant_option( Reprint_Exporter::SECRET_HASH_OPTION, 'planted-by-someone-else' );

		Reprint_Exporter::discard_credentials();

		$this->assertFalse( get_option( Reprint_Exporter::SECRET_HASH_OPTION ) );
		$this->assertSame( array( 'credentials_discarded' ), array_column( $this->recorded_events, 0 ) );
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
		$this->plant_window( time() );
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
		$this->plant_window( time() );
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
		$this->plant_window( time() );
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

		$stub             = $this->make_ready_stub();
		$stub->hmac_error = 'Invalid signature.';
		Reprint_Exporter::store_secret( 'a-secret' );
		$this->run_handler( $stub, $this->make_wp( '' ) );

		$refusals = array_values( array_filter( $this->recorded_events, fn( $e ) => 'export_refused' === $e[0] ) );
		$this->assertCount( 1, $refusals );
		$this->assertSame( 403, $refusals[0][1]['code'] );
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

		( new REST_Controller() )->enable_export();
		( new REST_Controller() )->rotate_secret();

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
	 * No event ever carries the secret or either hash.
	 *
	 * Runs the whole lifecycle, mismatches included, so every event name the
	 * exporter can fire is in the capture.
	 */
	public function test_events_never_carry_the_secret_or_a_hash() {
		$this->capture_events();

		$user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );
		$response    = ( new REST_Controller() )->rotate_secret();
		$secret      = $response->get_data()['secret'];
		$secret_hash = get_option( Reprint_Exporter::SECRET_HASH_OPTION );
		( new REST_Controller() )->enable_export();
		$window_hash = get_option( Reprint_Exporter::ENABLED_HASH_OPTION );
		$this->assertNotFalse( $secret_hash, 'Fixture must have stored a secret hash.' );
		$this->assertNotFalse( $window_hash, 'Fixture must have stored a window hash.' );

		$stub = $this->make_ready_stub();
		$this->run_handler( $stub, $this->make_wp( '' ) );
		$this->assertTrue( $stub->served, 'Fixture must serve before the salt changes.' );

		$this->use_usable_salt( 'second-usable-salt-value-second-usable-salt-value-second-salt' );
		( new REST_Controller() )->enable_export();
		$this->run_handler( new Reprint_Exporter_Test_Stub(), $this->make_wp( '' ) );

		$names = array_column( $this->recorded_events, 0 );
		$this->assertContains( 'credential_hash_mismatch', $names, 'Fixture must have produced a mismatch event.' );

		$serialized = wp_json_encode( $this->recorded_events, JSON_UNESCAPED_SLASHES );
		$this->assertStringNotContainsString( $secret, $serialized );
		$this->assertStringNotContainsString( $secret_hash, $serialized );
		$this->assertStringNotContainsString( $window_hash, $serialized );
	}

	/**
	 * A secret whose hash does not match reports an event.
	 */
	public function test_secret_hash_mismatch_reports_an_event() {
		$this->capture_events();

		$stub = $this->make_ready_stub();
		$this->plant_option( Reprint_Exporter::SECRET_OPTION, 'planted-by-someone-else' );
		$this->run_handler( $stub, $this->make_wp( '' ) );

		$this->assertCount( 1, array_filter( $this->recorded_events, fn( $e ) => 'credential_hash_mismatch' === $e[0] ) );
	}

	/**
	 * A current window timestamp whose hash does not match gets the same 409 as
	 * a lapsed one.
	 *
	 * The caller holds the real secret, and re-arming fixes both cases, so
	 * there is nothing to tell apart.
	 */
	public function test_window_hash_mismatch_returns_409() {
		Constants::set_constant( 'IS_PRESSABLE', true );
		Reprint_Exporter::store_secret( 'a-secret' );
		$this->plant_option( Reprint_Exporter::ENABLED_OPTION, time() );
		$this->plant_option( Reprint_Exporter::ENABLED_HASH_OPTION, 'planted-by-someone-else' );
		$_GET['reprint-api-jetpack'] = '1';
		$_SERVER['REQUEST_METHOD']   = 'GET';

		$stub = new Reprint_Exporter_Test_Stub();
		$this->run_handler( $stub, $this->make_wp( '' ) );

		$this->assertSame( 409, $stub->error_code );
		$this->assertFalse( $stub->served );
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
	 * Rotating stores a hash binding the secret to AUTH_SALT.
	 */
	public function test_rotate_secret_stores_a_salt_hash() {
		$salt     = $this->use_usable_salt();
		$response = ( new REST_Controller() )->rotate_secret();
		$secret   = $response->get_data()['secret'];

		$this->assertSame(
			hash_hmac( 'sha256', Reprint_Exporter::SECRET_HASH_OPTION . "\0" . $secret, $salt ),
			get_option( Reprint_Exporter::SECRET_HASH_OPTION )
		);
	}

	/**
	 * Rotation refuses, storing nothing, when AUTH_SALT is not defined.
	 *
	 * The test config defines AUTH_SALT, so a null through the constants
	 * manager stands in for an undefined one.
	 */
	public function test_rotate_secret_refuses_without_auth_salt() {
		Constants::set_constant( 'AUTH_SALT', null );

		$this->assert_rotation_refused();
	}

	/**
	 * Rotation refuses a short AUTH_SALT.
	 */
	public function test_rotate_secret_refuses_a_short_auth_salt() {
		$this->use_usable_salt( str_repeat( 's', 31 ) );

		$this->assert_rotation_refused();
	}

	/**
	 * Exactly 32 bytes is enough.
	 */
	public function test_rotate_secret_accepts_a_32_byte_auth_salt() {
		$this->use_usable_salt( str_repeat( 's', 32 ) );

		$this->assertSame( 200, ( new REST_Controller() )->rotate_secret()->get_status() );
	}

	/**
	 * Rotation refuses the wp-config placeholder.
	 *
	 * The length check already rejects the English placeholder; this pins the
	 * literal comparison so a shorter placeholder cannot slip through.
	 */
	public function test_rotate_secret_refuses_the_placeholder_auth_salt() {
		$this->use_usable_salt( 'put your unique phrase here' );

		$this->assert_rotation_refused();
	}

	/**
	 * Asserts that rotation answers 500 and leaves no credential behind.
	 */
	private function assert_rotation_refused() {
		$response = ( new REST_Controller() )->rotate_secret();

		$this->assertSame( 500, $response->get_status() );
		$this->assertArrayHasKey( 'error', $response->get_data() );
		$this->assertStringContainsString( 'AUTH_SALT', $response->get_data()['error'] );
		$this->assertFalse( get_option( Reprint_Exporter::SECRET_OPTION ) );
		$this->assertFalse( get_option( Reprint_Exporter::SECRET_HASH_OPTION ) );
	}

	/**
	 * Enabling refuses without a usable salt rather than stamping a window
	 * that can never read as open.
	 *
	 * A 200 here would send the client off to an export endpoint that answers
	 * nothing, with no clue why.
	 */
	public function test_enable_export_refuses_without_a_usable_salt() {
		$this->capture_events();
		$this->use_usable_salt( 'put your unique phrase here' );

		$response = ( new REST_Controller() )->enable_export();

		$this->assertSame( 500, $response->get_status() );
		$this->assertStringContainsString( 'AUTH_SALT', $response->get_data()['error'] );
		$this->assertFalse( get_option( Reprint_Exporter::ENABLED_OPTION ) );
		$this->assertFalse( get_option( Reprint_Exporter::ENABLED_HASH_OPTION ) );
		$this->assertNotContains( 'window_opened', array_column( $this->recorded_events, 0 ) );
	}

	/**
	 * Storing a secret refuses without a usable salt rather than keeping a
	 * secret it could not hash.
	 */
	public function test_store_secret_refuses_without_a_usable_salt() {
		$this->use_usable_salt( 'put your unique phrase here' );

		$this->assertFalse( Reprint_Exporter::store_secret( 'a-secret' ) );
		$this->assertFalse( get_option( Reprint_Exporter::SECRET_OPTION ) );
		$this->assertFalse( get_option( Reprint_Exporter::SECRET_HASH_OPTION ) );
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
		// One fixed time for both the stored value and the check, so the
		// boundaries below are exact.
		$now  = time();
		$skew = Reprint_Exporter::HMAC_CLOCK_SKEW;

		$this->assertFalse( Reprint_Exporter::is_export_window_open( $now ) );

		$this->plant_window( $now - ( HOUR_IN_SECONDS + 1 ) );
		$this->assertFalse( Reprint_Exporter::is_export_window_open( $now ), 'A second past the hour is stale.' );

		$this->plant_window( $now - HOUR_IN_SECONDS );
		$this->assertTrue( Reprint_Exporter::is_export_window_open( $now ), 'Exactly an hour old still counts.' );

		$this->plant_window( $now + $skew + 1 );
		$this->assertFalse( Reprint_Exporter::is_export_window_open( $now ), 'A second past the skew tolerance is rejected.' );

		$this->plant_window( $now + $skew );
		$this->assertTrue( Reprint_Exporter::is_export_window_open( $now ), 'Exactly the skew tolerance is allowed.' );

		Reprint_Exporter::open_export_window();
		$this->assertTrue( Reprint_Exporter::is_export_window_open() );
	}

	/**
	 * A current timestamp with no hash, or the wrong hash, reads as closed.
	 *
	 * Without this, someone who can read a real secret from the database and
	 * write one row could reopen a lapsed window at will.
	 */
	public function test_export_window_closed_when_hash_is_missing_or_wrong() {
		$this->plant_option( Reprint_Exporter::ENABLED_OPTION, time() );
		$this->assertFalse( Reprint_Exporter::is_export_window_open(), 'No hash at all.' );

		$this->plant_option( Reprint_Exporter::ENABLED_HASH_OPTION, 'planted-by-someone-else' );
		$this->assertFalse( Reprint_Exporter::is_export_window_open(), 'Wrong hash.' );

		Reprint_Exporter::open_export_window();
		$this->assertTrue( Reprint_Exporter::is_export_window_open(), 'The exporter\'s own stamp still opens it.' );
	}

	/**
	 * A window opened under one AUTH_SALT reads as closed under another.
	 */
	public function test_export_window_closed_after_auth_salt_changes() {
		Reprint_Exporter::open_export_window();
		$this->assertTrue( Reprint_Exporter::is_export_window_open(), 'Fixture must be open before the salt changes.' );

		$this->use_usable_salt( 'second-usable-salt-value-second-usable-salt-value-second-salt' );

		$this->assertFalse( Reprint_Exporter::is_export_window_open() );
	}

	// -- Export request handler -----------------------------------------------

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

		$stub             = new Reprint_Exporter_Test_Stub();
		$stub->hmac_error = 'Invalid signature.';
		$body             = $this->run_handler( $stub, $this->make_wp( '' ) );

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
	 * A secret with no hash is refused before its signature is even checked.
	 *
	 * Writing the secret row alone, which is all a database write can do, must
	 * not arm the exporter.
	 */
	public function test_planted_secret_without_a_hash_is_refused() {
		$stub = $this->make_ready_stub();
		$this->plant_option( Reprint_Exporter::SECRET_OPTION, 'planted-by-someone-else' );

		$body = $this->run_handler( $stub, $this->make_wp( '' ) );

		$this->assertSame( 503, $stub->error_code );
		$this->assertStringContainsString( 'rotate', $body );
		$this->assertNull( $stub->verified_secret, 'A secret without a hash must not reach HMAC verification.' );
		$this->assertFalse( $stub->served );
	}

	/**
	 * A secret whose hash was made without the salt is refused the same way.
	 */
	public function test_planted_secret_with_a_wrong_hash_is_refused() {
		$stub = $this->make_ready_stub();
		$this->plant_option( Reprint_Exporter::SECRET_OPTION, 'planted-by-someone-else' );
		$this->plant_option(
			Reprint_Exporter::SECRET_HASH_OPTION,
			hash_hmac( 'sha256', Reprint_Exporter::SECRET_HASH_OPTION . "\0planted-by-someone-else", 'a-guessed-salt' )
		);

		$body = $this->run_handler( $stub, $this->make_wp( '' ) );

		$this->assertSame( 503, $stub->error_code );
		$this->assertStringContainsString( 'rotate', $body );
		$this->assertNull( $stub->verified_secret );
		$this->assertFalse( $stub->served );
	}

	/**
	 * A window pair copied into the secret options is not a hashed secret.
	 *
	 * Both hashes are HMACs under the same salt, so without a purpose prefix a
	 * stored timestamp and its hash would pass as a secret the attacker knows.
	 */
	public function test_window_pair_replayed_as_a_secret_is_refused() {
		$stub = $this->make_ready_stub();
		$this->plant_option( Reprint_Exporter::SECRET_OPTION, (string) get_option( Reprint_Exporter::ENABLED_OPTION ) );
		$this->plant_option( Reprint_Exporter::SECRET_HASH_OPTION, get_option( Reprint_Exporter::ENABLED_HASH_OPTION ) );

		$this->run_handler( $stub, $this->make_wp( '' ) );

		$this->assertSame( 503, $stub->error_code );
		$this->assertNull( $stub->verified_secret );
		$this->assertFalse( $stub->served );
	}

	/**
	 * A new AUTH_SALT invalidates the credential with a message that says so.
	 *
	 * The window has to be re-opened first, since the old window hash no longer
	 * matches either and a closed window stays silent. Once it is, the client
	 * learns it must rotate, rather than a signature failure it cannot act on.
	 */
	public function test_changing_auth_salt_invalidates_the_credential() {
		Constants::set_constant( 'IS_PRESSABLE', true );
		( new REST_Controller() )->rotate_secret();
		$_GET['reprint-api-jetpack'] = '1';
		$_SERVER['REQUEST_METHOD']   = 'GET';

		$this->use_usable_salt( 'second-usable-salt-value-second-usable-salt-value-second-salt' );
		( new REST_Controller() )->enable_export();

		$stub = new Reprint_Exporter_Test_Stub();
		$body = $this->run_handler( $stub, $this->make_wp( '' ) );

		$this->assertSame( 503, $stub->error_code );
		$this->assertStringContainsString( 'invalidated', $body );
		$this->assertStringContainsString( 'rotate-export-secret', $body );
		$this->assertStringNotContainsString( 'Export not configured', $body );
		$this->assertNull( $stub->verified_secret );
		$this->assertFalse( $stub->served );
	}

	/**
	 * A closed window says nothing about a bad hash either.
	 *
	 * So an idle site stays indistinguishable from one without the feature,
	 * and a stray probe fires no event.
	 */
	public function test_closed_window_stays_silent_with_a_bad_hash() {
		$this->capture_events();
		Constants::set_constant( 'IS_PRESSABLE', true );
		$this->plant_option( Reprint_Exporter::SECRET_OPTION, 'planted-by-someone-else' );
		$_GET['reprint-api-jetpack'] = '1';
		$_SERVER['REQUEST_METHOD']   = 'GET';

		$stub = new Reprint_Exporter_Test_Stub();
		$body = $this->run_handler( $stub, $this->make_wp( '' ) );

		$this->assertNull( $stub->error_code );
		$this->assertSame( '', $body );
		$this->assertFalse( $stub->terminated );
		$this->assertSame( array(), $this->recorded_events );
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
		$this->plant_window( time() - 30 );

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
