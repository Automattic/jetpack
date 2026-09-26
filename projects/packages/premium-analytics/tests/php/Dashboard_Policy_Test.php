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
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../src/dashboard-policy.php';

/**
 * @covers ::Automattic\Jetpack\PremiumAnalytics\register_dashboard_feature_flags
 * @covers ::Automattic\Jetpack\PremiumAnalytics\is_dashboard_composition_enabled
 * @covers ::Automattic\Jetpack\PremiumAnalytics\is_automattician_viewer
 * @covers ::Automattic\Jetpack\PremiumAnalytics\is_dashboard_unlocked_for_a11n
 * @covers ::Automattic\Jetpack\PremiumAnalytics\configure_dashboard_policy
 * @covers ::Automattic\Jetpack\PremiumAnalytics\inject_dashboard_policy_script_data
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\register_dashboard_feature_flags' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\is_dashboard_composition_enabled' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\is_automattician_viewer' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\is_dashboard_unlocked_for_a11n' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\configure_dashboard_policy' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\inject_dashboard_policy_script_data' )]
class Dashboard_Policy_Test extends TestCase {

	/**
	 * @after
	 */
	#[After]
	public function tear_down() {
		remove_filter( 'jetpack_feature_flag_enabled_' . DASHBOARD_COMPOSITION_FLAG, '__return_false' );
		remove_filter( 'jetpack_feature_flag_enabled_' . DASHBOARD_A11N_ALL_SECTIONS_FLAG, '__return_true' );
		remove_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_dashboard_policy_script_data', 20 );
		Feature_Flags::reset();
	}

	public function test_flag_name_is_one_the_control_surfaces_accept() {
		$this->assertSame( 'premium-analytics-dashboard-composition', DASHBOARD_COMPOSITION_FLAG );
		$this->assertMatchesRegularExpression( '/^[a-z0-9][a-z0-9_-]*$/', DASHBOARD_COMPOSITION_FLAG );
	}

	public function test_flag_registers_on_by_default() {
		register_dashboard_feature_flags();

		$flags = Feature_Flags::all();

		$this->assertArrayHasKey( DASHBOARD_COMPOSITION_FLAG, $flags );
		$this->assertTrue( $flags[ DASHBOARD_COMPOSITION_FLAG ]['default'] );
		$this->assertSame( 'jetpack-premium-analytics', $flags[ DASHBOARD_COMPOSITION_FLAG ]['owner'] );
	}

	public function test_composition_is_on_by_default() {
		register_dashboard_feature_flags();

		$this->assertTrue( is_dashboard_composition_enabled() );
	}

	public function test_composition_follows_the_flag() {
		register_dashboard_feature_flags();
		add_filter( 'jetpack_feature_flag_enabled_' . DASHBOARD_COMPOSITION_FLAG, '__return_false' );

		$this->assertFalse( is_dashboard_composition_enabled() );
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
		$this->assertTrue( $data['premium_analytics']['dashboard_composition_enabled'] );
	}

	public function test_script_data_reports_the_flag_off() {
		register_dashboard_feature_flags();
		add_filter( 'jetpack_feature_flag_enabled_' . DASHBOARD_COMPOSITION_FLAG, '__return_false' );

		$data = inject_dashboard_policy_script_data( array() );

		$this->assertFalse( $data['premium_analytics']['dashboard_composition_enabled'] );
	}

	public function test_configure_registers_script_data_filter() {
		configure_dashboard_policy();

		$this->assertNotFalse(
			has_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_dashboard_policy_script_data' )
		);
	}

	public function test_a11n_all_sections_flag_registers_off_by_default() {
		register_dashboard_feature_flags();

		$flags = Feature_Flags::all();

		$this->assertMatchesRegularExpression( '/^[a-z0-9][a-z0-9_-]*$/', DASHBOARD_A11N_ALL_SECTIONS_FLAG );
		$this->assertArrayHasKey( DASHBOARD_A11N_ALL_SECTIONS_FLAG, $flags );
		$this->assertFalse( $flags[ DASHBOARD_A11N_ALL_SECTIONS_FLAG ]['default'] );
		$this->assertSame( 'jetpack-premium-analytics', $flags[ DASHBOARD_A11N_ALL_SECTIONS_FLAG ]['owner'] );
	}

	public function test_nobody_is_an_automattician_without_jetpack_mu_wpcom() {
		register_dashboard_feature_flags();
		add_filter( 'jetpack_feature_flag_enabled_' . DASHBOARD_A11N_ALL_SECTIONS_FLAG, '__return_true' );

		$this->assertFalse( is_automattician_viewer() );
		$this->assertFalse( is_dashboard_unlocked_for_a11n() );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_automattician_is_not_unlocked_while_the_flag_is_off() {
		$this->use_wpcom_gate( true );
		register_dashboard_feature_flags();

		$this->assertTrue( is_automattician_viewer() );
		$this->assertFalse( is_dashboard_unlocked_for_a11n() );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_flag_unlocks_an_automattician() {
		$this->use_wpcom_gate( true );
		register_dashboard_feature_flags();
		add_filter( 'jetpack_feature_flag_enabled_' . DASHBOARD_A11N_ALL_SECTIONS_FLAG, '__return_true' );

		$this->assertTrue( is_dashboard_unlocked_for_a11n() );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_flag_does_not_unlock_a_site_owner() {
		$this->use_wpcom_gate( false );
		register_dashboard_feature_flags();
		add_filter( 'jetpack_feature_flag_enabled_' . DASHBOARD_A11N_ALL_SECTIONS_FLAG, '__return_true' );

		$this->assertFalse( is_dashboard_unlocked_for_a11n() );
	}

	/**
	 * Load the jetpack-mu-wpcom gate stand-in, answering as given.
	 *
	 * @param bool $is_a11n Whether the visitor is an Automattician.
	 */
	private function use_wpcom_gate( $is_a11n ) {
		require_once __DIR__ . '/fixtures/class-wpcom-feature-flags.php';
		\Automattic\Jetpack\Jetpack_Mu_Wpcom\Wpcom_Feature_Flags::$is_a11n = $is_a11n;
	}
}
