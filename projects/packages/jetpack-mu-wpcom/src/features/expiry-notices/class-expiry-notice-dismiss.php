<?php
/**
 * Expiry_Notice_Dismiss: who has already closed which expiry notice.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices;

/**
 * Dismissals live in user meta written through core's `/wp/v2/users/me`, so
 * wp-admin and the front end read and write the same record.
 *
 * The `META_*` constants are base names; the stored key is per site (see meta_key()).
 */
class Expiry_Notice_Dismiss {

	// One key for every banner surface.
	const META_BANNER = 'wpcom_plan_expiry_notice_dismiss';
	const META_MODAL  = 'wpcom_plan_expiry_modal_dismiss';
	// Separate from META_MODAL: a grace dismissal is stamped after `expiry_ts`
	// and would otherwise satisfy the post-grace check for a modal never seen.
	const META_MODAL_GRACE = 'wpcom_plan_expiry_modal_dismiss_grace';

	const FINAL_WINDOW_DAYS = 7;

	// Stands in for the "browser session" the design asks for: wp-admin and
	// Calypso are separate origins, so the dismissal has to live server-side.
	const MODAL_GRACE_DISMISS_TTL = DAY_IN_SECONDS;

	/**
	 * Register the dismiss meta keys for REST writes by the user themselves.
	 *
	 * The stored value is always the server's clock, whatever the client sent:
	 * it is compared against the term's expiry to tell one lapse from the next.
	 */
	public static function register_user_meta(): void {
		foreach ( array( self::META_BANNER, self::META_MODAL, self::META_MODAL_GRACE ) as $base ) {
			register_meta(
				'user',
				self::meta_key( $base ),
				array(
					'show_in_rest'      => true,
					'single'            => true,
					'type'              => 'integer',
					'sanitize_callback' => static function () {
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
	 * The stored meta key for a base name, prefixed per site the way core
	 * keys per-site user settings: on Simple every site shares one usermeta
	 * table, and a dismissal on one site must not silence another.
	 *
	 * @param string $base One of the `META_*` constants.
	 */
	public static function meta_key( string $base ): string {
		global $wpdb;
		return $wpdb->get_blog_prefix() . $base;
	}

	/**
	 * The key the banner dismisses to.
	 */
	public static function banner_meta_key(): string {
		return self::meta_key( self::META_BANNER );
	}

	/**
	 * Whether the banner for this state can be dismissed at all.
	 *
	 * Only once the revert has happened: before that the site still has
	 * something to lose.
	 *
	 * @param array<string,mixed> $expiry_state State from Expiry_Data::get_expiry_state().
	 */
	public static function is_dismissible( array $expiry_state ): bool {
		return Expiry_Data::STATE_EXPIRED === ( $expiry_state['state'] ?? '' );
	}

	/**
	 * Whether the banner should show for this user right now.
	 *
	 * @param array<string,mixed> $expiry_state State from Expiry_Data::get_expiry_state().
	 * @param int|null            $user_id      Defaults to the current user.
	 */
	public static function should_show_banner( array $expiry_state, ?int $user_id = null ): bool {
		return ! self::is_dismissible( $expiry_state )
			|| ! self::is_dismissed( $user_id, self::banner_meta_key(), self::term_expiry_ts( $expiry_state ) );
	}

	/**
	 * Whether the modal should show for this user right now.
	 *
	 * @param array<string,mixed> $expiry_state State from Expiry_Data::get_expiry_state().
	 * @param int|null            $user_id      Defaults to the current user.
	 */
	public static function should_show_modal( array $expiry_state, ?int $user_id = null ): bool {
		$dismissal = self::modal_dismissal( $expiry_state );
		if ( null === $dismissal ) {
			return false;
		}
		return ! self::is_dismissed( $user_id, $dismissal['key'], self::term_expiry_ts( $expiry_state ), $dismissal['ttl'] );
	}

	/**
	 * The meta key the modal dismisses to in this state, or null where it never shows.
	 *
	 * @param array<string,mixed> $expiry_state State from Expiry_Data::get_expiry_state().
	 */
	public static function modal_meta_key( array $expiry_state ): ?string {
		return self::modal_dismissal( $expiry_state )['key'] ?? null;
	}

	/**
	 * How the modal dismisses in this state: in grace it comes back after a
	 * day, after the revert saying so once is enough.
	 *
	 * @param array<string,mixed> $expiry_state State from Expiry_Data::get_expiry_state().
	 * @return array{key:string,ttl:int|null}|null
	 */
	private static function modal_dismissal( array $expiry_state ): ?array {
		switch ( $expiry_state['state'] ?? '' ) {
			case Expiry_Data::STATE_EXPIRED_GRACE:
				return array(
					'key' => self::meta_key( self::META_MODAL_GRACE ),
					'ttl' => self::MODAL_GRACE_DISMISS_TTL,
				);
			case Expiry_Data::STATE_EXPIRED:
				return array(
					'key' => self::meta_key( self::META_MODAL ),
					'ttl' => null,
				);
			default:
				return null;
		}
	}

	/**
	 * Whether this user has dismissed the notice for the term the state describes.
	 *
	 * A stamp older than the term's own expiry belongs to a purchase since
	 * renewed and does not count: nothing is dismissible until 30 days past
	 * expiry, so a dismissal of the current term is always the later one.
	 *
	 * @param int|null $user_id   Defaults to the current user.
	 * @param string   $meta_key  A stored key, from meta_key().
	 * @param int|null $expiry_ts Expiry of the term being judged; null counts any stored dismissal.
	 * @param int|null $ttl       Seconds a dismissal holds for; null never lapses.
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
	 * The expiry timestamp a state carries, or null when it has none.
	 *
	 * @param array<string,mixed> $expiry_state State from Expiry_Data::get_expiry_state().
	 */
	private static function term_expiry_ts( array $expiry_state ): ?int {
		return isset( $expiry_state['expiry_ts'] ) ? (int) $expiry_state['expiry_ts'] : null;
	}

	/**
	 * The stored dismissal timestamp, or null if none.
	 *
	 * @param int|null $user_id  Defaults to the current user.
	 * @param string   $meta_key A stored key, from meta_key().
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
