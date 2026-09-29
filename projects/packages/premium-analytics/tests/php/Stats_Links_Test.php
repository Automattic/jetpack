<?php
/**
 * Tests for the Stats links this dashboard claims.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

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
		$this->reset_analytics_capabilities();
		wp_set_current_user( 0 );

		parent::tear_down();
	}

	public function test_register_hooks_the_stats_url_filter() {
		// Without this the test passes on a filter something else left hooked, and
		// would keep passing if register() became a no-op.
		$this->assertFalse(
			has_filter( 'jetpack_stats_url', array( Stats_Links::class, 'filter_url' ) ),
			'The filter was already hooked, so register() proves nothing here.'
		);

		Stats_Links::register();

		$this->assertSame( 10, has_filter( 'jetpack_stats_url', array( Stats_Links::class, 'filter_url' ) ) );
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
					'view'    => 'post',
					'post_id' => 123,
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

		$this->assertSame( self::LEGACY_URL, Stats_Links::filter_url( self::LEGACY_URL, array( 'view' => 'settings' ) ) );
	}

	public function test_user_who_cannot_view_the_dashboard_keeps_the_stats_url() {
		$this->login_as( 'editor' );

		$this->assertSame( self::LEGACY_URL, Stats_Links::filter_url( self::LEGACY_URL, array( 'view' => 'dashboard' ) ) );
	}
}
