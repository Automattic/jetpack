<?php
/**
 * Expiry_Notice_Dismiss: dismiss + cadence logic for the banner and modal.
 *
 * Storage is per-site user_meta exposed via the WP REST `/wp/v2/users/me`
 * endpoint so Atomic JS and Calypso (via wpcom's site-proxy) can both write
 * the dismissal. `sanitize_callback` substitutes `time()` for whatever the
 * client posts, so clients don't need to be trusted with a timestamp.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices;

/**
 * Show/hide decision plus REST registration for the dismiss meta.
 */
class Expiry_Notice_Dismiss {

	const META_BANNER = 'wpcom_plan_expiry_banner_dismiss';
	const META_MODAL  = 'wpcom_plan_expiry_modal_dismiss';

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
	 * Should the banner show for the given user right now?
	 *
	 * @param array<string,mixed> $expiry_state State from Expiry_Data::get_expiry_state().
	 * @param int|null            $user_id      Defaults to current user.
	 * @param int|null            $now          Optional "now" timestamp for testing.
	 */
	public static function should_show_banner( array $expiry_state, ?int $user_id = null, ?int $now = null ): bool {
		$dismissed_at = self::get_dismissed_at( $user_id, self::META_BANNER );
		return self::evaluate_show( $dismissed_at, self::banner_cadence_seconds( $expiry_state ), $now );
	}

	/**
	 * Should the expired-state modal show for the given user right now?
	 *
	 * @param array<string,mixed> $expiry_state State from Expiry_Data::get_expiry_state().
	 * @param int|null            $user_id      Defaults to current user.
	 * @param int|null            $now          Optional "now" timestamp for testing.
	 */
	public static function should_show_modal( array $expiry_state, ?int $user_id = null, ?int $now = null ): bool {
		$dismissed_at = self::get_dismissed_at( $user_id, self::META_MODAL );
		return self::evaluate_show( $dismissed_at, self::modal_cadence_seconds( $expiry_state ), $now );
	}

	/**
	 * Pure: should the notice show given a prior dismissal and cadence?
	 * Cadence 0 means "show every session" (re-shown regardless of meta);
	 * JS layers handle within-session dedup.
	 *
	 * @param int|null $dismissed_at Stored dismissal unix timestamp, or null.
	 * @param int      $cadence_secs Cadence window in seconds (0 = every session).
	 * @param int|null $now          Optional "now" timestamp for testing.
	 */
	public static function evaluate_show( ?int $dismissed_at, int $cadence_secs, ?int $now = null ): bool {
		if ( null === $dismissed_at || $dismissed_at <= 0 ) {
			return true;
		}
		if ( 0 === $cadence_secs ) {
			return true;
		}
		$now ??= time();
		return ( $now - $dismissed_at ) > $cadence_secs;
	}

	/**
	 * Banner cadence in seconds.
	 *
	 * @param array<string,mixed> $expiry_state State.
	 */
	public static function banner_cadence_seconds( array $expiry_state ): int {
		$state = $expiry_state['state'] ?? '';
		if ( Expiry_Data::STATE_EXPIRED === $state ) {
			return 7 * DAY_IN_SECONDS;
		}
		if ( Expiry_Data::STATE_EXPIRED_GRACE === $state ) {
			return 0;
		}
		$days_remaining = isset( $expiry_state['days_remaining'] ) ? (int) $expiry_state['days_remaining'] : 0;
		if ( $days_remaining <= self::FINAL_WINDOW_DAYS ) {
			return 0;
		}
		if ( $days_remaining <= Expiry_Data::ANNUAL_NOTICE_DAYS ) {
			return 7 * DAY_IN_SECONDS;
		}
		return 30 * DAY_IN_SECONDS;
	}

	/**
	 * Modal cadence in seconds.
	 *
	 * @param array<string,mixed> $expiry_state State.
	 */
	public static function modal_cadence_seconds( array $expiry_state ): int {
		$grace_days_left = isset( $expiry_state['grace_days_left'] ) ? (int) $expiry_state['grace_days_left'] : 0;
		if ( $grace_days_left <= self::FINAL_WINDOW_DAYS ) {
			return 0;
		}
		return 7 * DAY_IN_SECONDS;
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
