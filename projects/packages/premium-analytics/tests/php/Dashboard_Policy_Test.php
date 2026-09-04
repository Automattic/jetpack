<?php
/**
 * Tests for dashboard policy script data.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\After;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../src/dashboard-policy.php';

/**
 * @covers ::Automattic\Jetpack\PremiumAnalytics\configure_dashboard_policy
 * @covers ::Automattic\Jetpack\PremiumAnalytics\dashboard_role
 * @covers ::Automattic\Jetpack\PremiumAnalytics\dashboard_capabilities
 * @covers ::Automattic\Jetpack\PremiumAnalytics\inject_dashboard_policy_script_data
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\configure_dashboard_policy' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\dashboard_role' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\dashboard_capabilities' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\inject_dashboard_policy_script_data' )]
class Dashboard_Policy_Test extends TestCase {

	/**
	 * @after
	 */
	#[After]
	public function tear_down() {
		wp_set_current_user( 0 );
		remove_all_filters( DASHBOARD_ROLE_FILTER );
		remove_all_filters( DASHBOARD_CAPABILITIES_FILTER );
		remove_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_dashboard_policy_script_data', 20 );
	}

	public function test_role_is_reader_without_a_user() {
		wp_set_current_user( 0 );

		$this->assertSame( DASHBOARD_ROLE_READER, dashboard_role() );
	}

	public function test_role_is_the_users_first_wordpress_role() {
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'dashboard-policy-editor',
					'user_pass'  => 'password',
					'role'       => 'editor',
				)
			)
		);

		$this->assertSame( 'editor', dashboard_role() );
	}

	public function test_role_filter_overrides_the_resolved_role() {
		add_filter( DASHBOARD_ROLE_FILTER, fn() => DASHBOARD_ROLE_AUTOMATTICIAN );

		$this->assertSame( DASHBOARD_ROLE_AUTOMATTICIAN, dashboard_role() );
	}

	public function test_capabilities_reserve_adding_and_removing_to_automatticians() {
		$reader        = dashboard_capabilities( DASHBOARD_ROLE_READER );
		$administrator = dashboard_capabilities( 'administrator' );
		$automattician = dashboard_capabilities( DASHBOARD_ROLE_AUTOMATTICIAN );

		$this->assertSame( DASHBOARD_OPERATIONS, array_keys( $reader ) );
		$this->assertTrue( $reader['customize'] );
		$this->assertFalse( $reader['insert'] );
		$this->assertFalse( $reader['remove'] );
		$this->assertFalse( $administrator['insert'] );
		$this->assertFalse( $administrator['remove'] );
		$this->assertTrue( $automattician['insert'] );
		$this->assertTrue( $automattician['remove'] );
	}

	public function test_capabilities_filter_adjusts_the_map_and_keeps_only_known_operations() {
		add_filter(
			DASHBOARD_CAPABILITIES_FILTER,
			function ( $capabilities, $role ) {
				if ( 'administrator' === $role ) {
					$capabilities['insert'] = 1;
					$capabilities['launch'] = true;
				}
				return $capabilities;
			},
			10,
			2
		);

		$administrator = dashboard_capabilities( 'administrator' );

		$this->assertTrue( $administrator['insert'] );
		$this->assertFalse( $administrator['remove'] );
		$this->assertArrayNotHasKey( 'launch', $administrator );
	}

	public function test_script_data_carries_the_role_and_its_capabilities() {
		$data = inject_dashboard_policy_script_data(
			array(
				'premium_analytics' => array(
					'initial_full_sync_finished' => 0,
				),
			)
		);

		$this->assertSame( 0, $data['premium_analytics']['initial_full_sync_finished'] );
		$this->assertSame( DASHBOARD_ROLE_READER, $data['premium_analytics']['dashboard']['role'] );
		$this->assertFalse( $data['premium_analytics']['dashboard']['capabilities']['insert'] );
		$this->assertTrue( $data['premium_analytics']['dashboard']['capabilities']['customize'] );
	}

	public function test_configure_registers_script_data_filter() {
		configure_dashboard_policy();

		$this->assertNotFalse(
			has_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_dashboard_policy_script_data' )
		);
	}
}
