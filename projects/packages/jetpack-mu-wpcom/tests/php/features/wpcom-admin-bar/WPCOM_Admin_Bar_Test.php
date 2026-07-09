<?php
/**
 * Test class for admin bar changes.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-admin-bar/wpcom-admin-bar.php';
require_once ABSPATH . 'wp-includes/class-wp-admin-bar.php';

/**
 * Class WPCOM_Admin_Bar_Test
 */
class WPCOM_Admin_Bar_Test extends \WorDBless\BaseTestCase {
	private static function make_test_admin_bar() {
			$admin_bar = new \WP_Admin_Bar();

			$admin_bar->add_node(
				array(
					'id'    => 'wp-logo',
					'title' => 'WordPress Logo',
					'href'  => 'https://wordpress.org/',
				)
			);
			$admin_bar->add_node(
				array(
					'id'     => 'about',
					'parent' => 'wp-logo',
					'title'  => 'About WordPress',
					'href'   => 'https://wordpress.org/about/',
				)
			);
			$admin_bar->add_node(
				array(
					'id'     => 'contribute',
					'parent' => 'wp-logo',
					'title'  => 'Get Involved',
					'href'   => 'https://wordpress.org/contribute/',
				)
			);
			$admin_bar->add_group(
				array(
					'id'    => 'top-secondary',
					'title' => '',
				)
			);
			$admin_bar->add_node(
				array(
					'id'     => 'my-account',
					'title'  => 'Account',
					'href'   => 'https://example.com/wp-admin/profile.php',
					'parent' => 'top-secondary',
				)
			);

			do_action( 'admin_bar_menu', $admin_bar );

			return $admin_bar;
	}

	private static function get_all_admin_bar_nodes( WP_Admin_Bar $bar, $parent = null ) {
		$result = array();

		foreach ( $bar->get_nodes() as $id => $node ) {
			if ( ( $parent === null && $node->parent === false ) || ( $node->parent === $parent ) ) {
				$result[ $id ] = $node;

				// recurse into children
				$children = self::get_all_admin_bar_nodes( $bar, $id );
				$result   = array_merge( $result, $children );
			}
		}

		return $result;
	}

	public function test_origin_admin_bar_param_in_menu_links() {
		$admin_bar = self::make_test_admin_bar();

		$all_nodes = $admin_bar->get_nodes();

		$links_with_origin_param = array(
			'https://wordpress.com/sites',
			'https://wordpress.com/domains/manage',
			'https://wordpress.com/me',
			'https://wordpress.com/me/account',
		);

		foreach ( $all_nodes as $node ) {
			$should_have_param = false;
			foreach ( $links_with_origin_param as $link ) {
				if ( str_starts_with( $node->href, $link ) ) {
					$should_have_param = true;
					break;
				}
			}

			if ( $should_have_param ) {
				$this->assertStringContainsString( 'origin_admin_bar=wpcom', $node->href );
			} else {
				$this->assertStringNotContainsString( 'origin_admin_bar=wpcom', $node->href );
			}
		}
	}

	/**
	 * The plan badge must always render a clickable anchor, including on Atomic
	 * sites where \WPCOM_Masterbar is absent and the slug falls back to the site
	 * suffix. It must never render the old non-clickable <div>.
	 */
	public function test_plan_badge_is_a_clickable_link() {
		// Drive a known plan name through Current_Plan::get() and reset its
		// per-request static cache so the option below is actually read.
		update_option( Current_Plan::PLAN_OPTION, array( 'product_name_short' => 'Business' ) );
		self::reset_active_plan_cache();

		$admin_bar = self::make_test_admin_bar();
		$badge     = $admin_bar->get_node( 'site-plan-badge' );

		$this->assertNotNull( $badge, 'The site-plan-badge node should exist when a plan name is set.' );
		$this->assertStringContainsString( '<a class="wp-admin-bar__site-info"', $badge->title );
		$this->assertStringContainsString( 'href="https://wordpress.com/plans/', $badge->title );
		$this->assertStringContainsString( 'Business', $badge->title );
		$this->assertStringNotContainsString( '<div class="wp-admin-bar__site-info"', $badge->title );

		delete_option( Current_Plan::PLAN_OPTION );
		self::reset_active_plan_cache();
	}

