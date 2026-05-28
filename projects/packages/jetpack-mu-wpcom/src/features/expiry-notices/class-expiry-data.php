<?php
/**
 * Expiry_Data: derives plan-expiry state from the site's active purchases.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices;

/**
 * Reads purchases and computes a normalized expiry state for the primary plan.
 */
class Expiry_Data {

	const STATE_ACTIVE        = 'active';
	const STATE_APPROACHING   = 'approaching_expiry';
	const STATE_EXPIRED_GRACE = 'expired_grace';
	const STATE_EXPIRED       = 'expired';

	const GRACE_PERIOD_DAYS      = 30;
	const POST_GRACE_PERIOD_DAYS = 30;
	const ANNUAL_NOTICE_DAYS     = 60;
	const MONTHLY_NOTICE_DAYS    = 7;

	/**
	 * Return the expiry state for the current site, or null if there's no
	 * notice-eligible plan purchase.
	 *
	 * @return array<string,mixed>|null
	 */
	public static function get_expiry_state(): ?array {
		$purchases = wpcom_expiry_get_purchases();
		$plan      = self::pick_primary_plan_purchase( $purchases );
		if ( null === $plan ) {
			return null;
		}
		return self::compute_state_from_purchase( $plan );
	}

	/**
	 * Pick the plan purchase with the latest expiry. Non-plan purchases
	 * (addons, domains) are filtered out.
	 *
	 * @param array<int,object>|null $purchases List of purchase objects.
	 * @return object|null
	 */
	public static function pick_primary_plan_purchase( $purchases ): ?object {
		if ( empty( $purchases ) ) {
			return null;
		}

		$plans = array_filter( (array) $purchases, array( self::class, 'is_plan_purchase' ) );
		if ( empty( $plans ) ) {
			return null;
		}

		usort(
			$plans,
			static function ( $a, $b ): int {
				return strtotime( $b->expiry_date ) <=> strtotime( $a->expiry_date );
			}
		);

		return reset( $plans );
	}

	/**
	 * True if the purchase looks like a site plan, as opposed to an addon or domain.
	 *
	 * Primary signal is `product_type === 'bundle'`. Falls back to slug-based
	 * inference for fixtures missing product_type.
	 *
	 * @param object $purchase Purchase object.
	 */
	public static function is_plan_purchase( $purchase ): bool {
		if ( isset( $purchase->product_type ) && 'bundle' === $purchase->product_type ) {
			return true;
		}
		if ( isset( $purchase->product_slug ) ) {
			return null !== self::infer_plan_class_from_slug( (string) $purchase->product_slug );
		}
		return false;
	}

	/**
	 * Pure: derive normalized state from a single plan purchase. Tests can pass
	 * $now to avoid clock issues.
	 *
	 * @param object   $purchase Purchase object (see wpcom_get_site_purchases() shape).
	 * @param int|null $now      Optional "now" timestamp. Defaults to time().
	 * @return array<string,mixed>|null
	 */
	public static function compute_state_from_purchase( $purchase, ?int $now = null ): ?array {
		if ( empty( $purchase->expiry_date ) || empty( $purchase->product_slug ) ) {
			return null;
		}

		$expiry_ts = strtotime( (string) $purchase->expiry_date );
		if ( false === $expiry_ts ) {
			return null;
		}

		$now          ??= time();
		$days_remaining = (int) floor( ( $expiry_ts - $now ) / DAY_IN_SECONDS );
		$product_slug   = (string) $purchase->product_slug;
		$plan_name      = self::derive_plan_name( $product_slug );
		$is_monthly     = self::is_monthly_plan( $product_slug );
		// Simple sites populate `user_allows_auto_renew`; Atomic sites (synced
		// via Atomic_Persistent_Data::WPCOM_PURCHASES) populate `auto_renew`.
		$auto_renew = ! empty( $purchase->user_allows_auto_renew ?? $purchase->auto_renew ?? null );
		$is_atomic  = defined( 'IS_ATOMIC' ) && IS_ATOMIC;

		if ( $days_remaining >= 0 ) {
			$notice_window   = $is_monthly ? self::MONTHLY_NOTICE_DAYS : self::ANNUAL_NOTICE_DAYS;
			$state           = ( $days_remaining <= $notice_window && ! $auto_renew )
				? self::STATE_APPROACHING
				: self::STATE_ACTIVE;
			$grace_days_left = null;
		} else {
			$days_past = abs( $days_remaining );
			if ( $days_past >= self::GRACE_PERIOD_DAYS + self::POST_GRACE_PERIOD_DAYS ) {
				return null;
			}
			if ( $days_past < self::GRACE_PERIOD_DAYS ) {
				$state           = self::STATE_EXPIRED_GRACE;
				$grace_days_left = self::GRACE_PERIOD_DAYS - $days_past;
			} else {
				$state           = self::STATE_EXPIRED;
				$grace_days_left = 0;
			}
		}

		return array(
			'state'           => $state,
			'expiry_date'     => (string) $purchase->expiry_date,
			'expiry_ts'       => $expiry_ts,
			'days_remaining'  => $days_remaining,
			'grace_days_left' => $grace_days_left,
			'is_atomic'       => $is_atomic,
			'is_monthly'      => $is_monthly,
			'plan_name'       => $plan_name,
			'product_slug'    => $product_slug,
			'auto_renew'      => $auto_renew,
		);
	}

