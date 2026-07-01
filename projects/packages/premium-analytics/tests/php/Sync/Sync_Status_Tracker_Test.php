<?php
/**
 * Tests for Sync_Status_Tracker.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Sync;

use PHPUnit\Framework\Attributes\After;
use PHPUnit\Framework\Attributes\Before;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Sync\Sync_Status_Tracker
 */
#[CoversClass( Sync_Status_Tracker::class )]
class Sync_Status_Tracker_Test extends TestCase {

	private const FULL_STATUS_WITH_ANALYTICS = array(
		'config' => array( 'woocommerce_analytics' => true ),
	);

	/**
	 * @before
	 */
	#[Before]
	public function set_up() {
		\WorDBless\Options::init()->clear_options();
	}

	/**
	 * @after
	 */
	#[After]
	public function tear_down() {
		delete_option( Sync_Status_Tracker::INITIAL_ANALYTICS_SYNC_OPTION );
		delete_option( Sync_Status_Tracker::INITIAL_SITE_SYNC_OPTION );
		remove_all_actions( Sync_Status_Tracker::MILESTONE_ACTION );
		remove_all_filters( 'jetpack_premium_analytics_sync_modules' );
		\WorDBless\Options::init()->clear_options();
	}

	public function test_milestone_sets_option_and_fires_action() {
		$fired_with = null;
		add_action(
			Sync_Status_Tracker::MILESTONE_ACTION,
			function ( $status ) use ( &$fired_with ) {
				$fired_with = $status;
			}
		);

		$actions = array( array( 'jetpack_full_sync_end', array(), 0, 1730000123 ) );
		Sync_Status_Tracker::maybe_set_milestone( self::FULL_STATUS_WITH_ANALYTICS, $actions );

		$this->assertSame( 1730000123, (int) get_option( Sync_Status_Tracker::INITIAL_ANALYTICS_SYNC_OPTION ) );
		$this->assertIsArray( $fired_with );
		$this->assertSame( 1730000123, $fired_with['finished'] );
	}

	public function test_milestone_noop_when_already_set() {
		update_option( Sync_Status_Tracker::INITIAL_ANALYTICS_SYNC_OPTION, 1730000000 );

		Sync_Status_Tracker::maybe_set_milestone(
			self::FULL_STATUS_WITH_ANALYTICS,
			array( array( 'jetpack_full_sync_end', array(), 0, 1730099999 ) )
		);

		$this->assertSame( 1730000000, (int) get_option( Sync_Status_Tracker::INITIAL_ANALYTICS_SYNC_OPTION ) );
	}

	public function test_milestone_noop_when_analytics_module_not_in_config() {
		Sync_Status_Tracker::maybe_set_milestone(
			array( 'config' => array( 'posts' => true ) ),
			array( array( 'jetpack_full_sync_end', array(), 0, 1730000123 ) )
		);

		$this->assertSame( 0, (int) get_option( Sync_Status_Tracker::INITIAL_ANALYTICS_SYNC_OPTION, 0 ) );
	}

	public function test_milestone_flips_on_generic_full_sync_without_store_data() {
		// No store data (WooCommerce inactive): there is no analytics module to wait
		// for, so any initial full sync ending flips the site milestone.
		Sync_Status_Tracker::maybe_set_milestone(
			array( 'config' => array( 'posts' => true ) ),
			array( array( 'jetpack_full_sync_end', array(), 0, 1730000123 ) ),
			false
		);

		$this->assertSame( 1730000123, (int) get_option( Sync_Status_Tracker::INITIAL_SITE_SYNC_OPTION ) );
		$this->assertSame( 0, (int) get_option( Sync_Status_Tracker::INITIAL_ANALYTICS_SYNC_OPTION, 0 ), 'site sync does not touch the analytics milestone' );
	}

	public function test_storeless_milestone_does_not_fire_action() {
		// The MILESTONE_ACTION feeds store-keyed side-effects (e.g. the WooCommerce
		// full-sync-complete email), so the site sync must not fire it.
		$fired = false;
		add_action(
			Sync_Status_Tracker::MILESTONE_ACTION,
			function () use ( &$fired ) {
				$fired = true;
			}
		);

		Sync_Status_Tracker::maybe_set_milestone(
			array( 'config' => array( 'posts' => true ) ),
			array( array( 'jetpack_full_sync_end', array(), 0, 1730000123 ) ),
			false
		);

		$this->assertSame( 1730000123, (int) get_option( Sync_Status_Tracker::INITIAL_SITE_SYNC_OPTION ) );
		$this->assertFalse( $fired, 'site milestone must not fire the store side-effect action' );
	}

