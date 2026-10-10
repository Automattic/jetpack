<?php
/**
 * Tests for the Stats widget on the WordPress dashboard.
 *
 * @package automattic/jetpack-stats-admin
 */

namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Stats_Admin\TestCase as Stats_TestCase;

require_once ABSPATH . 'wp-admin/includes/admin.php';
require_once ABSPATH . 'wp-admin/includes/dashboard.php';

/**
 * Unit tests for the WP_Dashboard_Odyssey_Widget class.
 */
class WP_Dashboard_Odyssey_Widget_Test extends Stats_TestCase {
	/**
	 * Open the dashboard with the Stats module active.
	 */
	public function setUp(): void {
		parent::setUp();
		global $wp_meta_boxes;
		$wp_meta_boxes = array();
		set_current_screen( 'dashboard' );
		add_filter( 'jetpack_active_modules', array( $this, 'activate_stats' ) );
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		remove_filter( 'jetpack_active_modules', array( $this, 'activate_stats' ) );
		remove_filter( 'user_has_cap', array( $this, 'grant_view_stats' ) );
		wp_dequeue_script( 'jetpack_stats_widget' );
		wp_deregister_script( 'jetpack_stats_widget' );
		$GLOBALS['current_screen'] = null;
		parent::tearDown();
	}

	/**
	 * Report the Stats module as active.
	 *
	 * @param array $modules Active module slugs.
	 * @return array
	 */
	public function activate_stats( $modules ) {
		$modules[] = 'stats';
		return $modules;
	}

	/**
	 * Grants view_stats to whoever the test logged in as.
	 *
	 * @param array $caps The current user's capabilities.
	 * @return array
	 */
	public function grant_view_stats( $caps ) {
		$caps['view_stats'] = true;
		return $caps;
	}

	public function test_widget_added_for_user_who_can_view_stats() {
		wp_set_current_user( $this->editor_id );
		add_filter( 'user_has_cap', array( $this, 'grant_view_stats' ) );

		$this->assertTrue( WP_Dashboard_Odyssey_Widget::register_widget() );
		$this->assertTrue( $this->widget_is_on_dashboard() );
	}

	public function test_widget_hidden_from_user_who_cannot_view_stats() {
		wp_set_current_user( $this->editor_id );

		$this->assertFalse( WP_Dashboard_Odyssey_Widget::register_widget() );
		$this->assertFalse( $this->widget_is_on_dashboard() );
	}

	public function test_widget_hidden_when_stats_module_is_off() {
		wp_set_current_user( $this->admin_id );
		remove_filter( 'jetpack_active_modules', array( $this, 'activate_stats' ) );

		$this->assertFalse( WP_Dashboard_Odyssey_Widget::register_widget() );
		$this->assertFalse( $this->widget_is_on_dashboard() );
	}

	public function test_widget_hidden_on_disconnected_site() {
		wp_set_current_user( $this->admin_id );
		$this->disconnect_site();

		$this->assertFalse( WP_Dashboard_Odyssey_Widget::register_widget() );
		$this->assertFalse( $this->widget_is_on_dashboard() );
	}

	/**
	 * Whether the Stats widget is queued on the dashboard.
	 *
	 * @return bool
	 */
	private function widget_is_on_dashboard() {
		global $wp_meta_boxes;

		return isset( $wp_meta_boxes['dashboard']['normal']['core'][ WP_Dashboard_Odyssey_Widget::DASHBOARD_WIDGET_ID ] );
	}
}
