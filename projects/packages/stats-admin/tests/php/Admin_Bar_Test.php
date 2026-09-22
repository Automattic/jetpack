<?php
/**
 * Tests for the Stats admin bar items.
 *
 * @package automattic/jetpack-stats-admin
 */

namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Stats\Options as Stats_Options;
use Automattic\Jetpack\Stats_Admin\TestCase as Stats_TestCase;
use Automattic\Jetpack\Status\Cache as Status_Cache;
use WP_Admin_Bar;

require_once ABSPATH . WPINC . '/class-wp-admin-bar.php';

/**
 * Unit tests for the Admin_Bar class.
 */
class Admin_Bar_Test extends Stats_TestCase {
	/**
	 * Log in as the administrator.
	 */
	public function setUp(): void {
		parent::setUp();
		wp_set_current_user( $this->admin_id );
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		global $wp_admin_bar;
		$wp_admin_bar = null;

		remove_filter( 'user_has_cap', array( $this, 'grant_view_stats' ) );
		remove_filter( 'show_admin_bar', '__return_true' );
		remove_all_actions( 'admin_bar_menu' );
		remove_all_filters( 'pre_http_request' );
		unset( $_GET['page'], $_GET['chart'], $_GET['noheader'], $_GET['proxy'], $_GET['height'] );
		$GLOBALS['current_screen'] = null;
		Constants::clear_constants();
		Status_Cache::clear();
		parent::tearDown();
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

	public function test_site_menu_link_added_for_user_who_can_view_stats() {
		add_filter( 'user_has_cap', array( $this, 'grant_view_stats' ) );
		$admin_bar = $this->make_admin_bar_with_dashboard();

		Admin_Bar::add_site_menu_link();

		$node = $admin_bar->get_node( 'jetpack-stats' );
		$this->assertNotNull( $node );
		$this->assertSame( 'site-name', $node->parent );
		$this->assertSame( admin_url( 'admin.php?page=stats' ), $node->href );
	}

	public function test_site_menu_link_hidden_from_user_who_cannot_view_stats() {
		$admin_bar = $this->make_admin_bar_with_dashboard();

		Admin_Bar::add_site_menu_link();

		$this->assertNull( $admin_bar->get_node( 'jetpack-stats' ) );
	}

	public function test_site_menu_link_hidden_when_dashboard_node_is_absent() {
		add_filter( 'user_has_cap', array( $this, 'grant_view_stats' ) );
		$admin_bar = $this->make_admin_bar();

		Admin_Bar::add_site_menu_link();

		$this->assertNull( $admin_bar->get_node( 'jetpack-stats' ) );
	}

	public function test_site_menu_link_hidden_on_wpcom_platform() {
		add_filter( 'user_has_cap', array( $this, 'grant_view_stats' ) );
		Constants::set_constant( 'IS_WPCOM', true );
		$admin_bar = $this->make_admin_bar_with_dashboard();

		Admin_Bar::add_site_menu_link();

		$this->assertNull( $admin_bar->get_node( 'jetpack-stats' ) );
	}

	public function test_chart_added_for_user_who_can_view_stats() {
		add_filter( 'user_has_cap', array( $this, 'grant_view_stats' ) );

		$this->assertNotNull( $this->render_chart_node() );
	}

	public function test_chart_hidden_when_admin_bar_setting_is_off() {
		add_filter( 'user_has_cap', array( $this, 'grant_view_stats' ) );
		Stats_Options::set_option( 'admin_bar', false );

		$this->assertNull( $this->render_chart_node() );
	}

	public function test_chart_hidden_from_user_who_cannot_view_stats() {
		$this->assertNull( $this->render_chart_node() );
	}

	public function test_chart_request_carries_what_wpcom_needs_to_accept_the_blog_token() {
		$requested_url = '';
		add_filter(
			'pre_http_request',
			function ( $response, $args, $url ) use ( &$requested_url ) {
				$requested_url = $url;
				return array(
					'response' => array( 'code' => 200 ),
					'headers'  => array( 'content-type' => 'image/png' ),
					'body'     => 'png-bytes',
				);
			},
			10,
			3
		);

		$image = Admin_Bar::fetch_chart( 'admin-bar-hours-scale' );

		$this->assertSame( 'https://dashboard.wordpress.com/wp-includes/charts/admin-bar-hours-scale.php', strtok( $requested_url, '?' ) );
		wp_parse_str( (string) wp_parse_url( $requested_url, PHP_URL_QUERY ), $query );
		$this->assertSame( 'stats', $query['page'] );
		$this->assertArrayHasKey( 'proxy', $query );
		$this->assertSame( '999', $query['blog'] );
		$this->assertSame(
			array(
				'type' => 'image/png',
				'body' => 'png-bytes',
			),
			$image
		);
	}

	public function test_chart_response_that_is_not_an_image_is_dropped() {
		add_filter(
			'pre_http_request',
			function () {
				return array(
					'response' => array( 'code' => 200 ),
					'headers'  => array( 'content-type' => 'text/html' ),
					'body'     => '<p>We were unable to get your stats just now.</p>',
				);
			}
		);

		$this->assertNull( Admin_Bar::fetch_chart( 'admin-bar-hours-scale' ) );
	}

	public function test_chart_request_that_fails_is_dropped_instead_of_fatal() {
		add_filter(
			'pre_http_request',
			function () {
				return new \WP_Error( 'http_request_failed', 'Operation timed out' );
			}
		);

		$this->assertNull( Admin_Bar::fetch_chart( 'admin-bar-hours-scale' ) );
	}

	public function test_chart_not_fetched_when_admin_bar_setting_is_off() {
		add_filter( 'user_has_cap', array( $this, 'grant_view_stats' ) );
		Stats_Options::set_option( 'admin_bar', false );
		$_GET['page']  = 'stats';
		$_GET['chart'] = 'admin-bar-hours-scale';

		$this->assertFalse( $this->serve_chart_and_report_fetch() );
	}

	public function test_unknown_chart_is_not_fetched() {
		add_filter( 'user_has_cap', array( $this, 'grant_view_stats' ) );
		$_GET['page']  = 'stats';
		$_GET['chart'] = 'visits';

		$this->assertFalse( $this->serve_chart_and_report_fetch() );
	}

	public function test_legacy_proxy_chart_request_is_left_to_the_jetpack_handler() {
		add_filter( 'user_has_cap', array( $this, 'grant_view_stats' ) );
		$_GET['page']     = 'stats';
		$_GET['chart']    = 'admin-bar-hours-scale';
		$_GET['noheader'] = '';
		$_GET['proxy']    = '';
		$_GET['height']   = '48';

		$this->assertFalse( $this->serve_chart_and_report_fetch() );
	}

	public function test_chart_not_fetched_for_user_who_cannot_view_stats() {
		$_GET['page']  = 'stats';
		$_GET['chart'] = 'admin-bar-hours-scale';

		$this->assertFalse( $this->serve_chart_and_report_fetch() );
	}

	public function test_chart_request_skips_the_pending_database_upgrade() {
		global $wp_db_version;
		set_current_screen( 'dashboard' );
		$_GET['page']  = 'stats';
		$_GET['chart'] = 'admin-bar-hours-scale-2x';

		$this->assertSame( $wp_db_version, Admin_Bar::ignore_db_version( 1 ) );

		$_GET['chart'] = 'visits';
		$this->assertSame( 1, Admin_Bar::ignore_db_version( 1 ) );
	}

	/**
	 * Run `maybe_serve_chart()` and report whether it asked WordPress.com for the chart.
	 *
	 * A fetch throws, because a served chart ends the request with `exit`.
	 *
	 * @return bool
	 */
	private function serve_chart_and_report_fetch() {
		add_filter(
			'pre_http_request',
			/** @return never */
			function () {
				throw new \RuntimeException( 'The chart was fetched.' );
			}
		);

		try {
			Admin_Bar::maybe_serve_chart();
		} catch ( \RuntimeException $e ) {
			return true;
		}

		return false;
	}

	/**
	 * Run the head hook, then build the admin bar, and return the chart node.
	 *
	 * @return object|null
	 */
	private function render_chart_node() {
		add_filter( 'show_admin_bar', '__return_true' );
		$admin_bar = $this->make_admin_bar();

		ob_start();
		Admin_Bar::maybe_add_chart();
		ob_end_clean();
		do_action( 'admin_bar_menu', $admin_bar );

		return $admin_bar->get_node( 'stats' );
	}

	/**
	 * Build the global admin bar with core's site-name node.
	 *
	 * @return WP_Admin_Bar
	 */
	private function make_admin_bar() {
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
	 * Build the global admin bar with core's site-name and Dashboard nodes.
	 *
	 * @return WP_Admin_Bar
	 */
	private function make_admin_bar_with_dashboard() {
		$admin_bar = $this->make_admin_bar();
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
}
