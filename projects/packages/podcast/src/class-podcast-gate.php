<?php
/**
 * Podcast product-access gate.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Status\Host;
use Jetpack_Options;

/**
 * Premium podcast feature gate.
 *
 * Resolves the paid surfaces (episode dashboard, stats, episode block) two
 * ways depending on the host:
 *
 * - WordPress.com (Simple/WoA): the `podcasting` plan feature via
 *   `Current_Plan::supports`, plus the launch-day grandfather rule. Reads
 *   request-scoped state, so callers gating a different blog must
 *   `switch_to_blog` first.
 * - Self-hosted Jetpack: the site's purchased plan over the Jetpack
 *   connection. Per PODS-123, the Growth (and Complete) plans unlock the paid
 *   surfaces; everything else is feed-only.
 */
class Podcast_Gate {

	const FEATURE_SLUG = 'podcasting';

	/**
	 * Launch-day cutoff for the paying-blog grandfather rule. Paid blogs
	 * registered before this date keep Premium podcast features without
	 * needing the `podcasting` plan feature. WordPress.com only.
	 */
	const GRANDFATHER_CUTOFF_DATE = '2026-05-18';

	/**
	 * Product-slug prefixes that unlock the paid surfaces on self-hosted
	 * Jetpack. Matched as prefixes so every billing term/tier counts.
	 */
	const PAID_PLAN_SLUG_PREFIXES = array( 'jetpack_growth', 'jetpack_complete' );

	/**
	 * Transient holding the cached `/upgrades` response. Short-lived: long
	 * enough to dedupe across a page load, short enough that a fresh Growth
	 * purchase unlocks the surfaces without a long wait.
	 */
	const PURCHASES_TRANSIENT = 'jetpack_podcast_site_purchases';

	/**
	 * Request-scoped memo of the purchases lookup (including failures, so a
	 * failed fetch isn't retried mid-request). Null until first resolved.
	 *
	 * @var array|null
	 */
	private static $purchases_cache = null;

	/**
	 * Whether the current site can use the paid podcast surfaces.
	 *
	 * @return bool
	 */
	public static function has_product_access(): bool {
		if ( ! ( new Host() )->is_wpcom_platform() ) {
			return self::self_hosted_has_paid_plan();
		}

		$blog_id = get_current_blog_id();
		if ( $blog_id <= 0 ) {
			return false;
		}

		if ( self::is_grandfathered( $blog_id ) ) {
			return true;
		}

		return (bool) Current_Plan::supports( self::FEATURE_SLUG );
	}

	/**
	 * Whether a self-hosted Jetpack site owns a Growth (or Complete) plan.
	 *
	 * Mirrors the bundle-detection pattern used by My Jetpack's Growth/Security
	 * products: match purchased product slugs rather than the `podcasting`
	 * feature, which maps to all Jetpack sites on WordPress.com and so can't
	 * distinguish free from paid here.
	 */
	private static function self_hosted_has_paid_plan(): bool {
		foreach ( self::get_site_current_purchases() as $purchase ) {
			$slug = is_object( $purchase )
				? ( $purchase->product_slug ?? '' )
				: ( $purchase['product_slug'] ?? '' );

			foreach ( self::PAID_PLAN_SLUG_PREFIXES as $prefix ) {
				if ( is_string( $slug ) && 0 === strpos( $slug, $prefix ) ) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * The site's current purchases from WordPress.com (`/upgrades`).
	 *
	 * Fails closed: an unreachable or malformed response returns no purchases
	 * and isn't written to the transient, so the next request retries rather
	 * than serving a stale empty result.
	 *
	 * @return array List of purchase entries (associative arrays); empty on failure.
	 */
	private static function get_site_current_purchases(): array {
		if ( null !== self::$purchases_cache ) {
			return self::$purchases_cache;
		}

		$cached = get_transient( self::PURCHASES_TRANSIENT );
		if ( is_array( $cached ) ) {
			self::$purchases_cache = $cached;
			return self::$purchases_cache;
		}

		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/upgrades?site=%d', (int) Jetpack_Options::get_option( 'id' ) ),
			'1.2'
		);

		if ( is_wp_error( $response ) || 200 !== (int) wp_remote_retrieve_response_code( $response ) ) {
			self::$purchases_cache = array();
			return self::$purchases_cache;
		}

		$decoded = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( ! is_array( $decoded ) ) {
			self::$purchases_cache = array();
			return self::$purchases_cache;
		}

		set_transient( self::PURCHASES_TRANSIENT, $decoded, 5 * MINUTE_IN_SECONDS );
		self::$purchases_cache = $decoded;
		return self::$purchases_cache;
	}

	/**
	 * Whether the blog is grandfathered: registered before the cutoff AND on a paid plan.
	 *
	 * @param int $blog_id Blog ID.
	 */
	protected static function is_grandfathered( int $blog_id ): bool {
		if ( ! function_exists( 'get_blog_details' ) ) {
			return false;
		}
		$details = get_blog_details( $blog_id );
		if ( ! $details || empty( $details->registered ) ) {
			return false;
		}
		$registered_ts = strtotime( $details->registered );
		if ( false === $registered_ts || $registered_ts >= strtotime( self::GRANDFATHER_CUTOFF_DATE ) ) {
			return false;
		}

		$plan = Current_Plan::get();
		return ! empty( $plan['class'] ) && 'free' !== $plan['class'];
	}
}
