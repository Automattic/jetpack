<?php
/**
 * Wpcom Dashboard Tests.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-dashboard/class-wpcom-dashboard.php';

/**
 * Tests for the Wpcom_Dashboard class.
 */
class Wpcom_Dashboard_Test extends \WorDBless\BaseTestCase {

	/**
	 * Set up test fixtures.
	 */
	public function set_up() {
		parent::set_up();
		remove_all_filters( 'wpcom_dashboard_replacement_enabled' );
		remove_all_filters( 'wpcom_dashboard_replacement_holdout_is_treatment' );
		Wpcom_Dashboard::init();
	}

	/**
	 * Tear down test fixtures.
	 */
	public function tear_down() {
		remove_all_filters( 'wpcom_dashboard_replacement_enabled' );
		remove_all_filters( 'wpcom_dashboard_replacement_holdout_is_treatment' );
		parent::tear_down();
	}

	/**
	 * Test that is_active returns false by default (no feature flag, no experiment).
	 */
	public function test_is_active_returns_false_by_default() {
		$this->assertFalse( Wpcom_Dashboard::is_active() );
	}

	/**
	 * Test that is_active returns true when the feature flag filter is overridden.
	 */
	public function test_is_active_returns_true_when_feature_flag_enabled() {
		add_filter( 'wpcom_dashboard_replacement_enabled', '__return_true' );
		$this->assertTrue( Wpcom_Dashboard::is_active() );
	}

	/**
	 * Test that is_active returns true when the holdout filter returns true.
	 */
	public function test_is_active_returns_true_when_holdout_is_treatment() {
		add_filter( 'wpcom_dashboard_replacement_holdout_is_treatment', '__return_true' );
		$this->assertTrue( Wpcom_Dashboard::is_active() );
	}

	/**
	 * Test that feature flag takes priority (short-circuits before holdout check).
	 */
	public function test_feature_flag_short_circuits_holdout() {
		add_filter( 'wpcom_dashboard_replacement_enabled', '__return_true' );
		// Holdout is false, but feature flag is true — should still be active.
		$this->assertTrue( Wpcom_Dashboard::is_active() );
	}

	/**
	 * Test that is_feature_flag_enabled defaults to false.
	 */
	public function test_is_feature_flag_enabled_defaults_to_false() {
		$this->assertFalse( Wpcom_Dashboard::is_feature_flag_enabled() );
	}

	/**
	 * Test that is_holdout_treatment returns false when no user is logged in.
	 */
	public function test_is_holdout_treatment_returns_false_for_logged_out_user() {
		wp_set_current_user( 0 );
		$this->assertFalse( Wpcom_Dashboard::is_holdout_treatment() );
	}

	/**
	 * Test the experiment name constant.
	 */
	public function test_experiment_name_constant() {
		$this->assertSame( 'wpcom_custom_dashboard_holdout', Wpcom_Dashboard::EXPERIMENT_NAME );
	}

	/**
	 * Test that is_holdout_treatment returns the cached transient value.
	 */
	public function test_is_holdout_treatment_returns_cached_value() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'test_user_' . wp_rand(),
				'user_pass'  => 'password',
				'user_email' => 'test_' . wp_rand() . '@example.com',
			)
		);
		wp_set_current_user( $user_id );

		$cache_key = 'wpcom-dashboard-holdout-' . $user_id . '-' . Wpcom_Dashboard::EXPERIMENT_NAME;

		// Seed the transient with a truthy value.
		set_transient( $cache_key, 1, HOUR_IN_SECONDS );
		$this->assertTrue( Wpcom_Dashboard::is_holdout_treatment() );

		// Seed the transient with a falsy value.
		set_transient( $cache_key, 0, HOUR_IN_SECONDS );
		$this->assertFalse( Wpcom_Dashboard::is_holdout_treatment() );

		// Clean up.
		delete_transient( $cache_key );
	}
}
