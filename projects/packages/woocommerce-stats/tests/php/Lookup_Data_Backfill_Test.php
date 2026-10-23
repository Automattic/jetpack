<?php
/**
 * Tests for Lookup_Data_Backfill.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats;

use Automattic\Jetpack\PremiumAnalytics\Analytics;
use Automattic\Jetpack\PremiumAnalytics\Sync\Sync_Status_Tracker;
use PHPUnit\Framework\Attributes\After;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\Attributes\Before;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\WooCommerceStats\Lookup_Data_Backfill
 */
#[CoversClass( Lookup_Data_Backfill::class )]
#[AllowMockObjectsWithoutExpectations /* Partial mocks stub the store, Jetpack and WordPress.com checks; getStubBuilder() doesn't exist until PHPUnit 12.5. */]
class Lookup_Data_Backfill_Test extends TestCase {

	private const OLDEST_ORDER = array(
		'product_id'   => '7',
		'date_created' => '2024-03-10 12:00:00',
	);

	/**
	 * @before
	 */
	#[Before]
	public function set_up() {
		\WorDBless\Options::init()->clear_options();
		// update_option() skips a value the object cache still holds from an earlier test.
		wp_cache_flush();
		require_once __DIR__ . '/mocks/action-scheduler-mock.php';
		$GLOBALS['woocommerce_stats_test_scheduled_actions'] = array();
	}

	/**
	 * @after
	 */
	#[After]
	public function tear_down() {
		unset( $GLOBALS['woocommerce_stats_test_scheduled_actions'], $GLOBALS['current_screen'], $_GET['page'] );
		\WorDBless\Options::init()->clear_options();
	}

	/**
	 * A backfill whose checks pass and whose WordPress.com report lacks the oldest order's product, unless overridden.
	 *
	 * @param array $results Return values by stubbed method name; a closure computes one from the call's arguments.
	 * @return Lookup_Data_Backfill&MockObject
	 */
	private function backfill( array $results = array() ) {
		$results += array(
			'has_orders'                => true,
			'has_lookup_rows'           => true,
			'is_jetpack_connected'      => true,
			'is_sync_allowed'           => true,
			'is_full_sync_running'      => false,
			'find_oldest_order_product' => self::OLDEST_ORDER,
			'fetch_wpcom_products'      => array(
				array(
					'product_id'   => '8',
					'product_type' => 'simple',
				),
			),
			'get_product_ids'           => array( 7, 8 ),
			'get_full_sync_status'      => array(),
			'do_full_sync'              => true,
		);

		$backfill = $this->getMockBuilder( Lookup_Data_Backfill::class )
			->onlyMethods( array_keys( $results ) )
			->getMock();
		foreach ( $results as $method => $result ) {
			if ( $result instanceof \Closure ) {
				$backfill->method( $method )->willReturnCallback( $result );
			} else {
				$backfill->method( $method )->willReturn( $result );
			}
		}
		return $backfill;
	}

	private static function scheduled_hooks(): array {
		return array_column( $GLOBALS['woocommerce_stats_test_scheduled_actions'], 'hook' );
	}

	/**
	 * Record the standalone plugin's full sync and the milestone it set.
	 */
	private static function record_earlier_syncs(): void {
		update_option( Lookup_Data_Backfill::PLUGIN_FULL_SYNC_OPTION, 1730000100 );
		update_option( Sync_Status_Tracker::INITIAL_ANALYTICS_SYNC_OPTION, 1730000123 );
	}

	private static function set_scheduled_state(): void {
		update_option(
			Lookup_Data_Backfill::STATE_OPTION,
			array(
				'scheduled_at' => 1730000000,
				'started_at'   => 0,
			)
		);
	}

	public function test_schedules_once_after_an_earlier_analytics_full_sync() {
		self::record_earlier_syncs();
		$backfill = $this->backfill();

		$backfill->maybe_schedule();
		$backfill->maybe_schedule(); // @phan-suppress-current-line PhanPluginDuplicateAdjacentStatement -- A second check must not schedule again.

		$this->assertSame( array( Lookup_Data_Backfill::START_HOOK ), self::scheduled_hooks() );
		$this->assertSame( 0, get_option( Lookup_Data_Backfill::STATE_OPTION )['started_at'] );
	}

	/**
	 * @dataProvider provide_trigger
	 * @param callable $trigger  Runs the hook callback against a backfill.
	 * @param bool     $schedule Whether it should schedule.
	 */
	#[DataProvider( 'provide_trigger' )]
	public function test_checks_on_sync_status_and_dashboard_load_only( callable $trigger, bool $schedule ) {
		self::record_earlier_syncs();

		$trigger( $this->backfill() );

		$this->assertSame( $schedule ? array( Lookup_Data_Backfill::START_HOOK ) : array(), self::scheduled_hooks() );
	}

