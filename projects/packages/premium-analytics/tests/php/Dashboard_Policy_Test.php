<?php
/**
 * Tests for the dashboard feature flags and the script data older copies read.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use PHPUnit\Framework\Attributes\After;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../src/dashboard-policy.php';

/**
 * @covers ::Automattic\Jetpack\PremiumAnalytics\register_dashboard_feature_flags
 * @covers ::Automattic\Jetpack\PremiumAnalytics\is_dashboard_store_section_enabled
 * @covers ::Automattic\Jetpack\PremiumAnalytics\is_dashboard_unlocked_for_a11n
 * @covers ::Automattic\Jetpack\PremiumAnalytics\configure_dashboard_policy
 * @covers ::Automattic\Jetpack\PremiumAnalytics\inject_dashboard_policy_script_data
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\register_dashboard_feature_flags' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\is_dashboard_store_section_enabled' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\is_dashboard_unlocked_for_a11n' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\configure_dashboard_policy' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\inject_dashboard_policy_script_data' )]
class Dashboard_Policy_Test extends TestCase {

	/**
	 * @after
	 */
	#[After]
	public function tear_down() {
		remove_filter( 'jetpack_feature_flag_enabled_' . DASHBOARD_STORE_SECTION_FLAG, '__return_true' );
		remove_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_dashboard_policy_script_data', 20 );
		Feature_Flags::reset();
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

	public function test_store_section_flag_registers_off_by_default() {
		register_dashboard_feature_flags();

		$flags = Feature_Flags::all();

		$this->assertMatchesRegularExpression( '/^[a-z0-9][a-z0-9_-]*$/', DASHBOARD_STORE_SECTION_FLAG );
		$this->assertArrayHasKey( DASHBOARD_STORE_SECTION_FLAG, $flags );
		$this->assertFalse( $flags[ DASHBOARD_STORE_SECTION_FLAG ]['default'] );
		$this->assertSame( 'jetpack-premium-analytics', $flags[ DASHBOARD_STORE_SECTION_FLAG ]['owner'] );
		$this->assertFalse( is_dashboard_store_section_enabled() );
	}

	public function test_older_copies_find_the_a11n_unlock_switched_off() {
		// @phan-suppress-next-line PhanDeprecatedFunction -- Covers the stub older copies call.
		$this->assertFalse( is_dashboard_unlocked_for_a11n() );
	}

	public function test_store_section_flag_can_be_switched_on() {
		register_dashboard_feature_flags();
		add_filter( 'jetpack_feature_flag_enabled_' . DASHBOARD_STORE_SECTION_FLAG, '__return_true' );

		$this->assertTrue( is_dashboard_store_section_enabled() );
	}
}
