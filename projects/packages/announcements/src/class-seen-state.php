<?php
/**
 * Seen state of the announcements.
 *
 * @package automattic/jetpack-announcements
 */

namespace Automattic\Jetpack\Announcements;

/**
 * Stores which announcements a user has seen, and when.
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
	 * Retrieves when a user saw each announcement.
	 *
	 * @param int $user_id User id.
	 * @return array<string,int> Unix timestamps by announcement id, the one seen last at the end.
	 */
	public static function get_dates( $user_id ) {
		$stored = get_user_meta( $user_id, self::META_KEY, true );
		$dates  = array();

		foreach ( is_array( $stored ) ? $stored : array() as $id => $date ) {
			if ( is_string( $id ) && is_int( $date ) ) {
				$dates[ $id ] = $date;
			}
		}

		return $dates;
	}

	/**
	 * Marks an announcement as seen or unseen by a user. One already seen keeps its date.
	 *
	 * @param int    $user_id User id.
	 * @param string $id      Announcement id.
	 * @param bool   $seen    Whether the user has seen it.
	 * @return void
	 */
	public static function set( $user_id, $id, $seen ) {
		$dates = self::get_dates( $user_id );

		if ( ! $seen ) {
			unset( $dates[ $id ] );
		} elseif ( ! isset( $dates[ $id ] ) ) {
			$dates[ $id ] = time();
		}

		update_user_meta( $user_id, self::META_KEY, array_slice( $dates, -self::MAX_IDS ) );
	}
}
