<?php
/**
 * Tests for dashboard policy script data.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\After;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../src/dashboard-policy.php';

/**
 * @covers ::Automattic\Jetpack\PremiumAnalytics\configure_dashboard_policy
 * @covers ::Automattic\Jetpack\PremiumAnalytics\is_sandboxed_request
 * @covers ::Automattic\Jetpack\PremiumAnalytics\inject_dashboard_policy_script_data
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\configure_dashboard_policy' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\is_sandboxed_request' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\inject_dashboard_policy_script_data' )]
class Dashboard_Policy_Test extends TestCase {

	/**
	 * @after
	 */
	#[After]
	public function tear_down() {
		Constants::clear_constants();
		remove_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_dashboard_policy_script_data', 20 );
	}

	public function test_request_is_not_sandboxed_by_default() {
		$this->assertFalse( is_sandboxed_request() );
	}

	public function test_request_is_sandboxed_on_a_wpcom_sandbox() {
		Constants::set_constant( 'WPCOM_SANDBOXED', true );

		$this->assertTrue( is_sandboxed_request() );
	}

	public function test_request_is_sandboxed_when_jetpack_traffic_is() {
		Constants::set_constant( 'JETPACK__SANDBOX_DOMAIN', 'retrofocs.dev.dfw.wordpress.com' );

		$this->assertTrue( is_sandboxed_request() );
	}

	public function test_script_data_carries_both_facts_outside_wpcom() {
		$data = inject_dashboard_policy_script_data(
			array(
				'premium_analytics' => array(
					'initial_full_sync_finished' => 0,
				),
			)
		);

		$this->assertSame( 0, $data['premium_analytics']['initial_full_sync_finished'] );
		$this->assertFalse( $data['premium_analytics']['is_automattician'] );
		$this->assertFalse( $data['premium_analytics']['is_sandboxed'] );
	}

	public function test_script_data_reports_a_sandboxed_request() {
		Constants::set_constant( 'WPCOM_SANDBOXED', true );

		$data = inject_dashboard_policy_script_data( array() );

		$this->assertTrue( $data['premium_analytics']['is_sandboxed'] );
	}

	public function test_configure_registers_script_data_filter() {
		configure_dashboard_policy();

		$this->assertNotFalse(
			has_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_dashboard_policy_script_data' )
		);
	}
}
