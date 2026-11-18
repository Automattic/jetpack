<?php
/**
 * Renaming the local user_login of a WordPress.com-connected user.
 *
 * @package wpcomsh
 */

/**
 * The rename was applied by this call.
 */
const WPCOMSH_USER_LOGIN_RENAMED = 'renamed';

/**
 * The user already held the requested login.
 */
const WPCOMSH_USER_LOGIN_ALREADY_APPLIED = 'already_applied';

/**
 * The user holds neither login, so a later rename landed and this one must not be applied.
 */
const WPCOMSH_USER_LOGIN_SUPERSEDED = 'superseded';

/**
 * User meta holding each author slug a user had before a login rename, one row per slug.
 */
const WPCOMSH_OLD_AUTHOR_SLUG_META = 'wpcomsh_old_author_slug';

/**
 * Renames a user's user_login, provided they still hold the login the caller expects.
 *
 * WordPress cannot: wp_insert_user() writes user_login on insert only, so wp_update_user()
 * and `wp user update` silently discard it. $expected_login makes the write a compare-and-set,
 * so a stale rename reports WPCOMSH_USER_LOGIN_SUPERSEDED rather than reverting a newer login.
 *
 * @since $$next-version$$
 *
 * @param int    $user_id        ID of the user to rename.
 * @param string $expected_login Login the caller expects the user to currently hold.
 * @param string $new_login      Login to set.
 * @return string|WP_Error One of the WPCOMSH_USER_LOGIN_* outcomes, or WP_Error with code
 *                         `invalid_login`, `user_not_found`, `login_taken`, `update_failed` or
 *                         `profile_update_failed`, which a re-run with the same arguments repairs.
 */
function wpcomsh_rename_user_login( $user_id, $expected_login, $new_login ) {
	$user_id   = (int) $user_id;
	$new_login = (string) $new_login;

	// The slug check rejects logins such as `...`, which WordPress cannot give an author slug.
	if ( '' === $new_login || sanitize_user( $new_login, true ) !== $new_login || '' === sanitize_title( $new_login ) ) {
		return new WP_Error(
			'invalid_login',
			sprintf( 'The requested login %s is not a valid user_login.', $new_login )
		);
	}

	// Covers the profile update too: two renames of one user claim different logins, so only
	// this lock stops an A to B rename from writing B's names over a B to C rename.
	$user_lock = 'wpcomsh_rename_user_' . $user_id;
	if ( ! wpcomsh_get_user_login_lock( $user_lock ) ) {
		return new WP_Error(
			'update_failed',
			sprintf( 'Timed out waiting for another rename of user %d.', $user_id )
		);
	}

	$result = wpcomsh_rename_locked_user_login( $user_id, (string) $expected_login, $new_login );

	wpcomsh_release_user_login_lock( $user_lock );

	return $result;
}

/**
 * Renames the login and moves the profile with it, while the caller holds the user's lock.
 *
 * @since $$next-version$$
 *
 * @param int    $user_id        ID of the user to rename.
 * @param string $expected_login Login the caller expects the user to currently hold.
 * @param string $new_login      Login to set.
 * @return string|WP_Error See wpcomsh_rename_user_login().
 */
