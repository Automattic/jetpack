<?php
/**
 * Redirects author links that use a slug the author no longer holds.
 *
 * @package wpcomsh
 */

/**
 * User meta holding each author slug a user had before it changed, one row per slug.
 */
const WPCOMSH_OLD_AUTHOR_SLUG_META = 'wpcomsh_old_author_slug';

/**
 * Remembers a user's previous author slug when it changes, such as after a WordPress.com username change.
 *
 * @since $$next-version$$
 *
 * @param int     $user_id       ID of the updated user.
 * @param WP_User $old_user_data The user before the update.
 */
function wpcomsh_record_old_author_slug( $user_id, $old_user_data ) {
	$user = get_userdata( $user_id );
	if ( ! $user || ! $old_user_data instanceof WP_User ) {
		return;
	}

	$old_slug = (string) $old_user_data->user_nicename;
	$new_slug = (string) $user->user_nicename;

	if ( $old_slug === $new_slug ) {
		return;
	}

	// Each slug is cleared from every user, so it redirects to whoever left it last, and a live slug
	// (including one this user is taking back) never redirects at all.
	if ( '' !== $old_slug ) {
		delete_metadata( 'user', 0, WPCOMSH_OLD_AUTHOR_SLUG_META, $old_slug, true );
		add_user_meta( $user_id, WPCOMSH_OLD_AUTHOR_SLUG_META, $old_slug );
	}

	delete_metadata( 'user', 0, WPCOMSH_OLD_AUTHOR_SLUG_META, $new_slug, true );
}
add_action( 'profile_update', 'wpcomsh_record_old_author_slug', 10, 2 );

/**
 * Finds where a request for an author slug the author no longer holds should go.
 *
 * @since $$next-version$$
 *
 * @return string|null The current author archive or feed URL, or null when no user left that slug.
 */
function wpcomsh_get_old_author_slug_redirect_url() {
	global $wp_rewrite;

	$slug = (string) get_query_var( 'author_name' );

	// A slug a user holds now always wins over one somebody left behind.
	if ( '' === $slug || get_user_by( 'slug', $slug ) ) {
		return null;
	}

	$user_ids = get_users(
		array(
			'meta_key'    => WPCOMSH_OLD_AUTHOR_SLUG_META, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
			'meta_value'  => $slug, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
			'number'      => 1,
			'fields'      => 'ID',
			'count_total' => false,
		)
	);

	if ( ! $user_ids ) {
		return null;
	}

	$user_id = (int) $user_ids[0];

	if ( is_feed() ) {
		$feed = get_query_var( 'feed' );

		// `/author/<slug>/feed/` sets the feed to 'feed', which means the default feed.
		return get_author_feed_link( $user_id, 'feed' === $feed ? '' : $feed );
	}

	$url   = get_author_posts_url( $user_id );
	$paged = (int) get_query_var( 'paged' );

	if ( $paged > 1 ) {
		$url = $wp_rewrite->using_permalinks()
			? user_trailingslashit( trailingslashit( $url ) . $wp_rewrite->pagination_base . '/' . $paged, 'paged' )
			: add_query_arg( 'paged', $paged, $url );
	}

	return $url;
}

/**
 * Redirects an author slug the author no longer holds to their current one.
 *
 * @since $$next-version$$
 */
function wpcomsh_redirect_old_author_slug() {
	$url = wpcomsh_get_old_author_slug_redirect_url();

	if ( $url ) {
		wp_safe_redirect( $url, 301 );
		exit( 0 );
	}
}
add_action( 'template_redirect', 'wpcomsh_redirect_old_author_slug' );