	public static function provide_trigger() {
		$respond = static function ( string $route, int $status ) {
			return static function ( Lookup_Data_Backfill $backfill ) use ( $route, $status ) {
				$response = new \WP_REST_Response( array(), $status );
				$result   = $backfill->on_sync_status_response( $response, null, new \WP_REST_Request( 'GET', $route ) );
				\PHPUnit\Framework\Assert::assertSame( $response, $result );
			};
		};
		$load    = static function ( string $page ) {
			return static function ( Lookup_Data_Backfill $backfill ) use ( $page ) {
				set_current_screen( 'toplevel_page_' . $page );
				$_GET['page'] = $page;
				$backfill->on_dashboard_screen();
			};
		};

		return array(
			'sync status'       => array( $respond( Sync_Status_Tracker::SYNC_STATUS_ROUTE, 200 ), true ),
			'sync status error' => array( $respond( Sync_Status_Tracker::SYNC_STATUS_ROUTE, 403 ), false ),
			'other route'       => array( $respond( '/jetpack/v4/sync/full-sync', 200 ), false ),
			'dashboard load'    => array( $load( Analytics::MENU_PAGE_SLUG ), true ),
			'other admin page'  => array( $load( 'woocommerce' ), false ),
		);
	}

	public function test_does_not_schedule_when_already_backfilled() {
		self::record_earlier_syncs();
		update_option( Lookup_Data_Backfill::SYNCED_OPTION, 1730000456 );

		$this->backfill()->maybe_schedule();

		$this->assertSame( array(), self::scheduled_hooks() );
		$this->assertFalse( get_option( Lookup_Data_Backfill::STATE_OPTION ) );
	}

	public function test_waits_without_an_earlier_analytics_full_sync() {
		$this->backfill()->maybe_schedule();

		$this->assertSame( array(), self::scheduled_hooks() );
		$this->assertSame( 0, (int) get_option( Lookup_Data_Backfill::SYNCED_OPTION, 0 ), 'the first analytics full sync may still run under Premium Analytics' );
	}

	/**
	 * @dataProvider provide_nothing_to_backfill
	 * @param array $results Store checks.
	 * @param bool  $plugin  Whether the standalone plugin's full sync ran.
	 */
	#[DataProvider( 'provide_nothing_to_backfill' )]
	public function test_marks_done_when_nothing_is_missing( array $results, bool $plugin = true ) {
		self::record_earlier_syncs();
		if ( ! $plugin ) {
			delete_option( Lookup_Data_Backfill::PLUGIN_FULL_SYNC_OPTION );
		}
		$backfill = $this->backfill( $results );
		$backfill->expects( $this->never() )->method( 'fetch_wpcom_products' );

		$backfill->maybe_schedule();

		$this->assertSame( array(), self::scheduled_hooks() );
		$this->assertGreaterThan( 0, (int) get_option( Lookup_Data_Backfill::SYNCED_OPTION, 0 ) );
	}

	public static function provide_nothing_to_backfill() {
		return array(
			'no orders'            => array( array( 'has_orders' => false ) ),
			'empty lookup tables'  => array( array( 'has_lookup_rows' => false ) ),
			'never ran the plugin' => array( array(), false ),
		);
	}

	public function test_asks_wordpress_com_about_the_oldest_order_and_starts_when_its_product_is_missing() {
		self::set_scheduled_state();
		$asked    = array(
			'date_type' => '',
			'from'      => '',
			'to'        => '',
		);
		$backfill = $this->backfill(
			array(
				'fetch_wpcom_products' => static function ( array $args ) use ( &$asked ) {
					$asked = $args;
					return array(
						array(
							'product_id'   => '8',
							'product_type' => 'simple',
						),
					);
				},
			)
		);
		$backfill->expects( $this->once() )->method( 'do_full_sync' );

		$backfill->start_backfill();

		$this->assertSame( 'created', $asked['date_type'] );
		$this->assertStringStartsWith( '2024-03-09T00:00:00', $asked['from'] );
		$this->assertStringStartsWith( '2024-03-11T23:59:59', $asked['to'] );
		$this->assertGreaterThan( 0, get_option( Lookup_Data_Backfill::STATE_OPTION )['started_at'] );
		$this->assertSame( array(), self::scheduled_hooks() );
	}