	public function test_site_milestone_does_not_open_the_store_gate() {
		// Connected without WooCommerce, then activated it: the site milestone is set
		// but the store gate must remain closed until the analytics sync finishes.
		update_option( Sync_Status_Tracker::INITIAL_SITE_SYNC_OPTION, 1729000000 );

		Sync_Status_Tracker::maybe_set_milestone(
			self::FULL_STATUS_WITH_ANALYTICS,
			array( array( 'jetpack_full_sync_end', array(), 0, 1730000123 ) ),
			true
		);

		$this->assertSame( 1730000123, (int) get_option( Sync_Status_Tracker::INITIAL_ANALYTICS_SYNC_OPTION ), 'the analytics sync still flips its own milestone' );
		$this->assertSame( 1729000000, (int) get_option( Sync_Status_Tracker::INITIAL_SITE_SYNC_OPTION ), 'the pre-existing site milestone is untouched' );
	}

	public function test_milestone_noop_without_end_action() {
		Sync_Status_Tracker::maybe_set_milestone(
			self::FULL_STATUS_WITH_ANALYTICS,
			array( array( 'jetpack_full_sync_start', array(), 0, 1730000000 ) )
		);

		$this->assertSame( 0, (int) get_option( Sync_Status_Tracker::INITIAL_ANALYTICS_SYNC_OPTION, 0 ) );
	}

	public function test_milestone_noop_with_empty_actions() {
		Sync_Status_Tracker::maybe_set_milestone( self::FULL_STATUS_WITH_ANALYTICS, array() );

		$this->assertSame( 0, (int) get_option( Sync_Status_Tracker::INITIAL_ANALYTICS_SYNC_OPTION, 0 ) );
	}

	public function test_milestone_noop_when_end_action_timestamp_is_zero() {
		Sync_Status_Tracker::maybe_set_milestone(
			self::FULL_STATUS_WITH_ANALYTICS,
			array( array( 'jetpack_full_sync_end', array(), 0, 0 ) )
		);

		$this->assertSame( 0, (int) get_option( Sync_Status_Tracker::INITIAL_ANALYTICS_SYNC_OPTION, 0 ) );
	}

	public function test_milestone_noop_when_end_action_missing_timestamp() {
		Sync_Status_Tracker::maybe_set_milestone(
			self::FULL_STATUS_WITH_ANALYTICS,
			array( array( 'jetpack_full_sync_end', array(), 0 ) )
		);

		$this->assertSame( 0, (int) get_option( Sync_Status_Tracker::INITIAL_ANALYTICS_SYNC_OPTION, 0 ) );
	}

	public function test_filter_overrides_analytics_sync_modules() {
		add_filter(
			'jetpack_premium_analytics_sync_modules',
			static function () {
				return array( 'custom_module_name' );
			}
		);

		Sync_Status_Tracker::maybe_set_milestone(
			array( 'config' => array( 'custom_module_name' => true ) ),
			array( array( 'jetpack_full_sync_end', array(), 0, 1730000123 ) )
		);

		$this->assertSame( 1730000123, (int) get_option( Sync_Status_Tracker::INITIAL_ANALYTICS_SYNC_OPTION ) );
	}

	public function test_filter_can_add_a_second_analytics_module() {
		add_filter(
			'jetpack_premium_analytics_sync_modules',
			static function ( $modules ) {
				$modules[] = 'second_analytics';
				return $modules;
			}
		);

		Sync_Status_Tracker::maybe_set_milestone(
			array( 'config' => array( 'second_analytics' => true ) ),
			array( array( 'jetpack_full_sync_end', array(), 0, 1730000123 ) )
		);

		$this->assertSame( 1730000123, (int) get_option( Sync_Status_Tracker::INITIAL_ANALYTICS_SYNC_OPTION ) );
	}

	public function test_listener_bails_before_module_lookup_when_milestone_reached() {
		// WooCommerce is inactive in tests, so the site milestone is the one that
		// gates the current mode and short-circuits the listener.
		update_option( Sync_Status_Tracker::INITIAL_SITE_SYNC_OPTION, 1730000000 );

		// Once the gating milestone is set the listener must return before reaching
		// the sync-module registry, so this call stays a no-op without it standing up.
		Sync_Status_Tracker::on_sync_processed_actions(
			array( array( 'jetpack_full_sync_end', array(), 0, 1730099999 ) )
		);

		$this->assertSame( 1730000000, (int) get_option( Sync_Status_Tracker::INITIAL_SITE_SYNC_OPTION ) );
	}

	public function test_script_data_reports_zero_before_milestone() {
		$data = Sync_Status_Tracker::inject_script_data( array( 'site' => array() ) );

		$this->assertArrayHasKey( 'premium_analytics', $data );
		$this->assertSame( 0, $data['premium_analytics']['initial_full_sync_finished'] );
		$this->assertArrayHasKey( 'site', $data, 'preserves existing keys' );
	}

	public function test_script_data_includes_has_store_data_flag() {
		$data = Sync_Status_Tracker::inject_script_data( array() );

		$this->assertArrayHasKey( 'has_store_data', $data['premium_analytics'] );
		// WooCommerce is not loaded in the test environment.
		$this->assertFalse( $data['premium_analytics']['has_store_data'] );
	}

