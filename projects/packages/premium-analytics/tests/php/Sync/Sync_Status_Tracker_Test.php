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
use PHPUnit\Framework\Attributes\DataProvider;
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
		remove_all_actions( Sync_Status_Tracker::MILESTONE_ACTION );
		remove_all_filters( 'jetpack_premium_analytics_sync_modules' );
		remove_all_filters( 'jetpack_disabled_raw_options' );
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
		update_option( Sync_Status_Tracker::INITIAL_ANALYTICS_SYNC_OPTION, 1730000000 );

		// Once the milestone is set the listener must return before reaching
		// the sync-module registry, so this call stays a no-op without it standing up.
		Sync_Status_Tracker::on_sync_processed_actions(
			array( array( 'jetpack_full_sync_end', array(), 0, 1730099999 ) )
		);

		$this->assertSame( 1730000000, (int) get_option( Sync_Status_Tracker::INITIAL_ANALYTICS_SYNC_OPTION ) );
	}

	/**
	 * Store the full-sync status where Full_Sync_Immediately::get_status() reads it.
	 *
	 * @param array $status Full-sync status.
	 */
	private function set_full_sync_status( array $status ): void {
		add_filter(
			'jetpack_disabled_raw_options',
			static function ( $options ) {
				$options['jetpack_sync_full_status'] = true;
				return $options;
			}
		);
		update_option( 'jetpack_sync_full_status', $status );
	}

	public static function provide_full_sync_states(): array {
		return array(
			'no full sync yet'                    => array( array(), false ),
			'analytics full sync running'         => array(
				array(
					'started' => 1730000000,
					'config'  => array( 'woocommerce_analytics' => 1 ),
				),
				true,
			),
			'running full sync without analytics' => array(
				array(
					'started' => 1730000000,
					'config'  => array( 'posts' => 1 ),
				),
				false,
			),
		);
	}

	/**
	 * @dataProvider provide_full_sync_states
	 *
	 * @param array $status   Full-sync status.
	 * @param bool  $expected Whether the analytics full sync counts as started.
	 */
	#[DataProvider( 'provide_full_sync_states' )]
	public function test_analytics_full_sync_started_reads_the_full_sync_status( array $status, bool $expected ) {
		$this->set_full_sync_status( $status );

		$this->assertSame( $expected, Sync_Status_Tracker::has_analytics_full_sync_started() );
	}

	public function test_analytics_full_sync_counts_as_started_after_the_milestone() {
		update_option( Sync_Status_Tracker::INITIAL_ANALYTICS_SYNC_OPTION, 1730000123 );
		$this->set_full_sync_status( array( 'config' => array( 'posts' => 1 ) ) );

		$this->assertTrue( Sync_Status_Tracker::has_analytics_full_sync_started() );
	}

	public function test_script_data_reports_zero_before_milestone() {
		$data = Sync_Status_Tracker::inject_script_data( array( 'site' => array() ) );

		$this->assertArrayHasKey( 'premium_analytics', $data );
		$this->assertSame( 0, $data['premium_analytics']['initial_full_sync_finished'] );
		$this->assertArrayHasKey( 'site', $data, 'preserves existing keys' );
	}

	public function test_script_data_reports_timestamp_after_milestone() {
		update_option( Sync_Status_Tracker::INITIAL_ANALYTICS_SYNC_OPTION, 1730000123 );

		$data = Sync_Status_Tracker::inject_script_data( array() );

		$this->assertSame( 1730000123, $data['premium_analytics']['initial_full_sync_finished'] );
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
		update_option( Sync_Status_Tracker::INITIAL_ANALYTICS_SYNC_OPTION, 1730000123 );
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
		update_option( Sync_Status_Tracker::INITIAL_ANALYTICS_SYNC_OPTION, 1730000123 );
		$request  = new \WP_REST_Request( 'POST', '/jetpack/v4/sync/full-sync' );
		$response = new \WP_REST_Response( array( 'scheduled' => true ) );

		$result = Sync_Status_Tracker::enrich_sync_status_response( $response, null, $request );

		$this->assertArrayNotHasKey( 'initial_full_sync_finished', $result->get_data() );
	}

	public function test_enrich_skips_error_responses() {
		update_option( Sync_Status_Tracker::INITIAL_ANALYTICS_SYNC_OPTION, 1730000123 );
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