	/**
	 * Resolve the canonical localized short name for a plan slug. Returns null
	 * if the Plans package isn't loaded (i.e. outside wpcom contexts).
	 *
	 * @param string $slug Product slug.
	 */
	public static function derive_plan_name( string $slug ): ?string {
		if ( '' === $slug || ! class_exists( '\Automattic\Jetpack\Plans' ) ) {
			return null;
		}
		$short_name = \Automattic\Jetpack\Plans::get_plan_short_name( $slug );
		return is_string( $short_name ) && '' !== $short_name ? $short_name : null;
	}

	/**
	 * Map a product slug to one of the canonical plan classes
	 * ('personal' / 'premium' / 'business' / 'commerce' / 'pro') or null when
	 * the slug doesn't match a plan.
	 *
	 * @param string $slug Product slug.
	 */
	private static function infer_plan_class_from_slug( string $slug ): ?string {
		if ( '' === $slug ) {
			return null;
		}
		if ( false !== strpos( $slug, 'personal' ) ) {
			return 'personal';
		}
		if ( false !== strpos( $slug, 'value_bundle' ) || 'bundle_pro' === $slug || false !== strpos( $slug, 'premium' ) ) {
			return 'premium';
		}
		if ( false !== strpos( $slug, 'ecommerce' ) || false !== strpos( $slug, 'commerce' ) ) {
			return 'commerce';
		}
		if ( false !== strpos( $slug, 'business' ) ) {
			return 'business';
		}
		if ( false !== strpos( $slug, 'pro' ) ) {
			return 'pro';
		}
		return null;
	}

	/**
	 * True if the slug refers to a monthly cadence plan.
	 *
	 * @param string $slug Product slug.
	 */
	public static function is_monthly_plan( string $slug ): bool {
		return false !== stripos( $slug, 'monthly' );
	}

	/**
	 * Build CTA URLs for the current expiry state.
	 *
	 * @param array<string,mixed> $state       State as produced by compute_state_from_purchase().
	 * @param string              $redirect_to Optional URL appended to the primary CTA so checkout
	 *                                         can return the user to where they came from.
	 * @return array{primary:array{label:string,url:string},secondary:array{label:string,url:string}}
	 */
	public static function get_cta_urls( array $state, string $redirect_to = '' ): array {
		$domain = (string) wpcom_get_site_slug();
		$slug   = isset( $state['product_slug'] ) ? (string) $state['product_slug'] : '';

		$primary = array(
			'label' => __( 'Renew now', 'jetpack-mu-wpcom' ),
			'url'   => sprintf( 'https://wordpress.com/checkout/%s/%s', $slug, $domain ),
		);
		if ( '' !== $redirect_to ) {
			$primary['url'] = add_query_arg( 'redirect_to', $redirect_to, $primary['url'] );
		}

		$secondary = array(
			'label' => __( 'View other plans', 'jetpack-mu-wpcom' ),
			'url'   => sprintf( 'https://wordpress.com/plans/%s', $domain ),
		);

		return array(
			'primary'   => $primary,
			'secondary' => $secondary,
		);
	}
}
