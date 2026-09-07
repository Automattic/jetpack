<?php
/**
 * Expiry_Notice_Dismiss: dismiss logic for the banner and modal.
 *
 * Storage is per-site user_meta exposed via the WP REST `/wp/v2/users/me`
 * endpoint so Atomic JS and Calypso (via wpcom's site-proxy) can both write
 * the dismissal. `sanitize_callback` substitutes `time()` for whatever the
 * client posts, so clients don't need to be trusted with a timestamp. That
 * time is load-bearing rather than a record: it is what tells a dismissal of
 * this plan term from one of a term since renewed.
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
	// The grace-period modal comes back, so its dismissal can't share a key with
	// the permanent one: a grace dismissal is stamped after `expiry_ts` and would
	// otherwise satisfy the post-grace check, burying a modal the user never saw.
	const META_MODAL_GRACE = 'wpcom_plan_expiry_modal_dismiss_grace';

	const FINAL_WINDOW_DAYS = 7;

	/**
	 * Stands in for the "browser session" the design asks this modal to be
	 * dismissed for: wp-admin and Calypso are two origins, so no browser store
	 * answers for both and the dismissal lives server-side, where there is no
	 * session to scope it to.
	 */
	const MODAL_GRACE_DISMISS_TTL = DAY_IN_SECONDS;

	/**
	 * Register the banner + modal dismiss meta keys on the `user` object.
	 */
	public static function register_user_meta(): void {
		foreach ( array( self::META_BANNER, self::META_MODAL, self::META_MODAL_GRACE ) as $meta_key ) {
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
		return ! self::is_dismissible( $expiry_state )
			|| ! self::is_dismissed( $user_id, self::META_BANNER, self::term_expiry_ts( $expiry_state ) );
	}

	/**
	 * Should the expired-state modal show for the given user right now?
	 *
	 * The two lapsed states dismiss differently: in grace the modal returns after
	 * `MODAL_GRACE_DISMISS_TTL`, afterwards saying so once is enough. Not routed
	 * through `is_dismissible()`, which answers for the banner.
	 *
	 * @param array<string,mixed> $expiry_state State from Expiry_Data::get_expiry_state().
	 * @param int|null            $user_id      Defaults to current user.
	 */
	public static function should_show_modal( array $expiry_state, ?int $user_id = null ): bool {
		$expiry_ts = self::term_expiry_ts( $expiry_state );

		switch ( $expiry_state['state'] ?? '' ) {
			case Expiry_Data::STATE_EXPIRED_GRACE:
				return ! self::is_dismissed( $user_id, self::META_MODAL_GRACE, $expiry_ts, self::MODAL_GRACE_DISMISS_TTL );
			case Expiry_Data::STATE_EXPIRED:
				return ! self::is_dismissed( $user_id, self::META_MODAL, $expiry_ts );
			default:
				return false;
		}
	}

	/**
	 * The meta key the modal dismisses to in the given state, or null where the
	 * modal doesn't show at all.
	 *
	 * The client has to be told which key to write, and this keeps that choice
	 * in the same class that reads it back.
	 *
	 * @param array<string,mixed> $expiry_state State from Expiry_Data::get_expiry_state().
	 */
	public static function modal_meta_key( array $expiry_state ): ?string {
		switch ( $expiry_state['state'] ?? '' ) {
			case Expiry_Data::STATE_EXPIRED_GRACE:
				return self::META_MODAL_GRACE;
			case Expiry_Data::STATE_EXPIRED:
				return self::META_MODAL;
			default:
				return null;
		}
	}

	/**
	 * Whether this user has already dismissed the given notice for the term the
	 * state describes.
	 *
	 * Dismissal never lapses on its own, but it does not carry across a
	 * renewal. A stamp older than the term's own expiry was recorded against a
	 * purchase that has since been renewed, so the site is lapsing again for
	 * the first time and has something to say about it. The two can't be
	 * confused: a notice is only dismissible once the revert has happened, 30
	 * days past expiry, so a dismissal belonging to this term is always the
	 * later of the two.
	 *
	 * @param int|null $user_id   Defaults to current user.
	 * @param string   $meta_key  One of the self::META_* keys.
	 * @param int|null $expiry_ts Expiry of the term being judged. Null when the
	 *                            caller has no term in hand, where any stored
	 *                            dismissal counts.
	 * @param int|null $ttl       Seconds a dismissal holds for. Null never lapses.
	 */
	public static function is_dismissed( ?int $user_id, string $meta_key, ?int $expiry_ts = null, ?int $ttl = null ): bool {
		$dismissed_at = self::get_dismissed_at( $user_id, $meta_key );
		if ( null === $dismissed_at ) {
			return false;
		}
		if ( null !== $ttl && $dismissed_at < time() - $ttl ) {
			return false;
		}
		return null === $expiry_ts || $dismissed_at >= $expiry_ts;
	}

	/**
	 * The expiry timestamp carried by a state, or null if it has none.
	 *
	 * @param array<string,mixed> $expiry_state State from Expiry_Data::get_expiry_state().
	 */
	private static function term_expiry_ts( array $expiry_state ): ?int {
		return isset( $expiry_state['expiry_ts'] ) ? (int) $expiry_state['expiry_ts'] : null;
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
