<?php
/**
 * Tests for the Analytics class.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * Tests for the Analytics class.
 *
 * @covers \Automattic\Jetpack\PremiumAnalytics\Analytics
 */
#[CoversClass( Analytics::class )]
class Analytics_Test extends TestCase {

	/**
	 * Reset request and screen globals touched by the dashboard-request tests.
	 */
	protected function tearDown(): void {
		unset( $_GET['page'] );
		unset( $GLOBALS['current_screen'] );
		parent::tearDown();
	}

	/**
	 * Test that the Analytics class can be instantiated.
	 */
	public function test_class_exists() {
		$this->assertTrue( class_exists( Analytics::class ) );
	}

	/**
	 * The full-page dashboard slug in admin is recognized as a dashboard request.
	 */
	public function test_is_dashboard_request_true_for_full_page_slug() {
		set_current_screen( 'toplevel_page_jetpack-premium-analytics' );
		$_GET['page'] = 'jetpack-premium-analytics';

		$this->assertTrue( Analytics::is_dashboard_request() );
	}

	/**
	 * The wp-admin integrated dashboard slug in admin is recognized as a dashboard request.
	 */
	public function test_is_dashboard_request_true_for_wp_admin_slug() {
		set_current_screen( 'toplevel_page_jetpack-premium-analytics' );
		$_GET['page'] = 'jetpack-premium-analytics-wp-admin';

		$this->assertTrue( Analytics::is_dashboard_request() );
	}

	/**
	 * Any other admin page is not a dashboard request (so polyfills must not load there).
	 */
	public function test_is_dashboard_request_false_for_other_admin_page() {
		set_current_screen( 'edit-post' );
		$_GET['page'] = 'some-other-plugin';

		$this->assertFalse( Analytics::is_dashboard_request() );
	}

	/**
	 * An admin request with no page parameter is not a dashboard request.
	 */
	public function test_is_dashboard_request_false_when_no_page_param() {
		set_current_screen( 'edit-post' );
		unset( $_GET['page'] );

		$this->assertFalse( Analytics::is_dashboard_request() );
	}

	/**
	 * A front-end request carrying the dashboard slug is not a dashboard request.
	 */
	public function test_is_dashboard_request_false_on_front_end() {
		set_current_screen( 'front' );
		$_GET['page'] = 'jetpack-premium-analytics';

		$this->assertFalse( Analytics::is_dashboard_request() );
	}
}
