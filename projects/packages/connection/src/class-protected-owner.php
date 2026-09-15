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
	 * @param int    $local_user_id The owner's local WordPress user ID. Required here, though the
	 *                              anchor treats it as a re-pointable cache rather than the match
	 *                              key, so a caller that legitimately does not know it yet would
	 *                              need this relaxed.
	 * @param string $confirmed_by  How the confirmation was obtained, e.g. `popup` or `recovery`.
	 *                              Required, and travels to WordPress.com with the anchor: it names
	 *                              a mechanism rather than a local user, and a default here would
	 *                              record provenance nobody established.
	 * @return bool Whether the anchor is now stored as requested.
	 */
	public static function set( $wpcom_user_id, $local_user_id, $confirmed_by ) {
		$confirmed_by  = sanitize_key( $confirmed_by );
		$wpcom_user_id = absint( $wpcom_user_id );
		$local_user_id = absint( $local_user_id );

		// A zero ID would store an anchor `get()` rejects, and a blank mechanism is
		// indistinguishable from one never recorded. Neither is worth persisting.
		if ( ! $confirmed_by || ! $wpcom_user_id || ! $local_user_id ) {
			return false;
		}

		$anchor = array(
			'wpcom_user_id' => $wpcom_user_id,
			'local_user_id' => $local_user_id,
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
	 * Point the anchor's cached local user ID at a different local user.
	 *
	 * The match key is `wpcom_user_id`; `local_user_id` is a cache of where that identity lives on
	 * this site, and it legitimately moves when the owner reconnects under another local account.
	 * Deliberately narrow: `confirmed_at` and `confirmed_by` record how the owner was originally
	 * confirmed, and re-pointing a cache is not a new confirmation.
	 *
	 * @since $$next-version$$
	 *
	 * @param int $local_user_id The local user the anchored identity now holds.
	 * @return bool Whether the anchor now names that local user.
	 */
	public static function repoint( $local_user_id ) {
		$local_user_id = absint( $local_user_id );
		$anchor        = self::get();

		if ( ! $anchor || ! $local_user_id ) {
			return false;
		}

		if ( (int) $anchor['local_user_id'] === $local_user_id ) {
			return true;
		}

		$anchor['local_user_id'] = $local_user_id;

		if ( Jetpack_Options::update_option( self::OPTION, $anchor ) ) {
			return true;
		}

		return Jetpack_Options::get_option( self::OPTION ) === $anchor;
	}

	/**
	 * Lock or unlock the anchor without disturbing what it records.
	 *
	 * Unlocking is how a site fails closed without forgetting: the anchor keeps the identity and
	 * the provenance of the original claim, and only stops counting as protection. A later
	 * verification can restore the lock without asking the owner to confirm all over again.
	 *
	 * @since $$next-version$$
	 *
	 * @param bool $locked Whether the anchor should protect its owner.
	 * @return bool Whether the anchor is now in that state.
	 */
	public static function set_locked( $locked ) {
		$anchor = self::get();

		if ( ! $anchor ) {
			return false;
		}

		$locked = (bool) $locked;

		if ( ! empty( $anchor['locked'] ) === $locked ) {
			return true;
		}

		$anchor['locked'] = $locked;

		if ( Jetpack_Options::update_option( self::OPTION, $anchor ) ) {
			return true;
		}

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
