<?php
/**
 * Tests for the Stats links this dashboard claims.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

require_once ABSPATH . 'wp-admin/includes/plugin.php';
require_once __DIR__ . '/traits/trait-analytics-capabilities.php';

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Stats_Links
 */
#[CoversClass( Stats_Links::class )]
class Stats_Links_Test extends BaseTestCase {

	use Analytics_Capabilities_Trait;

	const LEGACY_URL = 'https://example.org/wp-admin/admin.php?page=stats#!/stats/post/123/9';

	/**
	 * Spelled out rather than built with Analytics::dashboard_url(), so a change
	 * to how that method encodes the route fails here instead of moving both
	 * sides of the assertion together. WorDBless pins the site URL.
	 */
	const DASHBOARD_URL = 'http://example.org/wp-admin/admin.php?page=jetpack-premium-analytics-wp-admin&p=%2F';
	const DETAIL_URL    = 'http://example.org/wp-admin/admin.php?page=jetpack-premium-analytics-wp-admin&p=%2Fpost%2F123';

	/**
	 * Hook the capability mapping, the way an entry point would, on a connected site.
	 */
	public function set_up() {
		Capabilities::register();
		$this->connect_site();
	}

	/**
	 * Drop the mapping, the filters, and the logged-in user.
	 */
	public function tear_down() {
		remove_all_filters( 'jetpack_stats_url' );
		remove_all_actions( 'admin_page_access_denied' );
		remove_all_filters( 'wp_redirect' );
		unset( $_GET['page'], $_GET[ Stats_Links::ROUTE_QUERY_ARG ], $GLOBALS['_parent_pages']['stats'] );
		\Jetpack_Options::delete_option( array( 'id', 'blog_token' ) );
		( new \Automattic\Jetpack\Connection\Manager() )->reset_connection_status();
		$this->reset_analytics_capabilities();
		wp_set_current_user( 0 );

		parent::tear_down();
	}

	public function test_register_hooks_the_stats_links() {
		// Without this the test passes on a filter something else left hooked, and
		// would keep passing if register() became a no-op.
		$this->assertFalse(
			has_filter( 'jetpack_stats_url', array( Stats_Links::class, 'filter_url' ) ),
			'The filter was already hooked, so register() proves nothing here.'
		);

		Stats_Links::register();

		$this->assertSame( 10, has_filter( 'jetpack_stats_url', array( Stats_Links::class, 'filter_url' ) ) );
		$this->assertSame( 10, has_action( 'admin_page_access_denied', array( Stats_Links::class, 'open_retired_stats_page' ) ) );
	}

	public function test_dashboard_view_points_at_the_dashboard() {
		$this->login_as( 'administrator' );

		$this->assertSame( self::DASHBOARD_URL, Stats_Links::filter_url( self::LEGACY_URL, array( 'view' => 'dashboard' ) ) );
	}

	/**
	 * @param array  $args The link's `section` and `range`.
	 * @param string $p    The dashboard route it opens, as encoded in `p`.
	 * @dataProvider provide_dashboard_links
	 */
	#[\PHPUnit\Framework\Attributes\DataProvider( 'provide_dashboard_links' )]
	public function test_dashboard_view_opens_the_section_and_days_the_link_names( $args, $p ) {
		$this->login_as( 'administrator' );

		$this->assertSame(
			'http://example.org/wp-admin/admin.php?page=jetpack-premium-analytics-wp-admin&p=' . $p,
			Stats_Links::filter_url( self::LEGACY_URL, array( 'view' => 'dashboard' ) + $args )
		);
	}

	/**
	 * Data for test_dashboard_view_opens_the_section_and_days_the_link_names.
	 *
	 * @return array
	 */
	public static function provide_dashboard_links() {
		// The site runs on UTC, so a day's ends carry a zero offset.
		$august = '%2F%3Fsection%3Dtraffic%26from%3D2026-08-01T00%253A00%253A00.000%252B00%253A00%26to%3D2026-08-07T23%253A59%253A59.999%252B00%253A00';

		return array(
			'section only'             => array( array( 'section' => 'traffic' ), '%2F%3Fsection%3Dtraffic' ),
			'days in the past'         => array(
				array(
					'section' => 'traffic',
					'range'   => array(
						'from' => '2026-08-01',
						'to'   => '2026-08-07',
					),
				),
				$august,
			),
			'days ending before start' => array(
				array(
					'section' => 'traffic',
					'range'   => array(
						'from' => '2026-08-07',
						'to'   => '2026-08-01',
					),
				),
				'%2F%3Fsection%3Dtraffic',
			),
			'days that are not days'   => array(
				array(
					'range' => array(
						'from' => 'yesterday',
						'to'   => 'today',
					),
				),
				'%2F',
			),
		);
	}

