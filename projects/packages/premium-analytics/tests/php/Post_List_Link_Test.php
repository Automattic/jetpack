<?php
/**
 * Tests for the post list table's views column link.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/traits/trait-analytics-capabilities.php';

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Post_List_Link
 */
#[CoversClass( Post_List_Link::class )]
class Post_List_Link_Test extends BaseTestCase {

	use Analytics_Capabilities_Trait;

	const LEGACY_URL = 'https://example.org/wp-admin/admin.php?page=stats#!/stats/post/123/9';

	/**
	 * Spelled out rather than built with Analytics::dashboard_url(), so a change
	 * to how that method encodes the route fails here instead of moving both
	 * sides of the assertion together. WorDBless pins the site URL.
	 */
	const DETAIL_URL = 'http://example.org/wp-admin/admin.php?page=jetpack-premium-analytics-wp-admin&p=%2Fpost%2F123';

	/**
	 * Hook the capability mapping, the way an entry point would.
	 */
	public function set_up() {
		Capabilities::register();
	}

	/**
	 * Drop the mapping, the filter, and the logged-in user.
	 */
	public function tear_down() {
		remove_all_filters( 'jetpack_stats_post_list_column_url' );
		$this->reset_analytics_capabilities();
		wp_set_current_user( 0 );

		parent::tear_down();
	}

	public function test_register_hooks_the_column_url_filter() {
		// Without this the test passes on a filter something else left hooked, and
		// would keep passing if register() became a no-op.
		$this->assertFalse(
			has_filter( 'jetpack_stats_post_list_column_url', array( Post_List_Link::class, 'filter_url' ) ),
			'The filter was already hooked, so register() proves nothing here.'
		);

		Post_List_Link::register();

		$this->assertSame(
			10,
			has_filter( 'jetpack_stats_post_list_column_url', array( Post_List_Link::class, 'filter_url' ) )
		);
	}

	public function test_filter_url_points_at_the_post_detail_page() {
		$this->login_as( 'administrator' );

		$this->assertSame( self::DETAIL_URL, Post_List_Link::filter_url( self::LEGACY_URL, 123 ) );
	}

	/**
	 * A site can grant Stats access to a non-administrator, and the dashboard
	 * honours that grant, so the link has to follow it too.
	 */
	public function test_filter_url_points_a_view_stats_reader_at_the_post_detail_page() {
		$user_id = $this->login_as( 'editor' );
		$this->grant_view_stats_to( $user_id );

		$this->assertSame( self::DETAIL_URL, Post_List_Link::filter_url( self::LEGACY_URL, 123 ) );
	}

	/**
	 * Defence in depth: the column itself is already gated on the same primitives,
	 * so no reader reaches this arm from the post list. It guards the next caller
	 * of a public filter.
	 */
	public function test_filter_url_leaves_the_legacy_url_when_the_capability_is_absent() {
		$this->login_as( 'editor' );

		$this->assertSame( self::LEGACY_URL, Post_List_Link::filter_url( self::LEGACY_URL, 123 ) );
	}

	/**
	 * A row with no real post has no detail page to send anyone to.
	 */
	public function test_filter_url_leaves_the_legacy_url_without_a_post_id() {
		$this->login_as( 'administrator' );

		$this->assertSame( self::LEGACY_URL, Post_List_Link::filter_url( self::LEGACY_URL, 0 ) );
	}
}
