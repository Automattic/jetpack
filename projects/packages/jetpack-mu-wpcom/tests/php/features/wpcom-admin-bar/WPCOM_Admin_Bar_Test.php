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

	public function test_wp_logo_replaced_by_wpcom_logo() {
		$admin_bar = self::make_test_admin_bar();

		$this->assertNull( $admin_bar->get_node( 'wp-logo' ) );
		$this->assertNotNull( $admin_bar->get_node( 'wpcom-logo' ) );
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
}
