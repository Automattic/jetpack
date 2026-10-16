<?php
/**
 * Tests for the purchase success script data.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../../src/purchase-success.php';

/**
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_stats_purchase_success_type
 * @covers ::Automattic\Jetpack\PremiumAnalytics\configure_purchase_success
 * @covers ::Automattic\Jetpack\PremiumAnalytics\inject_purchase_success_script_data
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_stats_purchase_success_type' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\configure_purchase_success' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\inject_purchase_success_script_data' )]
class Purchase_Success_Test extends BaseTestCase {

	/**
	 * Serve the dashboard.
	 */
	public function set_up() {
		parent::set_up();
		$_GET['page'] = Analytics::MENU_PAGE_SLUG;
		set_current_screen( 'toplevel_page_' . Analytics::MENU_PAGE_SLUG );
	}

	/**
	 * Reset the request and filters.
	 */
	public function tear_down() {
		remove_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_purchase_success_script_data', 20 );
		unset( $_GET['page'], $_GET['statsPurchaseSuccess'], $GLOBALS['current_screen'] );
		parent::tear_down();
	}

	/**
	 * @dataProvider provide_purchase_success_params
	 *
	 * @param string|null $param    The `statsPurchaseSuccess` query value, or none.
	 * @param string      $expected The type the server reports.
	 */
	#[DataProvider( 'provide_purchase_success_params' )]
	public function test_reads_only_the_types_checkout_reports( $param, $expected ) {
		if ( null !== $param ) {
			$_GET['statsPurchaseSuccess'] = $param;
		}

		$this->assertSame( $expected, get_stats_purchase_success_type() );
	}

	/**
	 * Query values and the type each one reports.
	 *
	 * @return array
	 */
	public static function provide_purchase_success_params() {
		return array(
			'paid'    => array( 'paid', 'paid' ),
			'free'    => array( 'free', 'free' ),
			'unknown' => array( 'refund', '' ),
			'absent'  => array( null, '' ),
		);
	}

	public function test_registered_filter_adds_the_purchase_beside_existing_script_data() {
		configure_purchase_success();
		$_GET['statsPurchaseSuccess'] = 'paid';

		$data = apply_filters( 'jetpack_admin_js_script_data', array( 'premium_analytics' => array( 'has_videopress' => true ) ) );

		$this->assertSame(
			array(
				'has_videopress'   => true,
				'purchase_success' => array( 'type' => 'paid' ),
			),
			$data['premium_analytics']
		);
	}

	/**
	 * @dataProvider provide_requests_without_a_dashboard_purchase
	 *
	 * @param string|null $param The `statsPurchaseSuccess` query value, or none.
	 * @param string      $page  The admin page requested.
	 */
	#[DataProvider( 'provide_requests_without_a_dashboard_purchase' )]
	public function test_script_data_is_left_alone( $param, $page ) {
		if ( null !== $param ) {
			$_GET['statsPurchaseSuccess'] = $param;
		}
		$_GET['page'] = $page;
		set_current_screen( 'toplevel_page_' . $page );

		$this->assertSame( array( 'premium_analytics' => array() ), inject_purchase_success_script_data( array( 'premium_analytics' => array() ) ) );
	}

	/**
	 * Requests that must not report a purchase.
	 *
	 * @return array
	 */
	public static function provide_requests_without_a_dashboard_purchase() {
		return array(
			'no purchase on the dashboard' => array( null, Analytics::MENU_PAGE_SLUG ),
			'purchase on another page'     => array( 'paid', 'jetpack' ),
		);
	}
}
