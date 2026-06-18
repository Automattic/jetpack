<?php
/**
 * Test class for admin bar changes.
 *
 * @package automattic/jetpack-mu-wpcom
 */

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
	 * In wp-admin, a Dashboard link should be added as the first child of the
	 * site-name menu and point to wp-admin.
	 */
	public function test_dashboard_link_added_first_in_wp_admin() {
		set_current_screen( 'dashboard' ); // is_admin() === true.

		// Simulate core's site menu, added at priority 30 (after our priority-29 node).
		$core_site_menu = static function ( $bar ) {
			$bar->add_node(
				array(
					'id'    => 'site-name',
					'title' => 'My Site',
				)
			);
			$bar->add_node(
				array(
					'parent' => 'site-name',
					'id'     => 'view-site',
					'title'  => 'Visit Site',
					'href'   => 'https://example.org',
				)
			);
		};
		add_action( 'admin_bar_menu', $core_site_menu, 30 );

		$admin_bar = new \WP_Admin_Bar();
		do_action( 'admin_bar_menu', $admin_bar );

		remove_action( 'admin_bar_menu', $core_site_menu, 30 );
		set_current_screen( 'front' );

		$dashboard = $admin_bar->get_node( 'wpcom-dashboard' );
		$this->assertNotNull( $dashboard, 'A Dashboard node should be added in wp-admin.' );
		$this->assertSame( 'site-name', $dashboard->parent );
		$this->assertSame( admin_url(), $dashboard->href );

		$children = array_keys( self::get_all_admin_bar_nodes( $admin_bar, 'site-name' ) );
		$this->assertSame( 'wpcom-dashboard', $children[0] ?? null, 'The Dashboard link should be first.' );
	}

	/**
	 * On the front end core already provides a Dashboard link, so we must not add
	 * a duplicate.
	 */
	public function test_dashboard_link_not_added_on_front_end() {
		set_current_screen( 'front' ); // is_admin() === false.

		$admin_bar = new \WP_Admin_Bar();
		$admin_bar->add_node(
			array(
				'id'    => 'site-name',
				'title' => 'My Site',
			)
		);
		do_action( 'admin_bar_menu', $admin_bar );

		$this->assertNull( $admin_bar->get_node( 'wpcom-dashboard' ), 'No Dashboard node should be added on the front end.' );
	}
}
