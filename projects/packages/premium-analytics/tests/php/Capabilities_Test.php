<?php
/**
 * Tests for the dashboard capability layer.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\PremiumAnalytics\REST\Api_Proxy_Controller;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WP_REST_Request;

require_once __DIR__ . '/traits/trait-analytics-capabilities.php';
require_once __DIR__ . '/../../src/default-dashboard-sections.php';

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Capabilities
 */
#[CoversClass( Capabilities::class )]
class Capabilities_Test extends BaseTestCase {

	use Analytics_Capabilities_Trait;

	/**
	 * Hook the mapping under test, the way a WordPress-aware entry point would.
	 */
	public function set_up() {
		Capabilities::register();
	}

	/**
	 * Drop the mapping and this test's stand-in for the Stats one.
	 */
	public function tear_down() {
		$this->reset_analytics_capabilities();

		// Each test hydrates the section registry under its own users and sections.
		$instance = new \ReflectionProperty( Dashboard_Section_Registry::class, 'instance' );
		if ( PHP_VERSION_ID < 80100 ) {
			$instance->setAccessible( true );
		}
		$instance->setValue( null, null );
		if ( false === has_action( Dashboard_Section_Registry::REGISTER_ACTION, __NAMESPACE__ . '\\register_default_dashboard_sections' ) ) {
			add_action( Dashboard_Section_Registry::REGISTER_ACTION, __NAMESPACE__ . '\\register_default_dashboard_sections' );
		}
		wp_set_current_user( 0 );

		parent::tear_down();
	}

	/**
	 * Administrators reach the dashboard through manage_options, with no help from
	 * the Stats mapping — which is absent on platforms that never boot Stats.
	 */
	public function test_administrator_can_view_analytics_without_the_stats_mapping() {
		$this->login_as( 'administrator' );

		$this->assertTrue( Capabilities::current_user_can_view_analytics() );
	}

	/**
	 * The point of the issue: an editor the site granted view_stats keeps access.
	 */
	public function test_editor_granted_view_stats_can_view_analytics() {
		$user_id = $this->login_as( 'editor' );
		$this->grant_view_stats_to( $user_id );

		$this->assertTrue( Capabilities::current_user_can_view_analytics() );
	}

	/**
	 * An editor the site never granted view_stats gets nothing.
	 */
	public function test_plain_editor_cannot_view_analytics() {
		$this->login_as( 'editor' );

		$this->assertFalse( Capabilities::current_user_can_view_analytics() );
	}

	/**
	 * Logged out is not a reader.
	 */
	public function test_logged_out_user_cannot_view_analytics() {
		wp_set_current_user( 0 );

		$this->assertFalse( Capabilities::current_user_can_view_analytics() );
	}

	/**
	 * Capabilities other than ours pass through the mapping untouched.
	 */
	public function test_mapping_leaves_other_capabilities_alone() {
		$this->assertSame(
			array( 'edit_posts' ),
			Capabilities::map_meta_caps( array( 'edit_posts' ), 'edit_posts', 1 )
		);
	}

	/**
	 * The store reports are a separate grant: reaching the dashboard through
	 * view_stats says nothing about who may read WooCommerce's data.
	 */
	public function test_view_stats_reader_cannot_view_store_reports() {
		$user_id = $this->login_as( 'editor' );
		$this->grant_view_stats_to( $user_id );

		$this->assertTrue( Capabilities::current_user_can_view_analytics() );
		$this->assertFalse( Capabilities::current_user_can_view_store_reports() );
	}

	/**
	 * Administrators keep them.
	 */
	public function test_administrator_can_view_store_reports() {
		$this->login_as( 'administrator' );

		$this->assertTrue( Capabilities::current_user_can_view_store_reports() );
	}

	/**
	 * Pins the helper to the capability the proxy enforces for `analytics`, so the two can't
	 * drift apart and leave widgets that answer 403. Asserted through check_data_permission()
	 * rather than PREFIX_CONFIG, so what's compared is the decision each side actually reaches.
	 */
	public function test_store_report_helper_matches_the_proxy_capability() {
		$controller = new Api_Proxy_Controller();
		$request    = new WP_REST_Request( 'GET', '/jetpack-premium-analytics/v1/proxy/v2/analytics/reports/orders' );
		$request->set_param( 'endpoint', 'analytics/reports/orders' );

		$reader = $this->login_as( 'editor' );
		$this->grant_view_stats_to( $reader );

		$this->assertSame(
			$controller->check_data_permission( $request ),
			Capabilities::current_user_can_view_store_reports(),
			'A view_stats reader must be refused by the proxy and by the helper that hides its surfaces.'
		);

		$this->login_as( 'administrator' );

		$this->assertSame(
			$controller->check_data_permission( $request ),
			Capabilities::current_user_can_view_store_reports(),
			'An administrator must be admitted by both.'
		);

		// WooCommerce's own capability, held by shop managers (no manage_options). WorDBless
		// has no shop_manager role, so grant the capability the role would carry.
		$shop_manager = $this->login_as( 'subscriber' );
		$this->grant_capability_to( $shop_manager, 'view_woocommerce_reports' );

		$this->assertTrue( Capabilities::current_user_can_view_store_reports() );
		$this->assertSame(
			$controller->check_data_permission( $request ),
			Capabilities::current_user_can_view_store_reports(),
			'A WooCommerce report viewer must be admitted by both.'
		);
	}

	/**
	 * A stats reader cannot view ad reports.
	 */
	public function test_view_stats_reader_cannot_view_ad_reports() {
		$user_id = $this->login_as( 'editor' );
		$this->grant_view_stats_to( $user_id );

		$this->assertTrue( Capabilities::current_user_can_view_analytics() );
		$this->assertFalse( Capabilities::current_user_can_view_ad_reports() );
	}

