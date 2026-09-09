<?php
/**
 * Expiry_Data: derives plan-expiry state from the site's active purchases.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices;

require_once __DIR__ . '/class-expiry-wpcom.php';

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
	 * The expiry state for the current site, or null if there's no
	 * notice-eligible plan purchase.
	 *
	 * @return array<string,mixed>|null
	 */
	public static function get_expiry_state(): ?array {
		$plan = self::pick_primary_plan_purchase( wpcom_expiry_get_purchases() );
		return null === $plan ? null : self::compute_state_from_purchase( $plan );
	}

	/**
	 * The plan purchase with the latest expiry; add-ons and domains are skipped.
	 *
	 * @param array<int,object>|null $purchases List of purchase objects.
	 * @return object|null
	 */
	public static function pick_primary_plan_purchase( $purchases ): ?object {
		$plans = array_filter( (array) $purchases, array( self::class, 'is_plan_purchase' ) );
		if ( empty( $plans ) ) {
			return null;
		}

		usort(
			$plans,
			static function ( $a, $b ): int {
				return strtotime( (string) ( $b->expiry_date ?? '' ) ) <=> strtotime( (string) ( $a->expiry_date ?? '' ) );
			}
		);

		return reset( $plans );
	}

	/**
	 * Whether the purchase is a site plan rather than an add-on or domain.
	 *
	 * The slug is only consulted for a purchase synced without a product type:
	 * matching on it alone would take "sensei_pro" or "woocommerce_*" for a plan.
	 *
	 * @param object $purchase Purchase object.
	 */
	public static function is_plan_purchase( $purchase ): bool {
		if ( ! empty( $purchase->product_type ) ) {
			return 'bundle' === $purchase->product_type;
		}
		return isset( $purchase->product_slug )
			&& null !== self::infer_plan_class_from_slug( (string) $purchase->product_slug );
	}

	/**
	 * The normalized state of one plan purchase, or null when it is unusable or
	 * too long expired to say anything about.
	 *
	 * @param object   $purchase Purchase object (see wpcom_get_site_purchases() shape).
	 * @param int|null $now      Timestamp to judge against. Defaults to time().
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
		$is_monthly     = false !== stripos( $product_slug, 'monthly' );

		if ( $days_remaining < 0 ) {
			$days_past = -$days_remaining;
			if ( $days_past >= self::GRACE_PERIOD_DAYS + self::POST_GRACE_PERIOD_DAYS ) {
				return null;
			}
			$state = $days_past < self::GRACE_PERIOD_DAYS ? self::STATE_EXPIRED_GRACE : self::STATE_EXPIRED;
		}

		// The raw flag is the customer's intent and stays on for a subscription
		// billing can no longer charge. The effective answer is a store query on
		// Simple, so it is only asked inside this plan's own notice window.
		$raw_auto_renew  = ! empty( $purchase->user_allows_auto_renew ?? $purchase->auto_renew ?? null );
		$in_notice_range = $days_remaining <= ( $is_monthly ? self::MONTHLY_NOTICE_DAYS : self::ANNUAL_NOTICE_DAYS );
		$will_renew      = $in_notice_range
			? ( self::might_still_auto_renew( $purchase ) ?? $raw_auto_renew )
			: $raw_auto_renew;

		if ( $days_remaining >= 0 ) {
			if ( ! $in_notice_range ) {
				$state = self::STATE_ACTIVE;
			} elseif ( ! $will_renew ) {
				$state = self::STATE_APPROACHING;
			} else {
				// A plan still expected to renew has nothing to hear until a
				// scheduled attempt has passed without renewing it. Monthly terms
				// attempt only on the expiry date itself, so they never do.
				$attempt_has_failed = ! $is_monthly && self::is_past_first_auto_renew_attempt( $purchase, $now );
				$state              = $attempt_has_failed ? self::STATE_APPROACHING : self::STATE_ACTIVE;
			}
		}

		return array(
			'state'           => $state,
			'expiry_ts'       => $expiry_ts,
			'days_remaining'  => $days_remaining,
			// Only once there is something to say: on Atomic the name is a request.
			'plan_name'       => self::STATE_ACTIVE === $state ? null : self::derive_plan_name( $product_slug ),
			'product_slug'    => $product_slug,
			// Empty on an Atomic site whose synced purchases predate the field.
			'subscription_id' => isset( $purchase->subscription_id ) && is_scalar( $purchase->subscription_id ) ? (string) $purchase->subscription_id : '',
			// Whether a renewal is still expected, once past active; outside the
			// notice window this is the raw flag. Don't trust it on an active plan.
			'auto_renew'      => $will_renew,
		);
	}

	/**
	 * Whether billing still expects to renew this purchase, or null when the
	 * purchase shape cannot say (Atomic purchases synced before it existed).
	 *
	 * @param object $purchase Purchase object.
	 */
	private static function might_still_auto_renew( $purchase ): ?bool {
		if ( ! method_exists( $purchase, 'might_still_auto_renew' ) ) {
			return null;
		}
		$might_still_auto_renew = $purchase->might_still_auto_renew();
		return is_bool( $might_still_auto_renew ) ? $might_still_auto_renew : null;
	}

	/**
	 * Whether the first scheduled auto-renewal attempt is behind us.
	 *
	 * A date compared to our clock, not a synced boolean: Atomic purchases stay
	 * frozen until the next subscription event. Unknown reads as not yet.
	 *
	 * @param object $purchase Purchase object.
	 * @param int    $now      Timestamp to compare against.
	 */
	private static function is_past_first_auto_renew_attempt( $purchase, int $now ): bool {
		if ( ! method_exists( $purchase, 'first_auto_renew_attempt_date' ) ) {
			return false;
		}

		$attempt_date = $purchase->first_auto_renew_attempt_date();
		if ( ! is_string( $attempt_date ) || '' === $attempt_date ) {
			return false;
		}

		$attempt_ts = strtotime( $attempt_date );
		return false !== $attempt_ts && $attempt_ts < $now;
	}

	/**
	 * The plan's localized short name, or null where the Plans package can't say.
	 *
	 * Remembered per locale: on Atomic the Plans package fetches the whole plan
	 * list from WordPress.com to answer, and on Simple it loads the billing stack.
	 *
	 * @param string $slug Product slug.
	 */
	public static function derive_plan_name( string $slug ): ?string {
		if ( '' === $slug || ! class_exists( '\Automattic\Jetpack\Plans' ) ) {
			return null;
		}
		return Expiry_Wpcom::remember(
			'wpcom_expiry_notices_plan_name_' . $slug . '_' . get_user_locale(),
			static function () use ( $slug ): ?string {
				$short_name = \Automattic\Jetpack\Plans::get_plan_short_name( $slug );
				return is_string( $short_name ) && '' !== $short_name ? $short_name : null;
			}
		);
	}

	/**
	 * The canonical plan class a slug belongs to, or null when it isn't a plan.
	 *
	 * @param string $slug Product slug.
	 * @return string|null One of 'personal', 'premium', 'business', 'commerce', 'pro'.
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
	 * Storage included with the plan, in GB, or null when unknown. Mirrors
	 * Calypso's plan-expiry-notice storage map so both quote the same figure.
	 *
	 * @param string $slug Product slug.
	 */
	public static function get_plan_storage_gb( string $slug ): ?int {
		$storage_by_class = array(
			'personal' => 6,
			'premium'  => 13,
			'business' => 50,
			'commerce' => 50,
		);
		return $storage_by_class[ self::infer_plan_class_from_slug( $slug ) ?? '' ] ?? null;
	}

	/**
	 * CTA URLs for the current expiry state.
	 *
	 * @param array<string,mixed> $state       State as produced by compute_state_from_purchase().
	 * @param string              $redirect_to Optional URL checkout returns the user to.
	 * @return array{primary:array{label:string,url:string},secondary:array{label:string,url:string}}
	 */
	public static function get_cta_urls( array $state, string $redirect_to = '' ): array {
		$domain          = (string) wpcom_get_site_slug();
		$slug            = isset( $state['product_slug'] ) ? (string) $state['product_slug'] : '';
		$subscription_id = isset( $state['subscription_id'] ) ? (string) $state['subscription_id'] : '';

		// Naming the subscription makes checkout a renewal the cart refuses for
		// anyone but its owner; the plain form would quietly become a second
		// purchase of the plan for another admin.
		$primary = array(
			'label' => __( 'Renew now', 'jetpack-mu-wpcom' ),
			'url'   => '' === $subscription_id
				? sprintf( 'https://wordpress.com/checkout/%s/%s', $slug, $domain )
				: sprintf( 'https://wordpress.com/checkout/%s/renew/%s/%s', $slug, $subscription_id, $domain ),
		);
		// add_query_arg() does not encode, and a redirect with a query of its
		// own would hand checkout the second half as parameters.
		if ( '' !== $redirect_to ) {
			$primary['url'] = add_query_arg( 'redirect_to', rawurlencode( $redirect_to ), $primary['url'] );
		}

		return array(
			'primary'   => $primary,
			'secondary' => array(
				'label' => __( 'View other plans', 'jetpack-mu-wpcom' ),
				'url'   => sprintf( 'https://wordpress.com/plans/%s', $domain ),
			),
		);
	}
}
