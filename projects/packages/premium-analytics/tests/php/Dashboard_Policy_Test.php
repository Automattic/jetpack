<?php
/**
 * Tests for the dashboard composition flag and its script data.
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
 * @covers ::Automattic\Jetpack\PremiumAnalytics\is_dashboard_composition_enabled
 * @covers ::Automattic\Jetpack\PremiumAnalytics\configure_dashboard_policy
 * @covers ::Automattic\Jetpack\PremiumAnalytics\inject_dashboard_policy_script_data
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\register_dashboard_feature_flags' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\is_dashboard_composition_enabled' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\configure_dashboard_policy' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\inject_dashboard_policy_script_data' )]
class Dashboard_Policy_Test extends TestCase {

	/**
	 * @after
	 */
	#[After]
	public function tear_down() {
		remove_filter( 'jetpack_feature_flag_enabled_' . DASHBOARD_COMPOSITION_FLAG, '__return_true' );
		remove_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_dashboard_policy_script_data', 20 );
		Feature_Flags::reset();
	}

	public function test_flag_name_is_one_the_control_surfaces_accept() {
		$this->assertSame( 'premium-analytics-dashboard-composition', DASHBOARD_COMPOSITION_FLAG );
		$this->assertMatchesRegularExpression( '/^[a-z0-9][a-z0-9_-]*$/', DASHBOARD_COMPOSITION_FLAG );
	}

	public function test_flag_registers_off_by_default() {
		register_dashboard_feature_flags();

		$flag = Feature_Flags::get( DASHBOARD_COMPOSITION_FLAG );

		$this->assertFalse( $flag['default'] );
		$this->assertSame( 'jetpack-premium-analytics', $flag['owner'] );
	}

	public function test_composition_is_off_by_default() {
		register_dashboard_feature_flags();

		$this->assertFalse( is_dashboard_composition_enabled() );
	}

	public function test_composition_follows_the_flag() {
		register_dashboard_feature_flags();
		add_filter( 'jetpack_feature_flag_enabled_' . DASHBOARD_COMPOSITION_FLAG, '__return_true' );

		$this->assertTrue( is_dashboard_composition_enabled() );
	}

	public function test_script_data_carries_the_answer_next_to_existing_keys() {
		register_dashboard_feature_flags();

		$data = inject_dashboard_policy_script_data(
			array(
				'premium_analytics' => array(
					'initial_full_sync_finished' => 0,
				),
			)
		);

		$this->assertSame( 0, $data['premium_analytics']['initial_full_sync_finished'] );
		$this->assertFalse( $data['premium_analytics']['dashboard_composition_enabled'] );
	}

	public function test_script_data_reports_the_flag_on() {
		register_dashboard_feature_flags();
		add_filter( 'jetpack_feature_flag_enabled_' . DASHBOARD_COMPOSITION_FLAG, '__return_true' );

		$data = inject_dashboard_policy_script_data( array() );

		$this->assertTrue( $data['premium_analytics']['dashboard_composition_enabled'] );
	}

	public function test_configure_registers_script_data_filter() {
		configure_dashboard_policy();

		$this->assertNotFalse(
			has_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_dashboard_policy_script_data' )
		);
	}
}
