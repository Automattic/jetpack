<?php
/**
 * Expiry_Notice_Dismiss: dismiss logic for the banner and modal.
 *
 * Storage is per-site user_meta exposed via the WP REST `/wp/v2/users/me`
 * endpoint so Atomic JS and Calypso (via wpcom's site-proxy) can both write
 * the dismissal. `sanitize_callback` substitutes `time()` for whatever the
 * client posts, so clients don't need to be trusted with a timestamp.
 *
 * Notices dismiss per surface and the modal dismisses everywhere, so they do
 * not share a key. Dismissing the reverted-site notice in the hosting
 * dashboard is meant to leave wp-admin's showing — "it'll show once again in
 * the admin" — whereas closing the modal on one page is meant to remove it
 * from all of them. Each notice surface therefore gets its own key; when the
 * hosting-dashboard notice lands it registers a sibling of META_BANNER rather
 * than reusing it.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices;

/**
 * Show/hide decision plus REST registration for the dismiss meta.
 */
class Expiry_Notice_Dismiss {

	// Scoped to wp-admin: this notice's dismissal is its own, not the platform's.
	const META_BANNER = 'wpcom_plan_expiry_notice_dismiss_wp_admin';
	// Not scoped: one dismissal of the modal clears it on every surface.
	const META_MODAL = 'wpcom_plan_expiry_modal_dismiss';

	const FINAL_WINDOW_DAYS = 7;

	/**
	 * Register the banner + modal dismiss meta keys on the `user` object.
	 */
	public static function register_user_meta(): void {
		foreach ( array( self::META_BANNER, self::META_MODAL ) as $meta_key ) {
			register_meta(
				'user',
				$meta_key,
				array(
					'show_in_rest'      => true,
					'single'            => true,
					'type'              => 'integer',
					'sanitize_callback' => static function ( $value ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $value is intentionally ignored; the server timestamp is the truth.
						return time();
					},
					'auth_callback'     => static function () {
						return current_user_can( 'manage_options' );
					},
				)
			);
		}
	}

	/**
	 * Whether the notice for this state can be dismissed at all.
	 *
	 * Every stage from the first reminder through the grace period stays put:
	 * the site still has something to lose, and the "remind me in X days"
	 * system those stages used to offer was dropped in design review. Once the
	 * grace period is over the revert has already happened, so there is nothing
	 * left for the notice to prevent and it can be dismissed.
	 *
	 * @param array<string,mixed> $expiry_state State from Expiry_Data::get_expiry_state().
	 */
	public static function is_dismissible( array $expiry_state ): bool {
		return Expiry_Data::STATE_EXPIRED === ( $expiry_state['state'] ?? '' );
	}

	/**
	 * Should the banner show for the given user right now?
	 *
	 * @param array<string,mixed> $expiry_state State from Expiry_Data::get_expiry_state().
	 * @param int|null            $user_id      Defaults to current user.
	 */
	public static function should_show_banner( array $expiry_state, ?int $user_id = null ): bool {
		return ! self::is_dismissible( $expiry_state ) || ! self::is_dismissed( $user_id, self::META_BANNER );
	}

	/**
	 * Should the expired-state modal show for the given user right now?
	 *
	 * @param array<string,mixed> $expiry_state State from Expiry_Data::get_expiry_state().
	 * @param int|null            $user_id      Defaults to current user.
	 */
	public static function should_show_modal( array $expiry_state, ?int $user_id = null ): bool {
		return ! self::is_dismissible( $expiry_state ) || ! self::is_dismissed( $user_id, self::META_MODAL );
	}

	/**
	 * Whether this user has already dismissed the given notice. Dismissal is
	 * permanent: the notice does not come back on its own.
	 *
	 * @param int|null $user_id  Defaults to current user.
	 * @param string   $meta_key One of self::META_BANNER, self::META_MODAL.
	 */
	public static function is_dismissed( ?int $user_id, string $meta_key ): bool {
		return null !== self::get_dismissed_at( $user_id, $meta_key );
	}

	/**
	 * Read the stored dismissal timestamp, or null if none.
	 *
	 * @param int|null $user_id  Defaults to current user.
	 * @param string   $meta_key One of self::META_BANNER, self::META_MODAL.
	 */
	private static function get_dismissed_at( ?int $user_id, string $meta_key ): ?int {
		$user_id ??= get_current_user_id();
		if ( ! $user_id ) {
			return null;
		}
		$raw = get_user_meta( $user_id, $meta_key, true );
		return is_numeric( $raw ) && (int) $raw > 0 ? (int) $raw : null;
	}
}
