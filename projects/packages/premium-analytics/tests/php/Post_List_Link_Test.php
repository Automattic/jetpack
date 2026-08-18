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
		Post_List_Link::register();

		$this->assertNotFalse(
			has_filter( 'jetpack_stats_post_list_column_url', array( Post_List_Link::class, 'filter_url' ) )
		);
	}

	public function test_filter_url_points_at_the_post_detail_page() {
		$this->login_as( 'administrator' );

		$this->assertSame(
			Analytics::dashboard_url( '/post/123' ),
			Post_List_Link::filter_url( self::LEGACY_URL, 123 )
		);
	}

	/**
	 * The legacy page has its own access rules, so a reader who cannot open the
	 * dashboard keeps the link they had.
	 */
	public function test_filter_url_leaves_the_legacy_url_for_a_user_without_access() {
		$this->login_as( 'editor' );

		$this->assertSame( self::LEGACY_URL, Post_List_Link::filter_url( self::LEGACY_URL, 123 ) );
	}
}
