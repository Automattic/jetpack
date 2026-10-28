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
		'config' => array( 'first_analytics' => true ),
	);

	/**
	 * @before
	 */
	#[Before]
	public function set_up() {
		\WorDBless\Options::init()->clear_options();
		// Raw options query $wpdb directly, which WorDBless doesn't back.
		add_filter( 'jetpack_disabled_raw_options', array( $this, 'bypass_full_sync_status_raw_option' ) );
		add_filter(
			'jetpack_premium_analytics_sync_modules',
			static function ( $modules ) {
				$modules[] = 'first_analytics';
				return $modules;
			}
		);
	}

	/**
	 * @param array $options Raw options read through the Options API instead.
	 * @return array
	 */
	public function bypass_full_sync_status_raw_option( $options ) {
		$options['jetpack_sync_full_status']                           = true;
		$options[ Sync_Status_Tracker::ANALYTICS_SYNC_STARTED_OPTION ] = true;
		return $options;
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
		delete_option( Sync_Status_Tracker::ANALYTICS_SYNC_STARTED_OPTION );
		remove_all_actions( 'jetpack_full_sync_start' );
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

	public static function provide_full_sync_configs(): array {
		return array(
			'analytics full sync'          => array( array( 'first_analytics' => 1 ), true ),
			'full sync without analytics'  => array( array( 'posts' => 1 ), false ),
			'disabled analytics module'    => array( array( 'first_analytics' => 0 ), false ),
			'full sync with no config yet' => array( null, false ),
		);
	}

	/**
	 * @dataProvider provide_full_sync_configs
	 *
	 * @param array|null $config   Config of the full sync that began.
	 * @param bool       $expected Whether the analytics full sync counts as started.
	 */
	#[DataProvider( 'provide_full_sync_configs' )]
	public function test_full_sync_start_marks_analytics_sync_started_only_for_analytics_configs( $config, bool $expected ) {
		Sync_Status_Tracker::configure();
		do_action( 'jetpack_full_sync_start', $config, array() );

		$this->assertSame( $expected, Sync_Status_Tracker::has_module_full_sync_started( 'first_analytics' ) );
	}

	public static function provide_running_full_syncs(): array {
		return array(
			'running analytics full sync'         => array( array( 'first_analytics' => 1 ), true ),
			'running full sync without analytics' => array( array( 'posts' => 1 ), false ),
		);
	}

	/**
	 * A full sync that began before the update never fired the start hook under this code.
	 *
	 * @dataProvider provide_running_full_syncs
	 * @param array $config   Config of the running full sync.
	 * @param bool  $expected Whether the module counts as started.
	 */
	#[DataProvider( 'provide_running_full_syncs' )]
	public function test_running_full_sync_counts_as_started( array $config, bool $expected ) {
		update_option(
			'jetpack_sync_full_status',
			array(
				'started' => 1730000000,
				'config'  => $config,
			)
		);

		$this->assertSame( $expected, Sync_Status_Tracker::has_module_full_sync_started( 'first_analytics' ) );
		$this->assertSame( $expected, isset( get_option( Sync_Status_Tracker::ANALYTICS_SYNC_STARTED_OPTION, array() )['first_analytics'] ) );
	}

	public function test_milestone_from_a_sync_begun_before_the_update_does_not_start_other_modules() {
		add_filter(
			'jetpack_premium_analytics_sync_modules',
			static function ( $modules ) {
				$modules[] = 'second_analytics';
				return $modules;
			}
		);

		// Its start hook ran before the update, so only its end is seen.
		Sync_Status_Tracker::maybe_set_milestone(
			array( 'config' => array( 'second_analytics' => 1 ) ),
			array( array( 'jetpack_full_sync_end', array(), 0, 1730000123 ) )
		);

		$this->assertTrue( Sync_Status_Tracker::has_module_full_sync_started( 'second_analytics' ) );
		$this->assertFalse( Sync_Status_Tracker::has_module_full_sync_started( 'first_analytics' ) );
	}

	public function test_later_full_sync_without_analytics_keeps_analytics_sync_started() {
		Sync_Status_Tracker::on_full_sync_start( array( 'first_analytics' => 1 ) );
		Sync_Status_Tracker::on_full_sync_start( array( 'posts' => 1 ) );

		$this->assertTrue( Sync_Status_Tracker::has_module_full_sync_started( 'first_analytics' ) );
	}

	public function test_unregistered_module_does_not_get_a_start_record() {
		remove_all_filters( 'jetpack_premium_analytics_sync_modules' );
		Sync_Status_Tracker::on_full_sync_start( array( 'first_analytics' => 1 ) );

		$this->assertFalse( Sync_Status_Tracker::has_module_full_sync_started( 'first_analytics' ) );
	}

	public function test_second_module_start_does_not_mark_the_first_module_as_started() {
		add_filter(
			'jetpack_premium_analytics_sync_modules',
			static function ( $modules ) {
				$modules[] = 'second_analytics';
				return $modules;
			}
		);
		Sync_Status_Tracker::on_full_sync_start( array( 'second_analytics' => 1 ) );

		$this->assertTrue( Sync_Status_Tracker::has_module_full_sync_started( 'second_analytics' ) );
		$this->assertFalse( Sync_Status_Tracker::has_module_full_sync_started( 'first_analytics' ) );

		Sync_Status_Tracker::on_full_sync_start( array( 'first_analytics' => 1 ) );

		$this->assertTrue( Sync_Status_Tracker::has_module_full_sync_started( 'first_analytics' ) );
		$this->assertTrue( Sync_Status_Tracker::has_module_full_sync_started( 'second_analytics' ) );
	}

	public function test_repeated_full_sync_keeps_the_first_start_timestamp() {
		update_option( Sync_Status_Tracker::ANALYTICS_SYNC_STARTED_OPTION, array( 'first_analytics' => 1730000123 ) );
		Sync_Status_Tracker::on_full_sync_start( array( 'first_analytics' => 1 ) );

		$this->assertSame( array( 'first_analytics' => 1730000123 ), get_option( Sync_Status_Tracker::ANALYTICS_SYNC_STARTED_OPTION ) );
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

	public function test_enrich_backfills_milestone_from_finished_analytics_full_sync() {
		$fired = 0;
		add_action(
			Sync_Status_Tracker::MILESTONE_ACTION,
			function () use ( &$fired ) {
				++$fired;
			}
		);
		\Jetpack_Options::update_raw_option(
			'jetpack_sync_full_status',
			array(
				'started'  => 1730000000,
				'finished' => 1730000123,
				'progress' => array( 'first_analytics' => array( 'finished' => true ) ),
				'config'   => array( 'first_analytics' => true ),
			)
		);
		$request = new \WP_REST_Request( 'GET', Sync_Status_Tracker::SYNC_STATUS_ROUTE );

		$result = Sync_Status_Tracker::enrich_sync_status_response( new \WP_REST_Response( array() ), null, $request );
		Sync_Status_Tracker::enrich_sync_status_response( new \WP_REST_Response( array() ), null, $request );

		$this->assertSame( 1730000123, $result->get_data()['initial_full_sync_finished'] );
		$this->assertSame( 1, $fired, 'fires the milestone action once' );
	}

	/**
	 * @dataProvider provide_full_sync_status_without_finished_analytics
	 * @param array $full_status Stored full-sync status.
	 */
	#[DataProvider( 'provide_full_sync_status_without_finished_analytics' )]
	public function test_enrich_does_not_backfill_milestone( array $full_status ) {
		\Jetpack_Options::update_raw_option( 'jetpack_sync_full_status', $full_status );
		$request = new \WP_REST_Request( 'GET', Sync_Status_Tracker::SYNC_STATUS_ROUTE );

		$result = Sync_Status_Tracker::enrich_sync_status_response( new \WP_REST_Response( array() ), null, $request );

		$this->assertSame( 0, $result->get_data()['initial_full_sync_finished'] );
	}

	public static function provide_full_sync_status_without_finished_analytics() {
		return array(
			'sync still running'          => array(
				array(
					'started'  => 1730000000,
					'finished' => false,
					'progress' => array( 'first_analytics' => array( 'finished' => true ) ),
				),
			),
			'finished without analytics'  => array(
				array(
					'started'  => 1730000000,
					'finished' => 1730000123,
					'progress' => array( 'posts' => array( 'finished' => true ) ),
				),
			),
			'analytics bucket unfinished' => array(
				array(
					'started'  => 1730000000,
					'finished' => 1730000123,
					'progress' => array( 'first_analytics' => array( 'finished' => false ) ),
				),
			),
		);
	}
}
