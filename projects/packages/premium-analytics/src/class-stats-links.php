<?php
/**
 * Stats entry points outside the dashboard.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Sends links to Stats pages (the admin bar, the post list Views column, the newsletter action bar) to the matching
 * dashboard page instead.
 *
 * @since $$next-version$$
 */
class Stats_Links {

	/**
	 * Claim the links. Idempotent, like the other register() calls.
	 *
	 * Outside the admin-chrome gate on purpose: the admin bar and the action bar also render on the front end, and Quick Edit re-renders the Views column over AJAX.
	 *
	 * @return void
	 */
	public static function register() {
		add_filter( 'jetpack_stats_url', array( __CLASS__, 'filter_url' ), 10, 2 );
	}

	/**
	 * Point a Stats link at the dashboard page for the view it opens.
	 *
	 * @param string $url  Stats URL.
	 * @param array  $args The page the link opens: `view`, plus `id` for the `post` view.
	 * @return string
	 */
	public static function filter_url( $url, $args ) {
		$view = is_array( $args ) ? ( $args['view'] ?? null ) : null;

		if ( 'dashboard' === $view ) {
			return self::route_url( $url, '/' );
		}

		if ( 'post' === $view ) {
			return self::post_url( $url, $args['id'] ?? 0 );
		}

		return $url;
	}

	/**
	 * The post detail page, or `$url` when there is no real post to show.
	 *
	 * @param string $url     Stats URL for the post.
	 * @param mixed  $post_id The post.
	 * @return string
	 */
	private static function post_url( $url, $post_id ) {
		$post_id = (int) $post_id;

		if ( $post_id <= 0 ) {
			return $url;
		}

		return self::route_url( $url, '/post/' . $post_id );
	}

	/**
	 * A dashboard route, or `$url` for a user who cannot open the dashboard.
	 *
	 * Wins even where the link would otherwise point at Calypso: this dashboard is the site's
	 * analytics UI and exists only in wp-admin, so the admin-interface preference doesn't apply.
	 * Checked here even where the caller already gates on the same primitives: the filter is public.
	 *
	 * @param string $url  Stats URL.
	 * @param string $path Dashboard route.
	 * @return string
	 */
	private static function route_url( $url, $path ) {
		if ( ! Capabilities::current_user_can_view_analytics() ) {
			return $url;
		}

		return Analytics::dashboard_url( $path );
	}
}
