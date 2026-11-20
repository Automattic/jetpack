<?php
/**
 * Tests for the WooCommerce tab's notice while the store has no orders.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats;

use PHPUnit\Framework\Attributes\CoversMethod;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\WooCommerceStats\Analytics_Dashboard::get_no_orders_notice
 */
#[CoversMethod( Analytics_Dashboard::class, 'get_no_orders_notice' )]
class No_Orders_Notice_Test extends TestCase {

	public function test_has_no_notice_without_woocommerce() {
		$this->assertNull( Analytics_Dashboard::get_no_orders_notice() );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 * @dataProvider provide_order_ids
	 *
	 * @param string[] $orders     The store's orders, as id to status.
	 * @param bool     $has_notice Whether the tab shows the notice.
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	#[DataProvider( 'provide_order_ids' )]
	public function test_shows_the_notice_only_before_the_first_order( $orders, $has_notice ) {
		require_once __DIR__ . '/mocks/woocommerce-mock.php';
		$GLOBALS['woocommerce_stats_mock_orders'] = $orders;

		$notice = Analytics_Dashboard::get_no_orders_notice();

		$this->assertSame( $has_notice, is_string( $notice ) && '' !== $notice );
	}

	/**
	 * @return array[]
	 */
	public static function provide_order_ids() {
		return array(
			'no orders'               => array( array(), true ),
			'only a checkout draft'   => array( array( 7 => 'checkout-draft' ), true ),
			'a pending payment order' => array( array( 42 => 'pending' ), false ),
		);
	}
}
