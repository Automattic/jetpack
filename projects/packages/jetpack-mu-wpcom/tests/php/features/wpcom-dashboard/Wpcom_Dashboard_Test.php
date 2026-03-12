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
	 * Test that is_holdout_treatment returns false when no user is logged in.
	 */
	public function test_is_holdout_treatment_returns_false_for_logged_out_user() {
		wp_set_current_user( 0 );
		$this->assertFalse( Wpcom_Dashboard::is_holdout_treatment() );
	}

	/**
	 * Test that is_holdout_treatment respects an earlier filter that already set it to true.
	 */
	public function test_is_holdout_treatment_respects_earlier_filter_override() {
		// Register a filter at a lower priority than init()'s default (10)
		// so it runs first and sets the value to true.
		add_filter( 'wpcom_dashboard_replacement_holdout_is_treatment', '__return_true', 5 );

		// When invoked through the filter chain, is_holdout_treatment receives
		// $is_treatment = true from the earlier filter and should return true
		// immediately (guard clause), even without a logged-in user.
		wp_set_current_user( 0 );
		$result = apply_filters( 'wpcom_dashboard_replacement_holdout_is_treatment', false );
		$this->assertTrue( $result );
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

	/**
	 * Test that is_holdout_treatment caches false for a logged-in user
	 * who is neither on Simple nor Jetpack-connected (fallthrough path).
	 */
	public function test_is_holdout_treatment_caches_false_for_unconnected_user() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'test_user_' . wp_rand(),
				'user_pass'  => 'password',
				'user_email' => 'test_' . wp_rand() . '@example.com',
			)
		);
		wp_set_current_user( $user_id );

		$cache_key = 'wpcom-dashboard-holdout-' . $user_id . '-' . Wpcom_Dashboard::EXPERIMENT_NAME;

		// Ensure no cached value exists.
		delete_transient( $cache_key );

		// In the test environment the user is neither on Simple nor connected,
		// so the method should return false and cache the result.
		$this->assertFalse( Wpcom_Dashboard::is_holdout_treatment() );
		$this->assertSame( '0', (string) get_transient( $cache_key ) );

		// Clean up.
		delete_transient( $cache_key );
	}

	/**
	 * Test that render_admin_notice produces no output when the feature is inactive.
	 */
	public function test_render_admin_notice_not_shown_when_inactive() {
		ob_start();
		Wpcom_Dashboard::render_admin_notice();
		$output = ob_get_clean();

		$this->assertEmpty( $output );
	}
}
