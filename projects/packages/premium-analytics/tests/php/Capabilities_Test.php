<?php
/**
 * Tests for the dashboard capability layer.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\PremiumAnalytics\REST\Api_Proxy_Controller;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
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
		remove_all_filters( WOOCOMMERCE_DASHBOARD_SECTION_AVAILABLE_FILTER );
		remove_all_filters( 'jetpack_feature_flag_enabled_' . DASHBOARD_STORE_SECTION_FLAG );
		delete_option( Enablement_Setting::ENABLED_OPTION );
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
	 * A shop manager reaches the dashboard only where the site shows the store tab, since that
	 * is all they can read there.
	 *
	 * @dataProvider provide_store_section_states
	 *
	 * @param bool $has_woocommerce Whether WooCommerce is active.
	 * @param bool $site_opted_in   Whether the site's own option switched the dashboard on.
	 * @param bool $expected        Whether the shop manager may view the dashboard.
	 */
	#[DataProvider( 'provide_store_section_states' )]
	public function test_woocommerce_report_viewer_reads_the_dashboard_only_where_the_store_tab_shows( $has_woocommerce, $site_opted_in, $expected ) {
		add_filter( WOOCOMMERCE_DASHBOARD_SECTION_AVAILABLE_FILTER, $has_woocommerce ? '__return_true' : '__return_false' );
		update_option( Enablement_Setting::ENABLED_OPTION, $site_opted_in ? 1 : 0 );
		$shop_manager = $this->login_as( 'subscriber' );
		$this->grant_capability_to( $shop_manager, 'view_woocommerce_reports' );

		$this->assertSame( $expected, Capabilities::current_user_can_view_analytics() );
		$this->assertFalse( Capabilities::current_user_can_view_stats() );
	}

	/**
	 * Store tab states, by what decides them.
	 *
	 * @return array<string, array{bool, bool, bool}>
	 */
	public static function provide_store_section_states() {
		return array(
			'store tab shown'             => array( true, false, true ),
			'no WooCommerce'              => array( false, false, false ),
			'site opt-in, store flag off' => array( true, true, false ),
		);
	}

	/**
	 * The mapping answers for the user asked about, not whoever is logged in.
	 */
	public function test_mapping_checks_the_given_user() {
		$editor = $this->login_as( 'editor' );
		$this->login_as( 'administrator' );

		$this->assertFalse( user_can( $editor, Capabilities::VIEW_ANALYTICS ) );
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
