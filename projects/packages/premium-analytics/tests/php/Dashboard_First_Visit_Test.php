<?php
/**
 * Tests for the record of the site's first dashboard load.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversFunction;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../../src/dashboard-first-visit.php';

/**
 * @covers ::Automattic\Jetpack\PremiumAnalytics\configure_dashboard_first_visit
 * @covers ::Automattic\Jetpack\PremiumAnalytics\record_dashboard_first_visit
 * @covers ::Automattic\Jetpack\PremiumAnalytics\inject_dashboard_first_visit_script_data
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\configure_dashboard_first_visit' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\record_dashboard_first_visit' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\inject_dashboard_first_visit_script_data' )]
class Dashboard_First_Visit_Test extends BaseTestCase {

	/**
	 * Reset the option, the request and the hooks.
	 */
	public function tear_down() {
		delete_option( DASHBOARD_FIRST_VISIT_OPTION );
		unset( $_GET['page'], $GLOBALS['current_screen'] );
		remove_action( 'admin_init', __NAMESPACE__ . '\\record_dashboard_first_visit' );
		remove_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_dashboard_first_visit_script_data', 20 );
		parent::tear_down();
	}

	/**
	 * Place the request on the dashboard.
	 */
	private function open_dashboard() {
		$_GET['page'] = Analytics::MENU_PAGE_SLUG;
		set_current_screen( 'toplevel_page_' . Analytics::MENU_PAGE_SLUG );
	}

	/**
	 * A later visit must not restart the clock.
	 */
	public function test_keeps_the_first_visit_on_later_visits() {
		$this->open_dashboard();
		update_option( DASHBOARD_FIRST_VISIT_OPTION, 1000 );

		record_dashboard_first_visit();

		$this->assertSame( 1000, (int) get_option( DASHBOARD_FIRST_VISIT_OPTION ) );
	}

	/**
	 * The first load stores the current time.
	 */
	public function test_records_the_first_visit() {
		$this->open_dashboard();

		record_dashboard_first_visit();

		$this->assertEqualsWithDelta( time(), (int) get_option( DASHBOARD_FIRST_VISIT_OPTION ), 5 );
	}

	/**
	 * Other admin pages do not start the clock.
	 */
	public function test_other_admin_pages_record_nothing() {
		$_GET['page'] = 'jetpack';
		set_current_screen( 'toplevel_page_jetpack' );

		record_dashboard_first_visit();

		$this->assertFalse( get_option( DASHBOARD_FIRST_VISIT_OPTION ) );
	}

	/**
	 * The stored time rides along with the rest of the script data.
	 */
	public function test_script_data_carries_the_first_visit_without_clobbering_siblings() {
		$this->open_dashboard();
		update_option( DASHBOARD_FIRST_VISIT_OPTION, 1000 );

		$data = inject_dashboard_first_visit_script_data( array( 'premium_analytics' => array( 'has_videopress' => true ) ) );

		$this->assertTrue( $data['premium_analytics']['has_videopress'] );
		$this->assertSame( 1000, $data['premium_analytics']['first_visit'] );
	}

	/**
	 * Configure hooks the record and the injector.
	 */
	public function test_configure_hooks_the_record_and_the_injector() {
		configure_dashboard_first_visit();

		$this->assertSame( 10, has_action( 'admin_init', __NAMESPACE__ . '\\record_dashboard_first_visit' ) );
		$this->assertSame( 20, has_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_dashboard_first_visit_script_data' ) );
	}
}
