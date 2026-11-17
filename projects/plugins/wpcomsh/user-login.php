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
 * The user already held the requested login, so there was nothing to do.
 */
const WPCOMSH_USER_LOGIN_ALREADY_APPLIED = 'already_applied';

/**
 * The user holds neither the expected nor the requested login, so a later
 * rename has already landed and this one must not be applied.
 */
const WPCOMSH_USER_LOGIN_SUPERSEDED = 'superseded';

/**
 * Renames a user's user_login, provided they still hold the login the caller expects.
 *
 * WordPress cannot do this: wp_insert_user() writes user_login on insert only, so
 * wp_update_user() and `wp user update` silently discard it.
 *
 * Passing the login the caller believes the user currently has makes the write a
 * compare-and-set. A stale rename queued before a newer one therefore reports
 * WPCOMSH_USER_LOGIN_SUPERSEDED instead of reverting the newer login.
 *
 * @since $$next-version$$
 *
 * @param int    $user_id        ID of the user to rename.
 * @param string $expected_login Login the caller expects the user to currently hold.
 * @param string $new_login      Login to set.
 * @return string|WP_Error One of the WPCOMSH_USER_LOGIN_* outcomes, or WP_Error with code
 *                         `invalid_login`, `user_not_found`, `login_taken` or `update_failed`.
 */
function wpcomsh_rename_user_login( $user_id, $expected_login, $new_login ) {
	global $wpdb;

	$user_id   = (int) $user_id;
	$new_login = (string) $new_login;

	if ( '' === $new_login || sanitize_user( $new_login, true ) !== $new_login ) {
		return new WP_Error(
			'invalid_login',
			sprintf( 'The requested login %s is not a valid user_login.', $new_login )
		);
	}

	$user = get_userdata( $user_id );
	if ( ! $user ) {
		return new WP_Error( 'user_not_found', sprintf( 'No user with ID %d on this site.', $user_id ) );
	}

	if ( $user->user_login === $new_login ) {
		return WPCOMSH_USER_LOGIN_ALREADY_APPLIED;
	}

	if ( $user->user_login !== (string) $expected_login ) {
		return WPCOMSH_USER_LOGIN_SUPERSEDED;
	}

	// user_login carries a non-unique index, so the database will not reject a duplicate and
	// the "is it free" check below would race a second rename of the same login. A named lock
	// serializes those; it is held per connection, so it survives whatever transaction the
	// caller is in. It does not cover a plain wp_insert_user() racing us, which carries the
	// same window WordPress itself has in username_exists().
	$updated  = false;
	$db_error = '';
	$lock     = 'wpcomsh_login_' . md5( $new_login );
	if ( '1' !== (string) $wpdb->get_var( $wpdb->prepare( 'SELECT GET_LOCK(%s, 10)', $lock ) ) ) { // phpcs:ignore WordPress.DB.DirectDatabaseQuery
		return new WP_Error(
			'update_failed',
			sprintf( 'Timed out waiting to claim the login %s.', $new_login )
		);
	}

	$holder = $wpdb->get_var( $wpdb->prepare( "SELECT ID FROM $wpdb->users WHERE user_login = %s", $new_login ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery

	if ( null === $holder ) {
		$updated  = $wpdb->update( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->users,
			array( 'user_login' => $new_login ),
			array(
				'ID'         => $user_id,
				'user_login' => $expected_login,
			)
		);
		$db_error = $wpdb->last_error;
	}

	$wpdb->get_var( $wpdb->prepare( 'SELECT RELEASE_LOCK(%s)', $lock ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery

	if ( null !== $holder ) {
		return new WP_Error(
			'login_taken',
			sprintf( 'User %d on this site already holds the login %s.', (int) $holder, $new_login ),
			array( 'holder_user_id' => (int) $holder )
		);
	}

	if ( ! $updated ) {
		return new WP_Error(
			'update_failed',
			sprintf( 'Could not write the new login for user %d: %s', $user_id, $db_error )
		);
	}

	// $user still holds the old login, so this drops the stale `userlogins` key that
	// would otherwise keep resolving the old name. Cleaning only the refreshed user misses it.
	clean_user_cache( $user );
	clean_user_cache( $user_id );

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

	return WPCOMSH_USER_LOGIN_RENAMED;
}
