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
		remove_all_filters( 'wpcom_dashboard_override_is_treatment' );
		remove_all_filters( 'screen_layout_columns' );
		remove_all_filters( 'get_user_option_screen_layout_dashboard' );
		remove_all_filters( 'get_user_option_meta-box-order_dashboard' );
		Wpcom_Dashboard::init();
	}

	/**
	 * Tear down test fixtures.
	 */
	public function tear_down() {
		remove_all_filters( 'wpcom_dashboard_override_is_treatment' );
		remove_all_filters( 'screen_layout_columns' );
		remove_all_filters( 'get_user_option_screen_layout_dashboard' );
		remove_all_filters( 'get_user_option_meta-box-order_dashboard' );
		parent::tear_down();
	}

	// -------------------------------------------------------------------------
	// is_treatment()
	// -------------------------------------------------------------------------

	/**
	 * Test that is_treatment returns false by default.
	 */
	public function test_is_treatment_returns_false_by_default() {
		wp_set_current_user( 0 );
		$this->assertFalse( Wpcom_Dashboard::is_treatment() );
	}

	/**
	 * Test that is_treatment returns true when the override filter returns true.
	 */
	public function test_is_treatment_returns_true_when_override_filter_is_true() {
		add_filter( 'wpcom_dashboard_override_is_treatment', '__return_true' );
		$this->assertTrue( Wpcom_Dashboard::is_treatment() );
	}

	/**
	 * Test that is_treatment returns false when the override filter returns false.
	 */
	public function test_is_treatment_returns_false_when_override_filter_is_false() {
		add_filter( 'wpcom_dashboard_override_is_treatment', '__return_false' );
		$this->assertFalse( Wpcom_Dashboard::is_treatment() );
	}

	/**
	 * Test that is_treatment returns false for logged-out users when no override is set.
	 */
	public function test_is_treatment_returns_false_for_logged_out_user() {
		wp_set_current_user( 0 );
		$this->assertFalse( Wpcom_Dashboard::is_treatment() );
	}

	/**
	 * Test that is_treatment returns the cached transient value.
	 */
	public function test_is_treatment_returns_cached_value() {
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
		$this->assertTrue( Wpcom_Dashboard::is_treatment() );

		// Seed the transient with a falsy value.
		set_transient( $cache_key, 0, HOUR_IN_SECONDS );
		$this->assertFalse( Wpcom_Dashboard::is_treatment() );

		delete_transient( $cache_key );
	}

	/**
	 * Test that is_treatment caches false for a logged-in user
	 * who is neither on Simple nor Jetpack-connected.
	 */
	public function test_is_treatment_caches_false_for_unconnected_user() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'test_user_' . wp_rand(),
				'user_pass'  => 'password',
				'user_email' => 'test_' . wp_rand() . '@example.com',
			)
		);
		wp_set_current_user( $user_id );

		$cache_key = 'wpcom-dashboard-holdout-' . $user_id . '-' . Wpcom_Dashboard::EXPERIMENT_NAME;
		delete_transient( $cache_key );

		$this->assertFalse( Wpcom_Dashboard::is_treatment() );
		$this->assertSame( '0', (string) get_transient( $cache_key ) );

		delete_transient( $cache_key );
	}

	/**
	 * Test that the override filter bypasses the cache entirely.
	 */
	public function test_is_treatment_override_bypasses_cache() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'test_user_' . wp_rand(),
				'user_pass'  => 'password',
				'user_email' => 'test_' . wp_rand() . '@example.com',
			)
		);
		wp_set_current_user( $user_id );

		$cache_key = 'wpcom-dashboard-holdout-' . $user_id . '-' . Wpcom_Dashboard::EXPERIMENT_NAME;
		set_transient( $cache_key, 0, HOUR_IN_SECONDS );

		add_filter( 'wpcom_dashboard_override_is_treatment', '__return_true' );
		$this->assertTrue( Wpcom_Dashboard::is_treatment() );

		delete_transient( $cache_key );
	}

	// -------------------------------------------------------------------------
	// limit_dashboard_columns()
	// -------------------------------------------------------------------------

	/**
	 * Test that limit_dashboard_columns sets dashboard to 2 when treatment is active.
	 */
	public function test_limit_dashboard_columns_sets_two_when_treatment() {
		add_filter( 'wpcom_dashboard_override_is_treatment', '__return_true' );

		$columns = Wpcom_Dashboard::limit_dashboard_columns( array( 'dashboard' => 4 ) );
		$this->assertSame( 2, $columns['dashboard'] );
	}

	/**
	 * Test that limit_dashboard_columns preserves existing value when not treatment.
	 */
	public function test_limit_dashboard_columns_unchanged_when_not_treatment() {
		add_filter( 'wpcom_dashboard_override_is_treatment', '__return_false' );

		$columns = Wpcom_Dashboard::limit_dashboard_columns( array( 'dashboard' => 4 ) );
		$this->assertSame( 4, $columns['dashboard'] );
	}

	// -------------------------------------------------------------------------
	// cap_dashboard_column_preference()
	// -------------------------------------------------------------------------

	/**
	 * Test that cap_dashboard_column_preference caps values above 2 when treatment.
	 */
	public function test_cap_dashboard_column_preference_caps_above_two() {
		add_filter( 'wpcom_dashboard_override_is_treatment', '__return_true' );

		$this->assertSame( 2, Wpcom_Dashboard::cap_dashboard_column_preference( 4 ) );
		$this->assertSame( 2, Wpcom_Dashboard::cap_dashboard_column_preference( 3 ) );
	}

	/**
	 * Test that cap_dashboard_column_preference preserves values of 2 or below.
	 */
	public function test_cap_dashboard_column_preference_preserves_two_or_below() {
		add_filter( 'wpcom_dashboard_override_is_treatment', '__return_true' );

		$this->assertSame( 2, Wpcom_Dashboard::cap_dashboard_column_preference( 2 ) );
		$this->assertSame( 1, Wpcom_Dashboard::cap_dashboard_column_preference( 1 ) );
	}

	/**
	 * Test that cap_dashboard_column_preference passes through false (no saved preference).
	 */
	public function test_cap_dashboard_column_preference_passes_through_false() {
		add_filter( 'wpcom_dashboard_override_is_treatment', '__return_true' );

		$this->assertFalse( Wpcom_Dashboard::cap_dashboard_column_preference( false ) );
	}

	/**
	 * Test that cap_dashboard_column_preference is a no-op when not treatment.
	 */
	public function test_cap_dashboard_column_preference_unchanged_when_not_treatment() {
		add_filter( 'wpcom_dashboard_override_is_treatment', '__return_false' );

		$this->assertSame( 4, Wpcom_Dashboard::cap_dashboard_column_preference( 4 ) );
	}

	// -------------------------------------------------------------------------
	// redistribute_meta_box_order()
	// -------------------------------------------------------------------------

	/**
	 * Test that redistribute_meta_box_order moves column3 widgets to normal.
	 */
	public function test_redistribute_moves_column3_to_normal() {
		add_filter( 'wpcom_dashboard_override_is_treatment', '__return_true' );

		$order  = array(
			'normal'  => 'widget_a,widget_b',
			'side'    => 'widget_c',
			'column3' => 'widget_d',
			'column4' => '',
		);
		$result = Wpcom_Dashboard::redistribute_meta_box_order( $order );

		$this->assertSame( 'widget_a,widget_b,widget_d', $result['normal'] );
		$this->assertSame( '', $result['column3'] );
	}

	/**
	 * Test that redistribute_meta_box_order moves column4 widgets to side.
	 */
	public function test_redistribute_moves_column4_to_side() {
		add_filter( 'wpcom_dashboard_override_is_treatment', '__return_true' );

		$order  = array(
			'normal'  => 'widget_a',
			'side'    => 'widget_b',
			'column3' => '',
			'column4' => 'widget_e',
		);
		$result = Wpcom_Dashboard::redistribute_meta_box_order( $order );

		$this->assertSame( 'widget_b,widget_e', $result['side'] );
		$this->assertSame( '', $result['column4'] );
	}

	/**
	 * Test that redistribute_meta_box_order handles empty normal/side targets.
	 */
	public function test_redistribute_handles_empty_targets() {
		add_filter( 'wpcom_dashboard_override_is_treatment', '__return_true' );

		$order  = array(
			'normal'  => '',
			'side'    => '',
			'column3' => 'widget_a',
			'column4' => 'widget_b',
		);
		$result = Wpcom_Dashboard::redistribute_meta_box_order( $order );

		$this->assertSame( 'widget_a', $result['normal'] );
		$this->assertSame( 'widget_b', $result['side'] );
	}

	/**
	 * Test that redistribute_meta_box_order is a no-op when not treatment.
	 */
	public function test_redistribute_unchanged_when_not_treatment() {
		add_filter( 'wpcom_dashboard_override_is_treatment', '__return_false' );

		$order  = array(
			'normal'  => 'widget_a',
			'side'    => 'widget_b',
			'column3' => 'widget_c',
			'column4' => 'widget_d',
		);
		$result = Wpcom_Dashboard::redistribute_meta_box_order( $order );

		$this->assertSame( $order, $result );
	}

	/**
	 * Test that redistribute_meta_box_order passes through false.
	 */
	public function test_redistribute_passes_through_false() {
		add_filter( 'wpcom_dashboard_override_is_treatment', '__return_true' );

		$this->assertFalse( Wpcom_Dashboard::redistribute_meta_box_order( false ) );
	}
}