	public function test_script_data_reports_timestamp_after_milestone() {
		// WooCommerce inactive in tests, so the site milestone gates the dashboard.
		update_option( Sync_Status_Tracker::INITIAL_SITE_SYNC_OPTION, 1730000123 );

		$data = Sync_Status_Tracker::inject_script_data( array() );

		$this->assertSame( 1730000123, $data['premium_analytics']['initial_full_sync_finished'] );
	}

	public function test_script_data_ignores_the_other_modes_milestone() {
		// In storeless mode (WooCommerce inactive) the analytics milestone must not
		// leak through as the gating milestone.
		update_option( Sync_Status_Tracker::INITIAL_ANALYTICS_SYNC_OPTION, 1730000123 );

		$data = Sync_Status_Tracker::inject_script_data( array() );

		$this->assertSame( 0, $data['premium_analytics']['initial_full_sync_finished'] );
	}

	public function test_configure_registers_hooks() {
		Sync_Status_Tracker::configure();

		$this->assertNotFalse(
			has_action( 'jetpack_sync_processed_actions', array( Sync_Status_Tracker::class, 'on_sync_processed_actions' ) ),
			'listener should hook jetpack_sync_processed_actions'
		);
		$this->assertNotFalse(
			has_filter( 'jetpack_admin_js_script_data', array( Sync_Status_Tracker::class, 'inject_script_data' ) ),
			'tracker should filter jetpack_admin_js_script_data'
		);
		$this->assertNotFalse(
			has_filter( 'rest_post_dispatch', array( Sync_Status_Tracker::class, 'enrich_sync_status_response' ) ),
			'tracker should filter rest_post_dispatch to enrich sync status'
		);

		remove_action( 'jetpack_sync_processed_actions', array( Sync_Status_Tracker::class, 'on_sync_processed_actions' ) );
		remove_filter( 'jetpack_admin_js_script_data', array( Sync_Status_Tracker::class, 'inject_script_data' ) );
		remove_filter( 'rest_post_dispatch', array( Sync_Status_Tracker::class, 'enrich_sync_status_response' ) );
	}

	public function test_enrich_adds_milestone_to_sync_status_response() {
		// WooCommerce inactive in tests, so the site milestone gates the dashboard.
		update_option( Sync_Status_Tracker::INITIAL_SITE_SYNC_OPTION, 1730000123 );
		$request  = new \WP_REST_Request( 'GET', Sync_Status_Tracker::SYNC_STATUS_ROUTE );
		$response = new \WP_REST_Response( array( 'started' => true ) );

		$result = Sync_Status_Tracker::enrich_sync_status_response( $response, null, $request );

		$data = $result->get_data();
		$this->assertSame( 1730000123, $data['initial_full_sync_finished'] );
		$this->assertTrue( $data['started'], 'preserves existing fields' );
	}

	public function test_enrich_reports_zero_when_milestone_unset() {
		$request  = new \WP_REST_Request( 'GET', Sync_Status_Tracker::SYNC_STATUS_ROUTE );
		$response = new \WP_REST_Response( array() );

		$result = Sync_Status_Tracker::enrich_sync_status_response( $response, null, $request );

		$this->assertSame( 0, $result->get_data()['initial_full_sync_finished'] );
	}

	public function test_enrich_ignores_other_routes() {
		update_option( Sync_Status_Tracker::INITIAL_SITE_SYNC_OPTION, 1730000123 );
		$request  = new \WP_REST_Request( 'POST', '/jetpack/v4/sync/full-sync' );
		$response = new \WP_REST_Response( array( 'scheduled' => true ) );

		$result = Sync_Status_Tracker::enrich_sync_status_response( $response, null, $request );

		$this->assertArrayNotHasKey( 'initial_full_sync_finished', $result->get_data() );
	}

	public function test_enrich_skips_error_responses() {
		update_option( Sync_Status_Tracker::INITIAL_SITE_SYNC_OPTION, 1730000123 );
		$request  = new \WP_REST_Request( 'GET', Sync_Status_Tracker::SYNC_STATUS_ROUTE );
		$response = new \WP_REST_Response( array( 'code' => 'forbidden' ), 403 );

		$result = Sync_Status_Tracker::enrich_sync_status_response( $response, null, $request );

		$this->assertArrayNotHasKey( 'initial_full_sync_finished', $result->get_data() );
	}

	public function test_enrich_passes_through_non_rest_response() {
		$request     = new \WP_REST_Request( 'GET', Sync_Status_Tracker::SYNC_STATUS_ROUTE );
		$passthrough = new \WP_Error( 'boom' );

		$result = Sync_Status_Tracker::enrich_sync_status_response( $passthrough, null, $request );

		$this->assertSame( $passthrough, $result );
	}
}
