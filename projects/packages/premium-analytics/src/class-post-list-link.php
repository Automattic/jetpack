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
 *
 * @since 0.4.0
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
	 * Wins even where the row would otherwise point at Calypso: this dashboard is the site's
	 * analytics UI and exists only in wp-admin, so the admin-interface preference doesn't apply.
	 *
	 * Defence in depth: Admin_Post_List_Column::add_stats_post_table() already drops the column
	 * without `view_stats`/`manage_options`, but this filter is public and its next caller may not gate.
	 *
	 * @param string $url     Stats URL for the post.
	 * @param int    $post_id The post the row belongs to.
	 * @return string
	 */
	public static function filter_url( $url, $post_id ) {
		$post_id = (int) $post_id;

		if ( $post_id <= 0 ) {
			return $url;
		}

		if ( ! Capabilities::current_user_can_view_analytics() ) {
			return $url;
		}

		return Analytics::dashboard_url( '/post/' . $post_id );
	}
}