	/**
	 * @dataProvider provide_wordpress_com_product_rows
	 * @param array $row   The oldest order's product row in the report.
	 * @param bool  $start Whether the full sync should start.
	 */
	#[DataProvider( 'provide_wordpress_com_product_rows' )]
	public function test_starts_unless_wordpress_com_reports_the_oldest_order_product_with_its_type( array $row, bool $start ) {
		self::set_scheduled_state();
		$backfill = $this->backfill( array( 'fetch_wpcom_products' => array( $row ) ) );
		$backfill->expects( $start ? $this->once() : $this->never() )->method( 'do_full_sync' );

		$backfill->start_backfill();

		$this->assertSame( ! $start, (int) get_option( Lookup_Data_Backfill::SYNCED_OPTION, 0 ) > 0 );
		$this->assertSame( array(), self::scheduled_hooks() );
	}

	public static function provide_wordpress_com_product_rows() {
		return array(
			'product with type'       => array(
				array(
					'product_id'   => '7',
					'product_type' => 'simple',
				),
				false,
			),
			'product without catalog' => array(
				array(
					'product_id'   => '7',
					'product_type' => null,
				),
				true,
			),
		);
	}

	public function test_starts_without_a_completed_order_to_probe() {
		$backfill = $this->backfill( array( 'find_oldest_order_product' => null ) );
		$backfill->expects( $this->never() )->method( 'fetch_wpcom_products' );
		$backfill->expects( $this->once() )->method( 'do_full_sync' );

		$backfill->start_backfill();
	}

	public function test_second_action_for_the_same_run_does_nothing() {
		$backfill = $this->backfill();
		$backfill->expects( $this->once() )->method( 'do_full_sync' );

		$backfill->start_backfill();
		$backfill->start_backfill(); // @phan-suppress-current-line PhanPluginDuplicateAdjacentStatement -- The second action for the same run.

		$this->assertSame( array(), self::scheduled_hooks() );
	}

	public function test_action_does_nothing_once_backfilled() {
		update_option( Lookup_Data_Backfill::SYNCED_OPTION, 1730000456 );
		$backfill = $this->backfill();
		$backfill->expects( $this->never() )->method( 'fetch_wpcom_products' );
		$backfill->expects( $this->never() )->method( 'do_full_sync' );

		$backfill->start_backfill();

		$this->assertSame( array(), self::scheduled_hooks() );
	}

	/**
	 * @dataProvider provide_cannot_start_yet
	 * @param array $results Jetpack, Sync and WordPress.com checks.
	 */
	#[DataProvider( 'provide_cannot_start_yet' )]
	public function test_retries_while_it_cannot_start_yet( array $results ) {
		self::set_scheduled_state();
		$first_attempt = time() - HOUR_IN_SECONDS;

		$this->backfill( $results )->start_backfill( $first_attempt );

		$this->assertSame( array( Lookup_Data_Backfill::START_HOOK ), self::scheduled_hooks() );
		$this->assertSame( array( $first_attempt ), $GLOBALS['woocommerce_stats_test_scheduled_actions'][0]['args'] );
		$this->assertSame( 0, get_option( Lookup_Data_Backfill::STATE_OPTION )['started_at'] );
	}

	public static function provide_cannot_start_yet() {
		return array(
			'full sync running'           => array( array( 'is_full_sync_running' => true ) ),
			'Jetpack disconnected'        => array( array( 'is_jetpack_connected' => false ) ),
			'sync not allowed'            => array( array( 'is_sync_allowed' => false ) ),
			'WordPress.com not answering' => array( array( 'fetch_wpcom_products' => null ) ),
			'Jetpack refuses'             => array( array( 'do_full_sync' => false ) ),
		);
	}

	public function test_starts_without_an_answer_once_the_retry_window_ends() {
		$backfill = $this->backfill( array( 'fetch_wpcom_products' => null ) );
		$backfill->expects( $this->once() )->method( 'do_full_sync' );

		$backfill->start_backfill( time() - Lookup_Data_Backfill::RETRY_WINDOW );
	}

	public function test_stops_retrying_after_the_retry_window() {
		self::set_scheduled_state();

		$this->backfill( array( 'is_full_sync_running' => true ) )->start_backfill( time() - Lookup_Data_Backfill::RETRY_WINDOW );

		$this->assertSame( array(), self::scheduled_hooks() );
		$this->assertFalse( get_option( Lookup_Data_Backfill::STATE_OPTION ), 'the next dashboard check schedules a new run' );
	}

	/**
	 * @dataProvider provide_full_sync_config
	 * @param int[] $product_ids Products and variations.
	 * @param array $config      Expected full sync config.
	 */
	#[DataProvider( 'provide_full_sync_config' )]
	public function test_resends_the_catalog_of_products_only( array $product_ids, array $config ) {
		$backfill = $this->backfill( array( 'get_product_ids' => $product_ids ) );
		$backfill->expects( $this->once() )->method( 'do_full_sync' )->with( $this->identicalTo( $config ) );

		$backfill->start_backfill();
	}

