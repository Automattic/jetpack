<?php
/**
 * Tests for Jetpack Stats admin bar links.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Cache as Status_Cache;

require_once JETPACK__PLUGIN_DIR . 'modules/stats.php';
require_once ABSPATH . WPINC . '/class-wp-admin-bar.php';

/**
 * Test class for Jetpack Stats admin bar links.
 */
class Stats_Admin_Bar_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Set up the test environment.
	 */
	public function set_up() {
		parent::set_up();

		$user_id = self::factory()->user->create(
			array(
				'role' => 'administrator',
			)
		);
		wp_set_current_user( $user_id );

		add_action( 'wp_before_admin_bar_render', 'stats_add_link_to_admin_bar_site_menu' );
	}

	/**
	 * Tear down the test environment.
	 */
	public function tear_down() {
		self::reset_admin_bar_global();
		remove_action( 'wp_before_admin_bar_render', 'stats_add_link_to_admin_bar_site_menu' );
		remove_filter( 'user_has_cap', array( $this, 'grant_view_stats' ) );
		remove_role( 'jetpack_no_stats' );
		Constants::clear_constants();
		Status_Cache::clear();
		wp_set_current_user( 0 );

		parent::tear_down();
	}

	/**
	 * Forces current_user_can( 'view_stats' ) to true for the test.
	 *
	 * @param array $allcaps All capabilities of the user.
	 * @return array
	 */
	public function grant_view_stats( $allcaps ) {
		$allcaps['view_stats'] = true;
		return $allcaps;
	}

	/**
	 * Tests that the Stats link is added when the user can view Stats.
	 */
	public function test_stats_link_shown_when_user_can_view_stats() {
		add_filter( 'user_has_cap', array( $this, 'grant_view_stats' ) );
		$admin_bar = self::make_test_admin_bar_with_dashboard();

		do_action( 'wp_before_admin_bar_render' );

		$stats_node = $admin_bar->get_node( 'jetpack-stats' );

		$this->assertNotNull( $stats_node );
		$this->assertSame( 'site-name', $stats_node->parent );
		$this->assertSame( 'Stats', $stats_node->title );
		$this->assertSame( admin_url( 'admin.php?page=stats' ), $stats_node->href );
	}

	/**
	 * Tests that the Stats link is hidden when the user cannot view Stats.
	 */
	public function test_stats_link_hidden_when_user_cannot_view_stats() {
		add_role( 'jetpack_no_stats', 'No Stats', array( 'read' => true ) );
		$user_id = self::factory()->user->create(
			array(
				'role' => 'jetpack_no_stats',
			)
		);
		wp_set_current_user( $user_id );

		$admin_bar = self::make_test_admin_bar_with_dashboard();

		do_action( 'wp_before_admin_bar_render' );

		$stats_node = $admin_bar->get_node( 'jetpack-stats' );

		$this->assertFalse( current_user_can( 'view_stats' ) );
		$this->assertNull( $stats_node );
	}

	/**
	 * Tests that the Stats link is hidden when core's Dashboard node is absent.
	 */
	public function test_stats_link_hidden_when_dashboard_node_absent() {
		add_filter( 'user_has_cap', array( $this, 'grant_view_stats' ) );
		$admin_bar = self::make_test_admin_bar();

		do_action( 'wp_before_admin_bar_render' );

		$stats_node = $admin_bar->get_node( 'jetpack-stats' );

		$this->assertNull( $stats_node );
	}

	/**
	 * Tests that the Stats link is hidden on WordPress.com platform sites.
	 */
	public function test_stats_link_hidden_on_wpcom_platform() {
		add_filter( 'user_has_cap', array( $this, 'grant_view_stats' ) );
		Constants::set_constant( 'IS_WPCOM', true );
		$admin_bar = self::make_test_admin_bar_with_dashboard();

		do_action( 'wp_before_admin_bar_render' );

		$stats_node = $admin_bar->get_node( 'jetpack-stats' );

		$this->assertNull( $stats_node );
	}

	/**
	 * Builds a test admin bar with the core site-name node.
	 *
	 * @return WP_Admin_Bar
	 */
	private static function make_test_admin_bar() {
		global $wp_admin_bar;

		$wp_admin_bar = new WP_Admin_Bar();
		$wp_admin_bar->add_node(
			array(
				'id'    => 'site-name',
				'title' => 'Test Site',
				'href'  => admin_url(),
			)
		);

		return $wp_admin_bar;
	}

	/**
	 * Builds a test admin bar with core's site-name and dashboard nodes.
	 *
	 * @return WP_Admin_Bar
	 */
	private static function make_test_admin_bar_with_dashboard() {
		$admin_bar = self::make_test_admin_bar();
		$admin_bar->add_node(
			array(
				'parent' => 'site-name',
				'id'     => 'dashboard',
				'title'  => 'Dashboard',
				'href'   => admin_url(),
			)
		);

		return $admin_bar;
	}

	/**
	 * Resets the global admin bar object.
	 */
	private static function reset_admin_bar_global() {
		global $wp_admin_bar;

		$wp_admin_bar = null;
	}
}
