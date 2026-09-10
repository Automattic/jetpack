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
	 * @param int    $wpcom_user_id The owner's WordPress.com user ID, as confirmed by WordPress.com.
	 * @param int    $local_user_id The owner's local WordPress user ID.
	 * @param string $confirmed_by  How the confirmation was obtained, e.g. `popup` or `recovery`.
	 *                              Required, and travels to WordPress.com with the anchor: it names
	 *                              a mechanism rather than a local user, and a default here would
	 *                              record provenance nobody established.
	 * @return bool Whether the anchor is now stored as requested.
	 */
	public static function set( $wpcom_user_id, $local_user_id, $confirmed_by ) {
		$confirmed_by = sanitize_key( $confirmed_by );

		// A blank mechanism is indistinguishable from one never recorded, which is what requiring
		// the argument was meant to prevent.
		if ( ! $confirmed_by ) {
			return false;
		}

		$anchor = array(
			'wpcom_user_id' => absint( $wpcom_user_id ),
			'local_user_id' => absint( $local_user_id ),
			'locked'        => true,
			'confirmed_at'  => gmdate( 'Y-m-d\TH:i:s\Z' ),
			'confirmed_by'  => $confirmed_by,
		);

		if ( Jetpack_Options::update_option( self::OPTION, $anchor ) ) {
			return true;
		}

		// `update_option()` reports false for an unchanged value as well as for a failed write.
		return Jetpack_Options::get_option( self::OPTION ) === $anchor;
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
	 * Get the anchor, but only while it is locked.
	 *
	 * An unlocked anchor names an owner without preventing ownership moving, so it protects
	 * nobody and callers gating on protection must not see it.
	 *
	 * @since $$next-version$$
	 *
	 * @return array|null The locked anchor, or null when there is none.
	 */
	public static function get_locked() {
		$anchor = self::get();

		return ( $anchor && ! empty( $anchor['locked'] ) ) ? $anchor : null;
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
		return null !== self::get_locked();
	}
}
