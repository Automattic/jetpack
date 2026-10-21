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
	 * Hook the capability mapping, the way an entry point would.
	 */
	public function set_up() {
		Capabilities::register();
	}

	/**
	 * Drop the mapping, the filters, and the logged-in user.
	 */
	public function tear_down() {
		remove_all_filters( 'jetpack_stats_url' );
		remove_all_actions( 'admin_page_access_denied' );
		unset( $_GET['page'], $GLOBALS['_parent_pages']['stats'] );
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
	 * Only a request for the classic Stats page, with no plugin registering it, by a Stats reader is sent on.
	 *
	 * @param string $page       The requested `page`.
	 * @param bool   $registered Whether a plugin registers `page=stats`.
	 * @param string $role       The current user's role.
	 * @param bool   $expected   Whether the request is sent to the dashboard.
	 * @dataProvider provide_retired_stats_page_requests
	 */
	#[\PHPUnit\Framework\Attributes\DataProvider( 'provide_retired_stats_page_requests' )]
	public function test_retired_stats_page_request( $page, $registered, $role, $expected ) {
		$this->login_as( $role );
		$_GET['page'] = $page;
		if ( $registered ) {
			$GLOBALS['_parent_pages']['stats'] = false;
		}

		$this->assertSame( $expected, Stats_Links::is_retired_stats_page_request() );
	}

	/**
	 * Data for test_retired_stats_page_request.
	 *
	 * @return array
	 */
	public static function provide_retired_stats_page_requests() {
		return array(
			'retired page'               => array( 'stats', false, 'administrator', true ),
			'page still registered'      => array( 'stats', true, 'administrator', false ),
			'another missing page'       => array( 'stats-other', false, 'administrator', false ),
			'user who cannot read Stats' => array( 'stats', false, 'editor', false ),
		);
	}

	/**
	 * The fragment is read in the browser, so the page has to carry the dashboard URL to append the route to.
	 */
	public function test_retired_stats_page_sends_the_reader_to_the_dashboard() {
		ob_start();
		Stats_Links::render_retired_stats_page();
		$html = ob_get_clean();

		$this->assertStringContainsString( 'window.location.replace( "http://example.org/wp-admin/admin.php?page=jetpack-premium-analytics-wp-admin\\u0026p=" + encodeURIComponent( path ) )', $html );
		$this->assertStringContainsString( 'content="0;url=' . esc_url( self::DASHBOARD_URL ) . '"', $html );
	}
}