	public static function provide_full_sync_config() {
		return array(
			'products'              => array(
				array( 7, 8 ),
				array(
					'woocommerce_analytics' => true,
					'terms'                 => true,
					'term_relationships'    => true,
					'posts'                 => array( 7, 8 ),
				),
			),
			'no products'           => array( array(), array( 'woocommerce_analytics' => true ) ),
			'more than the maximum' => array(
				range( 1, Lookup_Data_Backfill::MAX_PRODUCT_IDS + 1 ),
				array(
					'woocommerce_analytics' => true,
					'terms'                 => true,
					'term_relationships'    => true,
					'posts'                 => true,
				),
			),
		);
	}

	/**
	 * @dataProvider provide_scheduled_run
	 * @param bool $pending Whether the run's action is still pending.
	 */
	#[DataProvider( 'provide_scheduled_run' )]
	public function test_releases_a_scheduled_run_whose_action_is_gone( bool $pending ) {
		self::record_earlier_syncs();
		self::set_scheduled_state();
		if ( $pending ) {
			as_schedule_single_action( time(), Lookup_Data_Backfill::START_HOOK, array( 0 ) );
		}

		$this->backfill()->maybe_schedule();

		$this->assertCount( 1, self::scheduled_hooks() );
		$this->assertSame( $pending, 1730000000 === get_option( Lookup_Data_Backfill::STATE_OPTION )['scheduled_at'], 'only a gone action gets a new run' );
	}

	public static function provide_scheduled_run() {
		return array(
			'action pending' => array( true ),
			'action gone'    => array( false ),
		);
	}

	/**
	 * @dataProvider provide_started_run
	 * @param array $status   Stored full sync status.
	 * @param bool  $running  Whether a full sync is running.
	 * @param bool  $schedule Whether a new run is scheduled.
	 * @param bool  $synced   Whether the data is marked synced.
	 */
	#[DataProvider( 'provide_started_run' )]
	public function test_handles_a_started_run_on_the_next_check( array $status, bool $running, bool $schedule, bool $synced ) {
		self::record_earlier_syncs();
		update_option(
			Lookup_Data_Backfill::STATE_OPTION,
			array(
				'scheduled_at' => 1730000000,
				'started_at'   => 1730000001,
			)
		);

		$this->backfill(
			array(
				'get_full_sync_status' => $status,
				'is_full_sync_running' => $running,
			)
		)->maybe_schedule();

		$this->assertSame( $schedule ? array( Lookup_Data_Backfill::START_HOOK ) : array(), self::scheduled_hooks() );
		$this->assertSame( $synced, (int) get_option( Lookup_Data_Backfill::SYNCED_OPTION, 0 ) > 0 );
	}

	public static function provide_started_run() {
		$ours = array(
			'context'  => Lookup_Data_Backfill::FULL_SYNC_CONTEXT,
			'finished' => 1730000500,
			'progress' => array( 'woocommerce_analytics' => array( 'finished' => true ) ),
		);

		return array(
			'replaced by a finished full sync' => array(
				array(
					'context'  => null,
					'finished' => 1730000500,
					'progress' => array( 'options' => array( 'finished' => true ) ),
				),
				false,
				true,
				false,
			),
			'replaced by a running full sync'  => array( array( 'context' => null ), true, false, false ),
			'still running'                    => array( array( 'context' => Lookup_Data_Backfill::FULL_SYNC_CONTEXT ), true, false, false ),
			'finished, end missed'             => array( $ours, false, false, true ),
		);
	}

	/**
	 * @dataProvider provide_full_sync_end_configs
	 * @param array $config   Config of the full sync that ended.
	 * @param int   $expected Expected lookup data marker.
	 */
	#[DataProvider( 'provide_full_sync_end_configs' )]
	public function test_full_sync_end_marks_the_lookup_data_synced( array $config, int $expected ) {
		// The milestone may come from the standalone plugin's sync, which sent no lookup data.
		update_option( Sync_Status_Tracker::INITIAL_ANALYTICS_SYNC_OPTION, 1730000000 );

		$this->backfill( array( 'get_full_sync_status' => array( 'config' => $config ) ) )->on_sync_processed_actions(
			array( array( 'jetpack_full_sync_end', array(), 0, 1730000123 ) )
		);

		$this->assertSame( $expected, (int) get_option( Lookup_Data_Backfill::SYNCED_OPTION, 0 ) );
	}

	public static function provide_full_sync_end_configs() {
		return array(
			'full analytics sync'    => array( array( 'woocommerce_analytics' => true ), 1730000123 ),
			'partial analytics sync' => array(
				array(
					'woocommerce_analytics' => array(
						'start_date' => '2024-01-01',
						'end_date'   => '2024-02-01',
					),
				),
				0,
			),
			'no analytics module'    => array( array( 'posts' => true ), 0 ),
		);
	}
}
