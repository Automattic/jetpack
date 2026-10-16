<?php
/**
 * Tests for Lookup_Data_Backfill.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Sync;

use PHPUnit\Framework\Attributes\After;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\Attributes\Before;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Sync\Lookup_Data_Backfill
 */
#[CoversClass( Lookup_Data_Backfill::class )]
#[AllowMockObjectsWithoutExpectations /* Partial mocks stub the store and Jetpack checks; getStubBuilder() doesn't exist until PHPUnit 12.5. */]
class Lookup_Data_Backfill_Test extends TestCase {

	/**
	 * @before
	 */
	#[Before]
	public function set_up() {
		\WorDBless\Options::init()->clear_options();
		$GLOBALS['jpa_test_scheduled_actions'] = array();
		// Raw options query $wpdb directly, which WorDBless doesn't back.
		add_filter( 'jetpack_disabled_raw_options', array( $this, 'bypass_full_sync_status_raw_option' ) );
	}

	/**
	 * @param array $options Raw options read through the Options API instead.
	 * @return array
	 */
	public function bypass_full_sync_status_raw_option( $options ) {
		$options['jetpack_sync_full_status'] = true;
		return $options;
	}

	/**
	 * @after
	 */
	#[After]
	public function tear_down() {
		unset( $GLOBALS['jpa_test_scheduled_actions'] );
		remove_all_filters( 'jetpack_disabled_raw_options' );
		\WorDBless\Options::init()->clear_options();
	}

	/**
	 * A backfill whose store, Jetpack and Sync checks pass unless overridden.
	 *
	 * @param array $results Return values by stubbed method name.
	 * @return Lookup_Data_Backfill&MockObject
	 */
	private function backfill( array $results = array() ) {
		$results += array(
			'has_orders'           => true,
			'has_lookup_rows'      => true,
			'is_jetpack_connected' => true,
			'is_sync_allowed'      => true,
			'is_full_sync_running' => false,
			'start_full_sync'      => true,
		);

		$backfill = $this->getMockBuilder( Lookup_Data_Backfill::class )
			->onlyMethods( array_keys( $results ) )
			->getMock();
		foreach ( $results as $method => $result ) {
			$backfill->method( $method )->willReturn( $result );
		}
		return $backfill;
	}

	private static function scheduled_hooks(): array {
		return array_column( $GLOBALS['jpa_test_scheduled_actions'], 'hook' );
	}

	/**
	 * @dataProvider provide_earlier_analytics_full_sync
	 * @param callable $record_earlier_sync Records a finished analytics full sync.
	 */
	#[DataProvider( 'provide_earlier_analytics_full_sync' )]
	public function test_schedules_once_after_an_earlier_analytics_full_sync( callable $record_earlier_sync ) {
		$record_earlier_sync();
		$backfill = $this->backfill();

		$backfill->maybe_schedule();
		$backfill->maybe_schedule(); // @phan-suppress-current-line PhanPluginDuplicateAdjacentStatement -- A second admin request must not schedule again.

		$this->assertSame( array( Lookup_Data_Backfill::START_HOOK ), self::scheduled_hooks() );
		$this->assertSame( 0, get_option( Lookup_Data_Backfill::STATE_OPTION )['started_at'] );
	}

	public static function provide_earlier_analytics_full_sync() {
		return array(
			'milestone'          => array(
				static function () {
					update_option( Sync_Status_Tracker::INITIAL_ANALYTICS_SYNC_OPTION, 1730000123 );
				},
			),
			'stored full status' => array(
				static function () {
					\Jetpack_Options::update_raw_option(
						'jetpack_sync_full_status',
						array(
							'started'  => 1730000000,
							'finished' => 1730000123,
							'progress' => array( 'woocommerce_analytics' => array( 'finished' => true ) ),
						)
					);
				},
			),
		);
	}

	public function test_does_not_schedule_when_already_backfilled() {
		update_option( Sync_Status_Tracker::INITIAL_ANALYTICS_SYNC_OPTION, 1730000123 );
		update_option( Sync_Status_Tracker::LOOKUP_DATA_SYNCED_OPTION, 1730000456 );

		$this->backfill()->maybe_schedule();

		$this->assertSame( array(), self::scheduled_hooks() );
		$this->assertFalse( get_option( Lookup_Data_Backfill::STATE_OPTION ) );
	}

