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
use PHPUnit\Framework\Attributes\DataProvider;
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
		remove_all_actions( 'admin_bar_init' );
		wp_styles()->add_data( 'admin-bar', 'after', array() );
		remove_all_actions( 'wp_before_admin_bar_render' );
		remove_all_actions( 'admin_init' );
		remove_all_actions( 'admin_post_jetpack_stats_admin_bar_chart' );
		remove_filter( 'pre_option_db_version', array( Admin_Bar::class, 'ignore_db_version' ) );
		remove_all_filters( 'pre_http_request' );
		remove_all_filters( 'wp_die_handler' );
		remove_all_filters( 'jetpack_stats_url' );
		remove_all_filters( 'jetpack_stats_admin_bar_seven_day_chart' );
		wp_deregister_script( Admin_Bar::SCRIPT_HANDLE );
		wp_deregister_style( Admin_Bar::SCRIPT_HANDLE );
		delete_option( 'timezone_string' );
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
		$this->assertSame( 'Stats', $node->title );
		$this->assertSame( admin_url( 'admin.php?page=stats' ), $node->href );
	}

	public function test_site_menu_link_follows_the_stats_url_filter() {
		add_filter( 'user_has_cap', array( $this, 'grant_view_stats' ) );
		$this->point_dashboard_view_at_new_stats();
		$admin_bar = $this->make_admin_bar_with_dashboard();

		Admin_Bar::add_site_menu_link();

		$this->assertSame( 'https://example.org/new-stats', $admin_bar->get_node( 'jetpack-stats' )->href );
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

	public function test_chart_link_follows_the_stats_url_filter() {
		add_filter( 'user_has_cap', array( $this, 'grant_view_stats' ) );
		$this->point_dashboard_view_at_new_stats();

		$node = $this->render_chart_node();

		$this->assertSame( 'https://example.org/new-stats', $node->href );
		$this->assertStringContainsString( 'action=jetpack_stats_admin_bar_chart', $node->title, 'The chart image does not follow the Stats link.' );
	}

	public function test_chart_gives_a_text_label_to_clients_that_cannot_show_its_image() {
		add_filter( 'user_has_cap', array( $this, 'grant_view_stats' ) );

		$this->assertSame( 'Stats', $this->render_chart_node()->meta['menu_title'] );
	}

	public function test_seven_day_chart_replaces_the_image_and_keeps_the_text_label() {
		add_filter( 'user_has_cap', array( $this, 'grant_view_stats' ) );
		add_filter( 'jetpack_stats_admin_bar_seven_day_chart', '__return_true' );

		$node = $this->render_chart_node();

		$this->assertStringNotContainsString( '<img', $node->title );
		$this->assertStringContainsString( 'id="jetpack-stats-admin-bar-panel"', $node->meta['html'] );
		$this->assertSame( 'Stats', $node->meta['menu_title'] );
	}

	public function test_seven_day_panel_links_to_the_last_seven_days_in_the_site_timezone() {
		add_filter( 'user_has_cap', array( $this, 'grant_view_stats' ) );
		add_filter( 'jetpack_stats_admin_bar_seven_day_chart', '__return_true' );
		// UTC+14, so the site's today differs from UTC's for most of the day.
		update_option( 'timezone_string', 'Pacific/Kiritimati' );
		$traffic = null;
		add_filter(
			'jetpack_stats_url',
			function ( $url, $args ) use ( &$traffic ) {
				if ( 'traffic' !== $args['view'] ) {
					return $url;
				}
				$traffic = array( $url, $args );
				return 'https://example.org/new-traffic';
			},
			10,
			2
		);

		$node = $this->render_chart_node();

		$today = new \DateTimeImmutable( 'now', new \DateTimeZone( 'Pacific/Kiritimati' ) );
		$start = $today->modify( '-6 days' )->format( 'Y-m-d' );
		$end   = $today->format( 'Y-m-d' );
		$this->assertNotNull( $traffic, 'The traffic link does not go through the jetpack_stats_url filter.' );
		$this->assertStringEndsWith( "#!/stats/day/999?chartStart=$start&chartEnd=$end", $traffic[0] );
		$this->assertSame(
			array(
				'view'  => 'traffic',
				'start' => $start,
				'end'   => $end,
			),
			$traffic[1]
		);
		$this->assertStringContainsString( 'href="https://example.org/new-traffic"', $node->meta['html'] );
	}

	public function test_seven_day_chart_enqueues_its_script_with_the_visits_endpoint_instead_of_the_image_styles() {
		add_filter( 'user_has_cap', array( $this, 'grant_view_stats' ) );
		add_filter( 'jetpack_stats_admin_bar_seven_day_chart', '__return_true' );

		$styles = $this->admin_bar_inline_styles();

		$this->assertStringNotContainsString( '#wp-admin-bar-stats', $styles );
		$this->assertTrue( wp_script_is( Admin_Bar::SCRIPT_HANDLE, 'enqueued' ) );
		$inline = implode( '', (array) wp_scripts()->get_data( Admin_Bar::SCRIPT_HANDLE, 'before' ) );
		$this->assertMatchesRegularExpression( '/^window\.jetpackStatsAdminBar = (\{.*\});$/', $inline );
		$config = (array) json_decode( substr( $inline, strlen( 'window.jetpackStatsAdminBar = ' ), -1 ), true );
		$this->assertSame( wp_create_nonce( 'wp_rest' ), $config['nonce'] );
		$this->assertSame(
			rest_url( 'jetpack/v4/stats-app/sites/999/stats/visits' ),
			urldecode( remove_query_arg( array( 'unit', 'quantity', 'stat_fields' ), $config['restUrl'] ) )
		);
		wp_parse_str( (string) wp_parse_url( $config['restUrl'], PHP_URL_QUERY ), $query );
		$this->assertSame( 'day', $query['unit'] );
		$this->assertSame( '7', $query['quantity'] );
		$this->assertSame( 'views,visitors', $query['stat_fields'] );
	}

	public function test_chart_hidden_when_admin_bar_setting_is_off() {
		add_filter( 'user_has_cap', array( $this, 'grant_view_stats' ) );
		Stats_Options::set_option( 'admin_bar', false );

		$this->assertNull( $this->render_chart_node() );
	}

	public function test_chart_hidden_from_user_who_cannot_view_stats() {
		$this->assertNull( $this->render_chart_node() );
	}

	public function test_chart_styles_added_to_admin_bar_stylesheet_for_user_who_can_view_stats() {
		add_filter( 'user_has_cap', array( $this, 'grant_view_stats' ) );

		$this->assertStringContainsString( '#wp-admin-bar-stats', $this->admin_bar_inline_styles() );
	}

	public function test_chart_styles_not_added_for_user_who_cannot_view_stats() {
		$this->assertStringNotContainsString( '#wp-admin-bar-stats', $this->admin_bar_inline_styles() );
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

	public function test_chart_fetched_for_user_who_can_view_stats() {
		add_filter( 'user_has_cap', array( $this, 'grant_view_stats' ) );
		$_GET['page']  = 'stats';
		$_GET['chart'] = 'admin-bar-hours-scale';

		$this->assertTrue( $this->serve_chart_and_report_fetch() );
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

	public function test_chart_on_another_admin_page_is_not_fetched() {
		add_filter( 'user_has_cap', array( $this, 'grant_view_stats' ) );
		$_GET['page']  = 'jetpack';
		$_GET['chart'] = 'admin-bar-hours-scale';

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

	public function test_chart_src_points_at_the_admin_post_action() {
		$src = Admin_Bar::get_chart_src( 'admin-bar-hours-scale' );

		$this->assertStringEndsWith( '/wp-admin/admin-post.php', (string) wp_parse_url( $src, PHP_URL_PATH ) );
		wp_parse_str( (string) wp_parse_url( $src, PHP_URL_QUERY ), $query );
		$this->assertSame(
			array(
				'action' => 'jetpack_stats_admin_bar_chart',
				'chart'  => 'admin-bar-hours-scale',
			),
			$query
		);
	}

	/**
	 * @dataProvider admin_post_chart_request_provider
	 *
	 * @param bool        $can_view  Whether the user can view Stats.
	 * @param bool        $admin_bar The Stats `admin_bar` setting.
	 * @param string|null $chart     The requested chart, or null for none.
	 * @param string      $expected  `fetched`, or `die:<status>`.
	 */
	#[DataProvider( 'admin_post_chart_request_provider' )]
	public function test_admin_post_chart_request( $can_view, $admin_bar, $chart, $expected ) {
		if ( $can_view ) {
			add_filter( 'user_has_cap', array( $this, 'grant_view_stats' ) );
		}
		Stats_Options::set_option( 'admin_bar', $admin_bar );
		if ( null !== $chart ) {
			$_GET['chart'] = $chart;
		}

		$this->assertSame( $expected, $this->serve_admin_post_chart_and_report() );
	}

	/**
	 * Requests to the admin-post chart action, and how each one ends.
	 *
	 * @return array
	 */
	public static function admin_post_chart_request_provider() {
		return array(
			'1x chart'               => array( true, true, 'admin-bar-hours-scale', 'fetched' ),
			'2x chart'               => array( true, true, 'admin-bar-hours-scale-2x', 'fetched' ),
			'user cannot view Stats' => array( false, true, 'admin-bar-hours-scale', 'die:403' ),
			'admin bar setting off'  => array( true, false, 'admin-bar-hours-scale', 'die:403' ),
			'unknown chart'          => array( true, true, 'visits', 'die:400' ),
			'no chart'               => array( true, true, null, 'die:400' ),
		);
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
	 * Fire the admin-post chart action and report how it ended: `fetched`, `die:<status>`, or `returned`.
	 *
	 * @return string
	 */
	private function serve_admin_post_chart_and_report() {
		add_filter(
			'pre_http_request',
			/** @return never */
			function () {
				throw new \RuntimeException( 'fetched' );
			}
		);
		add_filter(
			'wp_die_handler',
			function () {
				/** @return never */
				return function ( $message, $title, $args ) {
					list( , , $parsed ) = _wp_die_process_input( $message, $title, $args );
					throw new \RuntimeException( 'die:' . $parsed['response'] );
				};
			}
		);

		Admin_Bar::init();
		try {
			do_action( 'admin_post_jetpack_stats_admin_bar_chart' );
		} catch ( \RuntimeException $e ) {
			return $e->getMessage();
		}

		return 'returned';
	}

	/**
	 * Hook `jetpack_stats_url` the way a newer dashboard would, for the dashboard view only.
	 *
	 * @return void
	 */
	private function point_dashboard_view_at_new_stats() {
		add_filter(
			'jetpack_stats_url',
			function ( $url, $args ) {
				return 'dashboard' === $args['view'] ? 'https://example.org/new-stats' : $url;
			},
			10,
			2
		);
	}

	/**
	 * Initialise the admin bar and return the inline styles attached to its stylesheet.
	 *
	 * @return string
	 */
	private function admin_bar_inline_styles() {
		Admin_Bar::init();
		do_action( 'admin_bar_init' );

		return implode( "\n", (array) wp_styles()->get_data( 'admin-bar', 'after' ) );
	}

	/**
	 * Build the admin bar without a page head, as the admin-bar REST endpoint does, and return the chart node.
	 *
	 * @return object|null
	 */
	private function render_chart_node() {
		$admin_bar = $this->make_admin_bar();

		Admin_Bar::init();
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
