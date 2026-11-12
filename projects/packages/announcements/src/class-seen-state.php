<?php
/**
 * Seen state of the announcements.
 *
 * @package automattic/jetpack-announcements
 */

namespace Automattic\Jetpack\Announcements;

/**
 * Stores which announcements a user has seen.
 *
 * Nothing else knows the storage: one user meta whose key has no blog prefix, so the value
 * belongs to the user across the sites of a network.
 */
class Seen_State {

	const META_KEY = 'jetpack_announcements_seen';

	/**
	 * Ids kept per user. Past it, the ones seen longest ago are dropped.
	 */
	const MAX_IDS = 100;

	/**
	 * Retrieves the ids of the announcements a user has seen.
	 *
	 * @param int $user_id User id.
	 * @return string[] Ids, the one seen last at the end.
	 */
	public static function get_ids( $user_id ) {
		$ids = get_user_meta( $user_id, self::META_KEY, true );

		return is_array( $ids ) ? array_values( array_filter( $ids, 'is_string' ) ) : array();
	}

	/**
	 * Marks an announcement as seen or unseen by a user.
	 *
	 * @param int    $user_id User id.
	 * @param string $id      Announcement id.
	 * @param bool   $seen    Whether the user has seen it.
	 * @return void
	 */
	public static function set( $user_id, $id, $seen ) {
		$ids = array_values( array_diff( self::get_ids( $user_id ), array( $id ) ) );
		if ( $seen ) {
			$ids[] = $id;
		}

		update_user_meta( $user_id, self::META_KEY, array_slice( $ids, -self::MAX_IDS ) );
	}
}
