<?php
/**
 * Post list table integration.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Sends the views column in the posts and pages list tables to the dashboard's
 * post detail page instead of the Stats one.
 */
class Post_List_Link {

	/**
	 * Claim the column's link. Idempotent, like the other register() calls.
	 *
	 * Outside the admin-chrome gate on purpose: Quick Edit re-renders the cell
	 * over AJAX, where that gate is closed.
	 *
	 * @return void
	 */
	public static function register() {
		add_filter( 'jetpack_stats_post_list_column_url', array( __CLASS__, 'filter_url' ), 10, 2 );
	}

	/**
	 * Point one row at its post detail page.
	 *
	 * A reader who cannot open the dashboard keeps the Stats link: that page has
	 * its own access rules and may still be theirs to read.
	 *
	 * @param string $url     Stats URL for the post.
	 * @param int    $post_id The post the row belongs to.
	 * @return string
	 */
	public static function filter_url( $url, $post_id ) {
		if ( ! Capabilities::current_user_can_view_analytics() ) {
			return $url;
		}

		return Analytics::dashboard_url( '/post/' . (int) $post_id );
	}
}
