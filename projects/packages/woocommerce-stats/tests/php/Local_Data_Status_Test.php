<?php
/**
 * Tests for the sample that tells a store whether WooCommerce Analytics has imported its orders.
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
	 * @param array<int,bool> $orders   Sampled orders, by id: whether each has a `wc_order_stats` row.
	 * @param int[]           $excluded Orders core leaves out of its import on purpose.
	 * @param int[]           $recent   Orders changed within the last hour.
	 * @param string[]        $issues   The issues expected.
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	#[DataProvider( 'provide_stores' )]
	public function test_reports_what_the_sample_finds( $orders, $excluded, $recent, $issues ) {
		require_once __DIR__ . '/mocks/woocommerce-analytics-mock.php';

		$this->assertSame( $issues, self::fixture_status( $orders, $excluded, $recent )->get_issues() );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_reuses_the_sample_until_it_expires() {
		require_once __DIR__ . '/mocks/woocommerce-analytics-mock.php';

		self::fixture_status( array( 1 => false ) )->get_issues();
		$issues = self::fixture_status( array( 1 => false ) )->get_issues();

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

		$this->assertSame( array( Local_Data_Status::ANALYTICS_OFF ), self::fixture_status( array( 1 => false ) )->get_issues() );
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
		return array(
			'no orders'                           => array( array(), array(), array(), array() ),
			'every order imported'                => array(
				array(
					1 => true,
					2 => true,
				),
				array(),
				array(),
				array(),
			),
			'an order not imported'               => array(
				array(
					1 => true,
					3 => false,
				),
				array(),
				array(),
				array( Local_Data_Status::IMPORT_INCOMPLETE ),
			),
			'an order core leaves out on purpose' => array(
				array(
					1 => true,
					3 => false,
				),
				array( 3 ),
				array(),
				array(),
			),
			// Core may not have imported it yet.
			'an order changed within the hour'    => array(
				array(
					1 => true,
					3 => false,
				),
				array(),
				array( 3 ),
				array(),
			),
		);
	}

	/**
	 * A status reading the fixtures instead of the database.
	 *
	 * @param array<int,bool> $orders   Sampled orders, by id: whether each has a row.
	 * @param int[]           $excluded Orders left out on purpose.
	 * @param int[]           $recent   Orders changed within the last hour.
	 * @return Local_Data_Status
	 */
	private static function fixture_status( $orders, $excluded = array(), $recent = array() ) {
		return new class( $orders, $excluded, $recent ) extends Local_Data_Status {
			/**
			 * Fixtures.
			 *
			 * @var array
			 */
			private $fixtures;

			/**
			 * @param array<int,bool> $orders   Orders.
			 * @param int[]           $excluded Excluded ids.
			 * @param int[]           $recent   Recently changed ids.
			 */
			public function __construct( $orders, $excluded, $recent ) {
				$this->fixtures = array( $orders, $excluded, $recent );
			}

			/** @inheritDoc */
			protected function get_sample_orders() {
				$GLOBALS['woocommerce_stats_samples_taken'] = ( $GLOBALS['woocommerce_stats_samples_taken'] ?? 0 ) + 1;
				$modified                                   = array();
				foreach ( array_keys( $this->fixtures[0] ) as $id ) {
					$modified[ $id ] = in_array( $id, $this->fixtures[2], true ) ? gmdate( 'Y-m-d H:i:s' ) : '2026-01-01 00:00:00';
				}
				return $modified;
			}

			/** @inheritDoc */
			protected function get_imported_ids( array $ids ) {
				return array_keys( array_filter( array_intersect_key( $this->fixtures[0], array_flip( $ids ) ) ) );
			}

			/** @inheritDoc */
			protected function is_left_out_of_import( $id ) {
				return in_array( $id, $this->fixtures[1], true );
			}
		};
	}
}