function wpcomsh_rename_locked_user_login( $user_id, $expected_login, $new_login ) {
	$user = get_userdata( $user_id );
	if ( ! $user ) {
		return new WP_Error( 'user_not_found', sprintf( 'No user with ID %d on this site.', $user_id ) );
	}

	// user_login has a non-unique index, so the database will not reject a duplicate and the
	// holder check below would race a second rename. The lock serializes those; it does not
	// cover a plain wp_insert_user(), which races the same window as username_exists().
	$login_lock = 'wpcomsh_login_' . md5( $new_login );
	if ( ! wpcomsh_get_user_login_lock( $login_lock ) ) {
		return new WP_Error(
			'update_failed',
			sprintf( 'Timed out waiting to claim the login %s.', $new_login )
		);
	}

	$result = wpcomsh_write_user_login( $user_id, $expected_login, $new_login );

	wpcomsh_release_user_login_lock( $login_lock );

	if ( WPCOMSH_USER_LOGIN_ALREADY_APPLIED === $result ) {
		// Lets a re-run finish a rename whose profile update failed.
		$followed = wpcomsh_follow_user_login_rename( $user_id, $expected_login, $new_login );
		return is_wp_error( $followed ) ? $followed : $result;
	}

	if ( WPCOMSH_USER_LOGIN_RENAMED !== $result ) {
		return $result;
	}

	// $user predates the write, so this drops the stale `userlogins` key for the old login.
	// Cleaning only the refreshed user leaves the old name resolving.
	clean_user_cache( $user );
	clean_user_cache( $user_id );

	$followed = wpcomsh_follow_user_login_rename( $user_id, $expected_login, $new_login );

	/**
	 * Fires after a user's user_login has been renamed on this site.
	 *
	 * @since $$next-version$$
	 *
	 * @param int    $user_id   ID of the renamed user.
	 * @param string $old_login Login the user held before the rename.
	 * @param string $new_login Login the user holds now.
	 */
	do_action( 'wpcomsh_user_login_renamed', $user_id, $expected_login, $new_login );

	return is_wp_error( $followed ) ? $followed : WPCOMSH_USER_LOGIN_RENAMED;
}

/**
 * Takes a MySQL named lock, waiting up to 10 seconds for it.
 *
 * @since $$next-version$$
 *
 * @param string $name Lock name.
 * @return bool Whether the lock was taken.
 */