	/**
	 * The ad reports helper matches the proxy permission check.
	 */
	public function test_ad_report_helper_matches_the_proxy_capability() {
		$controller = new Api_Proxy_Controller();
		$request    = new WP_REST_Request( 'GET', '/jetpack-premium-analytics/v1/proxy/v1.1/wordads/earnings' );
		$request->set_param( 'endpoint', 'wordads/earnings' );

		$reader = $this->login_as( 'editor' );
		$this->grant_view_stats_to( $reader );

		$this->assertSame(
			$controller->check_data_permission( $request ),
			Capabilities::current_user_can_view_ad_reports(),
			'A view_stats reader must be refused by the proxy and by the helper that hides its surfaces.'
		);

		$this->login_as( 'administrator' );

		$this->assertSame(
			$controller->check_data_permission( $request ),
			Capabilities::current_user_can_view_ad_reports(),
			'An administrator must be admitted by both.'
		);
	}

	/**
	 * The activate_wordads capability is not assigned to any role.
	 */
	public function test_activate_wordads_is_not_a_registered_capability() {
		foreach ( wp_roles()->roles as $slug => $role ) {
			$this->assertArrayNotHasKey(
				'activate_wordads',
				(array) $role['capabilities'],
				"Role $slug grants activate_wordads."
			);
		}

		$this->login_as( 'administrator' );

		// phpcs:ignore WordPress.WP.Capabilities.Unknown -- asserting the capability is unknown is the point.
		$this->assertFalse( current_user_can( 'activate_wordads' ) );
	}

	/**
	 * A reader with no Stats access reaches the dashboard through a section available to them,
	 * the way a shop manager does through the WooCommerce tab, and not without one.
	 */
	public function test_a_section_available_to_the_reader_opens_the_dashboard() {
		$shop_manager = $this->login_as( 'subscriber' );
		$this->grant_capability_to( $shop_manager, 'view_woocommerce_reports' );

		$this->assertFalse( Capabilities::current_user_can_view_analytics(), 'No built-in section is theirs.' );

		register_dashboard_section(
			DASHBOARD_NAME,
			'test/store',
			array(
				'label'        => 'Store',
				'is_available' => array( Capabilities::class, 'current_user_can_view_store_reports' ),
			)
		);

		$this->assertTrue( Capabilities::current_user_can_view_analytics() );
	}

	/**
	 * A section gated on the dashboard capability itself does not count towards it, rather than
	 * recursing.
	 */
	public function test_a_section_gated_on_the_dashboard_capability_does_not_recurse() {
		remove_action( Dashboard_Section_Registry::REGISTER_ACTION, __NAMESPACE__ . '\\register_default_dashboard_sections' );
		register_dashboard_section(
			DASHBOARD_NAME,
			'test/circular',
			array(
				'label'        => 'Circular',
				'is_available' => array( Capabilities::class, 'current_user_can_view_analytics' ),
			)
		);
		$this->login_as( 'administrator' );

		$this->assertFalse( Capabilities::current_user_can_view_analytics() );
	}

	/**
	 * An older copy of the package may register a Stats section whose callback checks no
	 * capability; it must still not open the dashboard to a reader without Stats access.
	 */
	public function test_a_stats_section_callback_cannot_open_the_dashboard_without_stats_access() {
		remove_action( Dashboard_Section_Registry::REGISTER_ACTION, __NAMESPACE__ . '\\register_default_dashboard_sections' );
		register_dashboard_section(
			DASHBOARD_NAME,
			'analytics/subscribers',
			array(
				'label'        => 'Subscribers',
				'is_available' => '__return_true',
			)
		);
		$this->login_as( 'subscriber' );

		$this->assertFalse( Capabilities::current_user_can_view_analytics() );
	}

	/**
	 * Sections answer for the current user, so the mapping refuses to answer for anyone else.
	 */
	public function test_mapping_refuses_users_other_than_the_current_one() {
		$other_admin = wp_insert_user(
			array(
				'user_login' => 'pa-other-administrator',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		$this->login_as( 'administrator' );

		$this->assertTrue( Capabilities::current_user_can_view_analytics() );
		$this->assertFalse( user_can( $other_admin, Capabilities::VIEW_ANALYTICS ) );
	}

	/**
	 * Pins the Stats helper to what the proxy enforces for a Stats prefix, for the same reason
	 * as the store helper above.
	 */
	public function test_stats_helper_matches_the_proxy_capability() {
		$controller = new Api_Proxy_Controller();
		$request    = new WP_REST_Request( 'GET', '/jetpack-premium-analytics/v1/proxy/v1.1/stats/top-posts' );
		$request->set_param( 'endpoint', 'stats/top-posts' );

		$reader = $this->login_as( 'editor' );
		$this->grant_view_stats_to( $reader );
		$this->assertTrue( Capabilities::current_user_can_view_stats() );
		$this->assertSame( $controller->check_data_permission( $request ), Capabilities::current_user_can_view_stats() );

		$shop_manager = $this->login_as( 'subscriber' );
		$this->grant_capability_to( $shop_manager, 'view_woocommerce_reports' );
		$this->assertFalse( Capabilities::current_user_can_view_stats() );
		$this->assertSame( $controller->check_data_permission( $request ), Capabilities::current_user_can_view_stats() );

		$this->login_as( 'administrator' );
		$this->assertTrue( Capabilities::current_user_can_view_stats() );
		$this->assertSame( $controller->check_data_permission( $request ), Capabilities::current_user_can_view_stats() );
	}
}
