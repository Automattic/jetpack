<?php
/**
 * Tests for the sample that tells a store whether its local report data is complete.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use WorDBless\BaseTestCase;

/**
 * Each test stubs WooCommerce Analytics, so it runs in its own process.
 *
 * @covers \Automattic\Jetpack\WooCommerceStats\Report_Execution\Local_Data_Status
 */
#[CoversClass( Local_Data_Status::class )]
class Local_Data_Status_Test extends BaseTestCase {

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 * @dataProvider provide_stores
	 *
	 * @param array    $zone     The store's `timezone_string` and `gmt_offset`.
	 * @param array[]  $stats    `wc_order_stats` rows by sampled order id; null for an order without one.
	 * @param array[]  $gmt      Paid and completed dates in GMT, by order id.
	 * @param int[]    $excluded Orders core leaves out of its import on purpose.
	 * @param string[] $issues   The issues expected.
	 * @param int[]    $recent   Orders changed within the last hour.
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	#[DataProvider( 'provide_stores' )]
	public function test_reports_what_the_sample_finds( $zone, $stats, $gmt, $excluded, $issues, $recent = array() ) {
		require_once __DIR__ . '/mocks/woocommerce-analytics-mock.php';
		update_option( 'timezone_string', $zone[0] );
		update_option( 'gmt_offset', $zone[1] );

		$this->assertSame( $issues, self::fixture_status( $stats, $gmt, $excluded, $recent )->get_issues() );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_reuses_the_sample_until_it_expires() {
		require_once __DIR__ . '/mocks/woocommerce-analytics-mock.php';
		$stats = array( 1 => null );

		self::fixture_status( $stats, array(), array() )->get_issues();
		$issues = self::fixture_status( $stats, array(), array() )->get_issues();

		$this->assertSame( array( Local_Data_Status::IMPORT_INCOMPLETE ), $issues );
		$this->assertSame( 1, $GLOBALS['woocommerce_stats_samples_taken'] );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_reports_only_analytics_off_while_it_is_off() {
		require_once __DIR__ . '/mocks/woocommerce-analytics-mock.php';
		$GLOBALS['woocommerce_stats_mock_analytics_off'] = true;

		$this->assertSame( array( Local_Data_Status::ANALYTICS_OFF ), self::fixture_status( array( 1 => null ), array(), array() )->get_issues() );
	}

	/**
	 * A failed exclusion check (null) is not an exclusion: the order still counts as missing.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 * @dataProvider provide_exclusions
	 *
	 * @param bool|null $excluded  What core's exclusion check answers.
	 * @param bool      $test_mode Whether the order is a test-mode payment.
	 * @param bool      $left_out  Whether the order is expected to be left out of the import.
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	#[DataProvider( 'provide_exclusions' )]
	public function test_leaves_out_only_what_core_excludes( $excluded, $test_mode, $left_out ) {
		require_once __DIR__ . '/mocks/woocommerce-orders-scheduler-mock.php';
		$GLOBALS['woocommerce_stats_mock_import_exclusions'] = array( 7 => $excluded );
		$GLOBALS['woocommerce_stats_mock_test_orders']       = $test_mode ? array( 7 ) : array();

		$method = new \ReflectionMethod( Local_Data_Status::class, 'is_left_out_of_import' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$this->assertSame( $left_out, $method->invoke( new Local_Data_Status(), 7 ) );
	}

	/**
	 * @return array[]
	 */
	public static function provide_exclusions() {
		return array(
			'excluded by the import filter' => array( true, false, true ),
			'the exclusion check failed'    => array( null, false, false ),
			'a test-mode payment'           => array( false, true, true ),
			'an ordinary order'             => array( false, false, false ),
		);
	}

	/**
	 * @return array[]
	 */
	public static function provide_stores() {
		$new_york = array( 'America/New_York', '' );
		// August is summer time and January winter time: one offset for both would misplace one.
		$in_zone = array(
			1 => self::row( '2026-08-12 00:30:00', '2026-08-12 04:30:00', '2026-08-12 00:31:00', null ),
			2 => self::row( '2026-01-12 23:30:00', '2026-01-13 04:30:00', null, '2026-01-14 10:00:00' ),
		);
		$gmt     = array(
			1 => array( 'date_paid' => '2026-08-12 04:31:00' ),
			2 => array( 'date_completed' => '2026-01-14 15:00:00' ),
		);

		return array(
			'no orders'                                  => array( $new_york, array(), array(), array(), array() ),
			'imported in the zone, on both sides of DST' => array( $new_york, $in_zone, $gmt, array(), array() ),
			'created imported while the store was UTC'   => array(
				$new_york,
				array( 1 => self::row( '2026-08-12 04:30:00', '2026-08-12 04:30:00', null, null ) ) + $in_zone,
				$gmt,
				array(),
				array( Local_Data_Status::REIMPORT_NEEDED ),
			),
			// Created in winter, paid in summer: only the paid date shows the old zone.
			'only the paid date in the old zone'         => array(
				array( 'UTC', '' ),
				array( 1 => self::row( '2026-01-12 10:00:00', '2026-01-12 10:00:00', '2026-06-01 11:00:00', null ) ),
				array( 1 => array( 'date_paid' => '2026-06-01 10:00:00' ) ),
				array(),
				array( Local_Data_Status::REIMPORT_NEEDED ),
			),
			'only the completed date in the old zone'    => array(
				array( 'UTC', '' ),
				array( 1 => self::row( '2026-01-12 10:00:00', '2026-01-12 10:00:00', null, '2026-06-02 11:00:00' ) ),
				array( 1 => array( 'date_completed' => '2026-06-02 10:00:00' ) ),
				array(),
				array( Local_Data_Status::REIMPORT_NEEDED ),
			),
			// Its paid date was edited, and core hasn't saved the row again yet.
			'changed within the hour'                    => array(
				array( 'UTC', '' ),
				array(
					1 => self::row( '2026-01-12 10:00:00', '2026-01-12 10:00:00', '2026-01-12 10:00:00', null ),
					3 => null,
				),
				array( 1 => array( 'date_paid' => '2026-01-12 10:30:00' ) ),
				array(),
				array(),
				array( 1, 3 ),
			),
			'a manual UTC offset, imported under it'     => array(
				array( '', '2' ),
				array( 1 => self::row( '2026-08-12 06:30:00', '2026-08-12 04:30:00', null, null ) ),
				array(),
				array(),
				array(),
			),
			'an order not imported'                      => array( $new_york, array( 3 => null ) + $in_zone, $gmt, array(), array( Local_Data_Status::IMPORT_INCOMPLETE ) ),
			'an order core leaves out on purpose'        => array( $new_york, array( 3 => null ) + $in_zone, $gmt, array( 3 ), array() ),
			'both'                                       => array(
				$new_york,
				array(
					3 => null,
					1 => self::row( '2026-08-12 04:30:00', '2026-08-12 04:30:00', null, null ),
				),
				array(),
				array(),
				array( Local_Data_Status::IMPORT_INCOMPLETE, Local_Data_Status::REIMPORT_NEEDED ),
			),
		);
	}

	/**
	 * A `wc_order_stats` row.
	 *
	 * @param string      $created     Local creation date.
	 * @param string      $created_gmt GMT creation date.
	 * @param string|null $paid        Local paid date.
	 * @param string|null $completed   Local completed date.
	 * @return array
	 */
	private static function row( $created, $created_gmt, $paid, $completed ) {
		return array(
			'date_created'     => $created,
			'date_created_gmt' => $created_gmt,
			'date_paid'        => $paid,
			'date_completed'   => $completed,
		);
	}

	/**
	 * A status reading the fixtures instead of the database.
	 *
	 * @param array<int,?array> $stats    Rows by order id; null for an order without one.
	 * @param array[]           $gmt      GMT dates by order id.
	 * @param int[]             $excluded Orders left out on purpose.
	 * @param int[]             $recent   Orders changed within the last hour.
	 * @return Local_Data_Status
	 */
	private static function fixture_status( $stats, $gmt, $excluded, $recent = array() ) {
		return new class( $stats, $gmt, $excluded, $recent ) extends Local_Data_Status {
			/**
			 * Fixtures.
			 *
			 * @var array
			 */
			private $fixtures;

			/**
			 * @param array<int,?array> $stats    Rows.
			 * @param array[]           $gmt      GMT dates.
			 * @param int[]             $excluded Excluded ids.
			 * @param int[]             $recent   Recently changed ids.
			 */
			public function __construct( $stats, $gmt, $excluded, $recent ) {
				$this->fixtures = array( $stats, $gmt, $excluded, $recent );
			}

			/** @inheritDoc */
			protected function get_sample_orders() {
				$GLOBALS['woocommerce_stats_samples_taken'] = ( $GLOBALS['woocommerce_stats_samples_taken'] ?? 0 ) + 1;
				$modified                                   = array();
				foreach ( array_keys( $this->fixtures[0] ) as $id ) {
					$modified[ $id ] = in_array( $id, $this->fixtures[3], true ) ? gmdate( 'Y-m-d H:i:s' ) : '2026-01-01 00:00:00';
				}
				return $modified;
			}

			/** @inheritDoc */
			protected function get_stats_rows( array $ids ) {
				return array_filter( array_intersect_key( $this->fixtures[0], array_flip( $ids ) ) );
			}

			/** @inheritDoc */
			protected function get_gmt_dates( array $ids ) {
				return array_intersect_key( $this->fixtures[1], array_flip( $ids ) );
			}

			/** @inheritDoc */
			protected function is_left_out_of_import( $id ) {
				return in_array( $id, $this->fixtures[2], true );
			}
		};
	}
}