	public function test_dashboard_view_names_the_days_ending_today_as_their_preset() {
		$this->login_as( 'administrator' );
		$today = new \DateTimeImmutable( 'now', wp_timezone() );

		$this->assertSame(
			self::DASHBOARD_URL . '%3Fsection%3Dtraffic%26preset%3Dlast-7-days',
			Stats_Links::filter_url(
				self::LEGACY_URL,
				array(
					'view'    => 'dashboard',
					'section' => 'traffic',
					'range'   => array(
						'from' => $today->modify( '-6 days' )->format( 'Y-m-d' ),
						'to'   => $today->format( 'Y-m-d' ),
					),
				)
			)
		);
	}

	public function test_post_view_points_at_the_post_detail_page() {
		$this->login_as( 'administrator' );

		$this->assertSame(
			self::DETAIL_URL,
			Stats_Links::filter_url(
				self::LEGACY_URL,
				array(
					'view' => 'post',
					'id'   => 123,
				)
			)
		);
	}

	public function test_post_view_without_a_post_id_keeps_the_stats_url() {
		$this->login_as( 'administrator' );

		$this->assertSame( self::LEGACY_URL, Stats_Links::filter_url( self::LEGACY_URL, array( 'view' => 'post' ) ) );
	}

	/**
	 * A Stats page the dashboard has no counterpart for stays where it was.
	 */
	public function test_unknown_view_keeps_the_stats_url() {
		$this->login_as( 'administrator' );

		$this->assertSame(
			self::LEGACY_URL,
			Stats_Links::filter_url(
				self::LEGACY_URL,
				array(
					'view' => 'settings',
					'id'   => 123,
				)
			)
		);
	}

	public function test_user_who_cannot_view_the_dashboard_keeps_the_stats_url() {
		$this->login_as( 'editor' );

		$this->assertSame( self::LEGACY_URL, Stats_Links::filter_url( self::LEGACY_URL, array( 'view' => 'dashboard' ) ) );
	}

	/**
	 * A site can grant Stats access to a non-administrator, and the dashboard honours that grant, so the link has to follow it too.
	 */
	public function test_view_stats_reader_is_sent_to_the_dashboard() {
		$user_id = $this->login_as( 'editor' );
		$this->grant_view_stats_to( $user_id );

		$this->assertSame( self::DASHBOARD_URL, Stats_Links::filter_url( self::LEGACY_URL, array( 'view' => 'dashboard' ) ) );
	}

	/**
	 * Core fires the action for every denied admin page, so anything but the retired Stats page passes through.
	 *
	 * @param string $page       The requested `page`.
	 * @param bool   $registered Whether a plugin registers `page=stats`.
	 * @param string $role       The current user's role.
	 * @dataProvider provide_requests_left_alone
	 */
	#[\PHPUnit\Framework\Attributes\DataProvider( 'provide_requests_left_alone' )]
	public function test_other_denied_pages_are_left_alone( $page, $registered, $role ) {
		$this->login_as( $role );
		$_GET['page'] = $page;
		if ( $registered ) {
			$GLOBALS['_parent_pages']['stats'] = false;
		}

		$this->assertNull( $this->redirect_from_retired_stats_page( '#!/stats/day/123' ) );
	}

	/**
	 * Data for test_other_denied_pages_are_left_alone.
	 *
	 * @return array
	 */
	public static function provide_requests_left_alone() {
		return array(
			'page still registered'      => array( 'stats', true, 'administrator' ),
			'another missing page'       => array( 'stats-other', false, 'administrator' ),
			'user who cannot read Stats' => array( 'stats', false, 'editor' ),
		);
	}

