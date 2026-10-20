<?php
/**
 * Tests for the shims older copies of the dashboard policy call.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\After;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../src/dashboard-policy.php';

/**
 * @covers ::Automattic\Jetpack\PremiumAnalytics\is_dashboard_unlocked_for_a11n
 * @covers ::Automattic\Jetpack\PremiumAnalytics\configure_dashboard_policy
 * @covers ::Automattic\Jetpack\PremiumAnalytics\inject_dashboard_policy_script_data
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\is_dashboard_unlocked_for_a11n' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\configure_dashboard_policy' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\inject_dashboard_policy_script_data' )]
class Dashboard_Policy_Test extends TestCase {

	/**
	 * @after
	 */
	#[After]
	public function tear_down() {
		remove_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_dashboard_policy_script_data', 20 );
	}

	public function test_script_data_offers_older_copies_composition_next_to_existing_keys() {
		// @phan-suppress-next-line PhanDeprecatedFunction -- Covers the shim older copies call.
		$data = inject_dashboard_policy_script_data(
			array(
				'premium_analytics' => array(
					'initial_full_sync_finished' => 0,
				),
			)
		);

		$this->assertSame( 0, $data['premium_analytics']['initial_full_sync_finished'] );
		$this->assertTrue( $data['premium_analytics']['dashboard_composition_enabled'] );
	}

	public function test_configure_registers_script_data_filter() {
		// @phan-suppress-next-line PhanDeprecatedFunction -- Covers the shim older copies call.
		configure_dashboard_policy();

		$this->assertNotFalse(
			has_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_dashboard_policy_script_data' )
		);
	}

	public function test_older_copies_find_the_a11n_unlock_switched_off() {
		// @phan-suppress-next-line PhanDeprecatedFunction -- Covers the stub older copies call.
		$this->assertFalse( is_dashboard_unlocked_for_a11n() );
	}
}
