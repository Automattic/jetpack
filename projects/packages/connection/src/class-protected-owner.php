<?php
/**
 * The Jetpack Connection Protected Owner class file.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Jetpack_Options;

/**
 * The local anchor naming the connection's protected owner.
 *
 * WordPress.com is authoritative on who the owner is; this records who the site was told to
 * expect, so ownership stops following whoever connected first. Identity is always matched on
 * `wpcom_user_id` — `local_user_id` is a re-pointable cache, never the match key.
 *
 * @since $$next-version$$
 */
class Protected_Owner {

	const OPTION = 'protected_owner';

	/**
	 * Get the anchor.
	 *
	 * @since $$next-version$$
	 *
	 * @return array|null The anchor, or null when none is usable.
	 */
	public static function get() {
		$anchor = Jetpack_Options::get_option( self::OPTION );

		if ( ! is_array( $anchor ) || empty( $anchor['wpcom_user_id'] ) ) {
			return null;
		}

		return $anchor;
	}

	/**
	 * Record a confirmed protected owner and lock the anchor.
	 *
	 * @since $$next-version$$
	 *
	 * @param int      $wpcom_user_id The owner's WordPress.com user ID, as confirmed by WordPress.com.
	 * @param int      $local_user_id The owner's local WordPress user ID.
	 * @param string   $email         The owner's WordPress.com email.
	 * @param int|null $confirmed_by  Who confirmed it. Defaults to the current user.
	 * @return bool Whether the anchor was written.
	 */
	public static function set( $wpcom_user_id, $local_user_id, $email = '', $confirmed_by = null ) {
		return Jetpack_Options::update_option(
			self::OPTION,
			array(
				'wpcom_user_id' => absint( $wpcom_user_id ),
				'email'         => $email,
				'local_user_id' => absint( $local_user_id ),
				'locked'        => true,
				'confirmed_at'  => time(),
				'confirmed_by'  => null === $confirmed_by ? get_current_user_id() : absint( $confirmed_by ),
			)
		);
	}

	/**
	 * Drop the anchor, unlocking ownership.
	 *
	 * Leaves `master_user` alone: clearing the lock does not change who the owner is.
	 *
	 * @internal Recovery and support flows only. Consumers must not call this.
	 * @since $$next-version$$
	 *
	 * @return bool Whether the anchor was deleted.
	 */
	public static function clear() {
		return Jetpack_Options::delete_option( self::OPTION );
	}

	/**
	 * Whether an anchor is set and locked.
	 *
	 * Deliberately independent of whether the current owner matches it: a mismatch is when
	 * ownership most needs to stay locked.
	 *
	 * @since $$next-version$$
	 *
	 * @return bool
	 */
	public static function is_locked() {
		$anchor = self::get();

		return $anchor && ! empty( $anchor['locked'] );
	}
}