	public function test_waits_without_an_earlier_analytics_full_sync() {
		$this->backfill()->maybe_schedule();

		$this->assertSame( array(), self::scheduled_hooks() );
		$this->assertSame( 0, (int) get_option( Sync_Status_Tracker::LOOKUP_DATA_SYNCED_OPTION, 0 ), 'the first analytics full sync may still run under Premium Analytics' );
	}

	/**
	 * @dataProvider provide_nothing_to_backfill
	 * @param array $results Store checks.
	 */
	#[DataProvider( 'provide_nothing_to_backfill' )]
	public function test_marks_done_when_nothing_is_missing( array $results ) {
		update_option( Sync_Status_Tracker::INITIAL_ANALYTICS_SYNC_OPTION, 1730000123 );

		$this->backfill( $results )->maybe_schedule();

		$this->assertSame( array(), self::scheduled_hooks() );
		$this->assertGreaterThan( 0, (int) get_option( Sync_Status_Tracker::LOOKUP_DATA_SYNCED_OPTION, 0 ) );
	}

	public static function provide_nothing_to_backfill() {
		return array(
			'no orders'           => array( array( 'has_orders' => false ) ),
			'empty lookup tables' => array( array( 'has_lookup_rows' => false ) ),
		);
	}

	public function test_starts_the_full_sync() {
		$backfill = $this->backfill();
		$backfill->expects( $this->once() )->method( 'start_full_sync' );

		$backfill->start_backfill();

		$this->assertGreaterThan( 0, get_option( Lookup_Data_Backfill::STATE_OPTION )['started_at'] );
		$this->assertSame( array(), self::scheduled_hooks() );
	}

	public function test_second_action_for_the_same_run_does_nothing() {
		$backfill = $this->backfill();
		$backfill->expects( $this->once() )->method( 'start_full_sync' );

		$backfill->start_backfill();
		$backfill->start_backfill(); // @phan-suppress-current-line PhanPluginDuplicateAdjacentStatement -- The second action for the same run.

		$this->assertSame( array(), self::scheduled_hooks() );
	}

	public function test_action_does_nothing_once_backfilled() {
		update_option( Sync_Status_Tracker::LOOKUP_DATA_SYNCED_OPTION, 1730000456 );
		$backfill = $this->backfill();
		$backfill->expects( $this->never() )->method( 'start_full_sync' );

		$backfill->start_backfill();

		$this->assertSame( array(), self::scheduled_hooks() );
	}

	/**
	 * @dataProvider provide_full_sync_cannot_start
	 * @param array $results Jetpack and Sync checks.
	 */
	#[DataProvider( 'provide_full_sync_cannot_start' )]
	public function test_retries_while_the_full_sync_cannot_start( array $results ) {
		update_option(
			Lookup_Data_Backfill::STATE_OPTION,
			array(
				'scheduled_at' => 1730000000,
				'started_at'   => 0,
			)
		);
		$first_attempt = time() - HOUR_IN_SECONDS;
		$backfill      = $this->backfill( $results );

		$backfill->start_backfill( $first_attempt );

		$this->assertSame( array( Lookup_Data_Backfill::START_HOOK ), self::scheduled_hooks() );
		$this->assertSame( array( $first_attempt ), $GLOBALS['jpa_test_scheduled_actions'][0]['args'] );
		$this->assertSame( 0, get_option( Lookup_Data_Backfill::STATE_OPTION )['started_at'] );
	}

	public static function provide_full_sync_cannot_start() {
		return array(
			'full sync running'    => array( array( 'is_full_sync_running' => true ) ),
			'Jetpack disconnected' => array( array( 'is_jetpack_connected' => false ) ),
			'sync not allowed'     => array( array( 'is_sync_allowed' => false ) ),
			'Jetpack refuses'      => array( array( 'start_full_sync' => false ) ),
		);
	}

	public function test_stops_retrying_after_the_retry_window() {
		$this->backfill( array( 'is_full_sync_running' => true ) )->start_backfill( time() - Lookup_Data_Backfill::RETRY_WINDOW );

		$this->assertSame( array(), self::scheduled_hooks() );
	}
}
