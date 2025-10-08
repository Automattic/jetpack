<?php
/**
 * Test class for admin bar changes.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-admin-bar/wpcom-admin-bar.php';
require_once ABSPATH . 'wp-includes/class-wp-admin-bar.php';

const WPCOM_ADMIN_BAR_TEST_OPT_IN  = 1;
const WPCOM_ADMIN_BAR_TEST_OPT_OUT = 2;
const WPCOM_ADMIN_BAR_TEST_UNSET   = 3;

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

			return $admin_bar;
	}

	/**
	 * Mock the user's hosting dashboard opt-in preference.
	 *
	 * @param int $value One of the WPCOM_ADMIN_BAR_TEST_* constants to define the test scenario.
	 */
	private static function mock_hosting_dashboard_opt_in_preference( int $value ) {
		// See tests/lib/functions-wordpress.php for the get_user_attribute mock.
		global $test_user_attributes;
		$test_user_attributes = array();

		// Set up preferences based on test scenario
		if ( $value === WPCOM_ADMIN_BAR_TEST_OPT_IN ) {
			$test_user_attributes = array(
				'calypso_preferences' => array(
					'hosting-dashboard-opt-in' => array(
						'value' => 'opt-in',
					),
				),
			);
		} elseif ( $value === WPCOM_ADMIN_BAR_TEST_OPT_OUT ) {
			$test_user_attributes = array(
				'calypso_preferences' => array(
					'hosting-dashboard-opt-in' => array(
						'value' => 'opt-out',
					),
				),
			);
		}
	}

	public function test_wp_logo_replaced_by_wpcom_logo() {
		self::mock_hosting_dashboard_opt_in_preference( WPCOM_ADMIN_BAR_TEST_UNSET );

		$admin_bar = self::make_test_admin_bar();
		wpcom_replace_wp_logo_with_wpcom_logo_menu( $admin_bar );

		$this->assertNull( $admin_bar->get_node( 'wp-logo' ) );
		$this->assertNotNull( $admin_bar->get_node( 'wpcom-logo' ) );
	}

	public function test_hosting_dashboard_opt_out_menu_links() {
		self::mock_hosting_dashboard_opt_in_preference( WPCOM_ADMIN_BAR_TEST_OPT_OUT );

		$admin_bar = self::make_test_admin_bar();
		wpcom_replace_wp_logo_with_wpcom_logo_menu( $admin_bar );

		$wpcom_logo_node = $admin_bar->get_node( 'wpcom-logo' );
		$this->assertStringContainsString( 'https://wordpress.com/sites', $wpcom_logo_node->href );

		$sites_node = $admin_bar->get_node( 'wpcom-sites' );
		$this->assertNotNull( $sites_node );
		$this->assertStringContainsString( 'https://wordpress.com/sites', $sites_node->href );
		$this->assertEquals( 'wpcom-logo', $sites_node->parent );

		$domains_node = $admin_bar->get_node( 'wpcom-domains' );
		$this->assertNotNull( $domains_node );
		$this->assertStringContainsString( 'https://wordpress.com/domains', $domains_node->href );
		$this->assertEquals( 'wpcom-logo', $domains_node->parent );
	}

	public function test_hosting_dashboard_preference_unset_menu_links() {
		self::mock_hosting_dashboard_opt_in_preference( WPCOM_ADMIN_BAR_TEST_UNSET );

		$admin_bar = self::make_test_admin_bar();
		wpcom_replace_wp_logo_with_wpcom_logo_menu( $admin_bar );

		$wpcom_logo_node = $admin_bar->get_node( 'wpcom-logo' );
		$this->assertStringContainsString( 'https://wordpress.com/sites', $wpcom_logo_node->href );

		$sites_node = $admin_bar->get_node( 'wpcom-sites' );
		$this->assertNotNull( $sites_node );
		$this->assertStringContainsString( 'https://wordpress.com/sites', $sites_node->href );
		$this->assertEquals( 'wpcom-logo', $sites_node->parent );

		$domains_node = $admin_bar->get_node( 'wpcom-domains' );
		$this->assertNotNull( $domains_node );
		$this->assertStringContainsString( 'https://wordpress.com/domains', $domains_node->href );
		$this->assertEquals( 'wpcom-logo', $domains_node->parent );
	}

	public function test_hosting_dashboard_opt_in_menu_links() {
		self::mock_hosting_dashboard_opt_in_preference( WPCOM_ADMIN_BAR_TEST_OPT_IN );

		$admin_bar = self::make_test_admin_bar();
		wpcom_replace_wp_logo_with_wpcom_logo_menu( $admin_bar );

		$wpcom_logo_node = $admin_bar->get_node( 'wpcom-logo' );
		$this->assertStringContainsString( 'https://wordpress.com/v2/sites', $wpcom_logo_node->href );

		$sites_node = $admin_bar->get_node( 'wpcom-sites' );
		$this->assertNotNull( $sites_node );
		$this->assertStringContainsString( 'https://wordpress.com/v2/sites', $sites_node->href );
		$this->assertEquals( 'wpcom-logo', $sites_node->parent );

		$domains_node = $admin_bar->get_node( 'wpcom-domains' );
		$this->assertNotNull( $domains_node );
		$this->assertStringContainsString( 'https://wordpress.com/v2/domains', $domains_node->href );
		$this->assertEquals( 'wpcom-logo', $domains_node->parent );
	}
}