	public function test_retired_stats_page_opens_the_dashboard_despite_simples_index_stats_page() {
		add_filter( 'jetpack_feature_flag_enabled_' . Classic_Stats::RETIRED_FLAG, '__return_true' );
		$this->login_as( 'administrator' );
		$_GET['page']                      = 'stats';
		$GLOBALS['_parent_pages']['stats'] = 'index.php';

		try {
			$this->assertSame(
				'http://example.org/wp-admin/admin.php?page=jetpack-premium-analytics-wp-admin&p=%2F%3Fsection%3Dtraffic',
				$this->redirect_from_retired_stats_page( '#!/stats/day/123' )
			);
		} finally {
			remove_all_filters( 'jetpack_feature_flag_enabled_' . Classic_Stats::RETIRED_FLAG );
		}
	}

	/**
	 * The fragment never reaches the server, so the page hands it back under the query arg the redirect reads.
	 */
	public function test_retired_stats_page_hands_the_route_back() {
		$render = new \ReflectionMethod( Stats_Links::class, 'render_retired_stats_page' );
		if ( PHP_VERSION_ID < 80100 ) {
			$render->setAccessible( true );
		}

		ob_start();
		$render->invoke( null );
		$html = ob_get_clean();

		$this->assertStringContainsString( '"&' . Stats_Links::ROUTE_QUERY_ARG . '=" + encodeURIComponent( window.location.hash )', $html );
		$this->assertStringContainsString( 'content="0;url=' . esc_url( self::DASHBOARD_URL ) . '"', $html );
	}

	/**
	 * @param string $route The old `#!/stats/…` route.
	 * @param string $p     The dashboard route it opens, as encoded in `p`.
	 * @dataProvider provide_legacy_routes
	 */
	#[\PHPUnit\Framework\Attributes\DataProvider( 'provide_legacy_routes' )]
	public function test_retired_stats_page_opens_the_matching_route( $route, $p ) {
		$this->login_as( 'administrator' );
		$_GET['page'] = 'stats';

		$this->assertSame(
			'http://example.org/wp-admin/admin.php?page=jetpack-premium-analytics-wp-admin&p=' . $p,
			$this->redirect_from_retired_stats_page( $route )
		);
	}

	/**
	 * Data for test_retired_stats_page_opens_the_matching_route.
	 *
	 * @return array
	 */
	public static function provide_legacy_routes() {
		return array(
			'no route'             => array( '', '%2F' ),
			'traffic period'       => array( '#!/stats/day/123', '%2F%3Fsection%3Dtraffic' ),
			'insights'             => array( '#!/stats/insights/example.org', '%2F%3Fsection%3Dinsights' ),
			'subscribers'          => array( '#!/stats/subscribers/example.org', '%2F%3Fsection%3Dsubscribers' ),
			'store'                => array( '#!/stats/store/orders/day/example.org', '%2F%3Fsection%3Dwoocommerce' ),
			'ads'                  => array( '#!/stats/ads/day/example.org', '%2F%3Fsection%3Dads' ),
			'settings'             => array( '#!/stats/settings', '%2Fsettings' ),
			'post'                 => array( '#!/stats/post/29/123', '%2Fpost%2F29' ),
			'post without an ID'   => array( '#!/stats/post/0/123', '%2F' ),
			'email opens'          => array( '#!/stats/email/opens/day/29/123', '%2Fpost%2F29%3Fsection%3Demail-opens' ),
			'email clicks'         => array( '#!/stats/email/clicks/day/29/123', '%2Fpost%2F29%3Fsection%3Demail-clicks' ),
			'no dashboard page'    => array( '#!/stats/purchase/123?from=x', '%2F' ),
			'not a Stats fragment' => array( '#/insights', '%2F' ),
		);
	}

	/**
	 * Where open_retired_stats_page() sends the old route, or null when it lets the request through.
	 *
	 * @param string $route The old `#!/stats/…` route.
	 * @return string|null
	 */
	private function redirect_from_retired_stats_page( $route ) {
		$_GET[ Stats_Links::ROUTE_QUERY_ARG ] = $route;
		// Stop at the redirect, before open_retired_stats_page() exits.
		add_filter(
			'wp_redirect',
			/** @return never */
			static function ( $location ) {
				throw new \RuntimeException( $location );
			}
		);

		try {
			Stats_Links::open_retired_stats_page();
		} catch ( \RuntimeException $redirect ) {
			return $redirect->getMessage();
		}

		return null;
	}
}