function wpcomsh_get_user_login_lock( $name ) {
	global $wpdb;

	return '1' === (string) $wpdb->get_var( $wpdb->prepare( 'SELECT GET_LOCK(%s, 10)', $name ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
}

/**
 * Releases a lock taken with wpcomsh_get_user_login_lock().
 *
 * @since $$next-version$$
 *
 * @param string $name Lock name.
 */
function wpcomsh_release_user_login_lock( $name ) {
	global $wpdb;

	$wpdb->get_var( $wpdb->prepare( 'SELECT RELEASE_LOCK(%s)', $name ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
}

/**
 * Performs the compare-and-set, with every state read taken while the caller holds the lock.
 *
 * @since $$next-version$$
 *
 * @param int    $user_id        ID of the user to rename.
 * @param string $expected_login Login the caller expects the user to currently hold.
 * @param string $new_login      Login to set.
 * @return string|WP_Error A WPCOMSH_USER_LOGIN_* outcome, or WP_Error `login_taken`/`update_failed`.
 */
function wpcomsh_write_user_login( $user_id, $expected_login, $new_login ) {
	global $wpdb;

	$current = $wpdb->get_var( $wpdb->prepare( "SELECT user_login FROM $wpdb->users WHERE ID = %d", $user_id ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery

	if ( null === $current ) {
		return new WP_Error( 'user_not_found', sprintf( 'No user with ID %d on this site.', $user_id ) );
	}

	if ( $current === $new_login ) {
		return WPCOMSH_USER_LOGIN_ALREADY_APPLIED;
	}

	if ( $current !== $expected_login ) {
		return WPCOMSH_USER_LOGIN_SUPERSEDED;
	}

	$holder = $wpdb->get_var( $wpdb->prepare( "SELECT ID FROM $wpdb->users WHERE user_login = %s AND ID <> %d", $new_login, $user_id ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery

	if ( null !== $holder ) {
		return new WP_Error(
			'login_taken',
			sprintf( 'User %d on this site already holds the login %s.', (int) $holder, $new_login ),
			array( 'holder_user_id' => (int) $holder )
		);
	}

	$updated = $wpdb->update( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
		$wpdb->users,
		array( 'user_login' => $new_login ),
		array(
			'ID'         => $user_id,
			'user_login' => $expected_login,
		)
	);

	if ( $updated ) {
		return WPCOMSH_USER_LOGIN_RENAMED;
	}

	$db_error = $wpdb->last_error;
	$current  = $wpdb->get_var( $wpdb->prepare( "SELECT user_login FROM $wpdb->users WHERE ID = %d", $user_id ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery

	// Zero rows means either a database error or the row moving under us, which are not the
	// same outcome to the caller: one is worth retrying, the other must not be.
	if ( $current === $new_login ) {
		return WPCOMSH_USER_LOGIN_ALREADY_APPLIED;
	}

	if ( $current !== $expected_login ) {
		return WPCOMSH_USER_LOGIN_SUPERSEDED;
	}

	return new WP_Error(
		'update_failed',
		sprintf( 'Could not write the new login for user %d: %s', $user_id, $db_error )
	);
}

/**
 * Moves the author slug and nickname to the new login, where they still hold the defaults
 * WordPress derived from the old one. WordPress.com owns the display name and syncs it itself.
 *
 * @since $$next-version$$
 *
 * @param int    $user_id   ID of the renamed user.
 * @param string $old_login Login the user held before the rename.
 * @param string $new_login Login the user holds now.
 * @return true|WP_Error WP_Error `profile_update_failed` when WordPress rejects the update.
 */
function wpcomsh_follow_user_login_rename( $user_id, $old_login, $new_login ) {
	$user = get_userdata( $user_id );
	if ( ! $user ) {
		return new WP_Error( 'user_not_found', sprintf( 'No user with ID %d on this site.', $user_id ) );
	}

	$changes  = array();
	$old_slug = $user->user_nicename;

	if ( $old_login === $user->nickname ) {
		$changes['nickname'] = $new_login;
	}

	if ( wpcomsh_is_default_author_slug( $old_slug, $old_login ) ) {
		// wp_insert_user() sanitizes this and adds a -2 style suffix if another user holds it.
		$changes['user_nicename'] = mb_substr( $new_login, 0, 50 );
	}

	if ( ! $changes ) {
		return true;
	}

	$changes['ID'] = $user_id;
	$updated       = wp_update_user( $changes );

	if ( is_wp_error( $updated ) ) {
		return new WP_Error(
			'profile_update_failed',
			sprintf( 'Renamed the login of user %d, but could not update their profile: %s', $user_id, $updated->get_error_message() )
		);
	}

	$new_slug = get_userdata( $user_id )->user_nicename;

	// Each slug is cleared from every user, so it redirects to whoever left it last, and a live slug
	// (including one this user is taking back) never redirects at all.
	if ( $new_slug !== $old_slug ) {
		delete_metadata( 'user', 0, WPCOMSH_OLD_AUTHOR_SLUG_META, $old_slug, true );
		add_user_meta( $user_id, WPCOMSH_OLD_AUTHOR_SLUG_META, $old_slug );
	}

	delete_metadata( 'user', 0, WPCOMSH_OLD_AUTHOR_SLUG_META, $new_slug, true );

	return true;
}

/**
 * Whether an author slug is the one wp_insert_user() derives from a login.
 *
 * @since $$next-version$$
 *
 * @param string $slug  The user's user_nicename.
 * @param string $login The login it may have been derived from.
 * @return bool
 */
function wpcomsh_is_default_author_slug( $slug, $login ) {
	$base = sanitize_title( mb_substr( $login, 0, 50 ) );

	if ( $slug === $base ) {
		return true;
	}

	// A slug another user held gets a numeric suffix, with the base cut to keep 50 characters.
	return (bool) preg_match( '/^(.+)-(\d+)$/', $slug, $matches )
		&& mb_substr( $base, 0, 49 - strlen( $matches[2] ) ) === $matches[1];
}

/**
 * Finds where a request for an author slug left behind by a login rename should go.
 *
 * @since $$next-version$$
 *
 * @return string|null The new author archive or feed URL, or null when no user left that slug.
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
 * Redirects an author slug left behind by a login rename to the user's current one.
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