	/**
	 * Reset Current_Plan's per-request static cache so option writes in tests
	 * are actually read back by Current_Plan::get().
	 */
	private static function reset_active_plan_cache(): void {
		$property = ( new \ReflectionClass( Current_Plan::class ) )->getProperty( 'active_plan_cache' );
		// @todo Remove once we drop PHP < 8.1 support.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, null );
	}

	/**
	 * Builds an admin bar with a 'site-name' node and, optionally, a child of it
	 * (e.g. 'dashboard' as core adds on the front end, or 'view-site' as core
	 * adds in wp-admin), then fires `admin_bar_menu`, the hook our Stats node
	 * listens on.
	 *
	 * @param string|null $site_name_child Child node id to add under 'site-name', or null for none.
	 */
	private static function make_test_admin_bar_with_site_name( $site_name_child = null ) {
		$admin_bar = new \WP_Admin_Bar();
		$admin_bar->add_node(
			array(
				'id'    => 'site-name',
				'title' => 'Test Site',
			)
		);

		if ( $site_name_child !== null ) {
			$admin_bar->add_node(
				array(
					'id'     => $site_name_child,
					'parent' => 'site-name',
					'title'  => ucfirst( $site_name_child ),
					'href'   => 'https://example.com/wp-admin/',
				)
			);
		}

		do_action( 'admin_bar_menu', $admin_bar );

		return $admin_bar;
	}

	/**
	 * Forces `current_user_can( 'view_stats' )` to true for the test's duration.
	 *
	 * @param array $allcaps All capabilities of the user.
	 * @return array
	 */
	public function grant_view_stats( $allcaps ) {
		$allcaps['view_stats'] = true;
		return $allcaps;
	}

	/**
	 * Forces `current_user_can( 'view_stats' )` to false for the test's duration.
	 *
	 * @param array $allcaps All capabilities of the user.
	 * @return array
	 */
	public function deny_view_stats( $allcaps ) {
		$allcaps['view_stats'] = false;
		return $allcaps;
	}

	public function test_stats_link_shown_when_dashboard_node_present() {
		add_filter( 'user_has_cap', array( $this, 'grant_view_stats' ) );
		$admin_bar = self::make_test_admin_bar_with_site_name( 'dashboard' );
		remove_filter( 'user_has_cap', array( $this, 'grant_view_stats' ) );

		$stats_node = $admin_bar->get_node( 'wpcom-stats' );

		$this->assertNotNull( $stats_node );
		$this->assertSame( 'site-name', $stats_node->parent );
		$this->assertSame( 'Stats', $stats_node->title );
		$this->assertSame( admin_url( 'admin.php?page=stats' ), $stats_node->href );
	}

	/**
	 * Core adds 'view-site' instead of 'dashboard' under 'site-name' in wp-admin
	 * (is_admin() === true). The Stats link must show there too.
	 */
	public function test_stats_link_shown_when_view_site_node_present() {
		add_filter( 'user_has_cap', array( $this, 'grant_view_stats' ) );
		$admin_bar = self::make_test_admin_bar_with_site_name( 'view-site' );
		remove_filter( 'user_has_cap', array( $this, 'grant_view_stats' ) );

		$stats_node = $admin_bar->get_node( 'wpcom-stats' );

		$this->assertNotNull( $stats_node );
		$this->assertSame( 'site-name', $stats_node->parent );
		$this->assertSame( 'Stats', $stats_node->title );
		$this->assertSame( admin_url( 'admin.php?page=stats' ), $stats_node->href );
	}

	public function test_stats_link_hidden_when_user_cannot_view_stats() {
		add_filter( 'user_has_cap', array( $this, 'deny_view_stats' ) );
		$admin_bar = self::make_test_admin_bar_with_site_name( 'dashboard' );
		remove_filter( 'user_has_cap', array( $this, 'deny_view_stats' ) );

		$stats_node = $admin_bar->get_node( 'wpcom-stats' );

		$this->assertNull( $stats_node );
	}

	public function test_stats_link_hidden_when_dashboard_and_view_site_nodes_absent() {
		add_filter( 'user_has_cap', array( $this, 'grant_view_stats' ) );
		$admin_bar = self::make_test_admin_bar_with_site_name();
		remove_filter( 'user_has_cap', array( $this, 'grant_view_stats' ) );

		$stats_node = $admin_bar->get_node( 'wpcom-stats' );

		$this->assertNull( $stats_node );
	}
}
