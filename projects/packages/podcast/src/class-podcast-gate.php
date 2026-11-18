<?php
/**
 * Podcast product-access gate.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast;

use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\My_Jetpack\Products as My_Jetpack_Products;
use Automattic\Jetpack\My_Jetpack\Wpcom_Products;
use Automattic\Jetpack\Status\Host;

/**
 * Premium podcast feature gate (dashboard, stats, episode block). Two paths:
 *
 * - WordPress.com (Simple/WoA): the `podcasting` plan feature via
 *   `Current_Plan::supports`, plus the launch-day grandfather rule. Request-
 *   scoped, so gating another blog needs `switch_to_blog` first.
 * - Self-hosted Jetpack: a Growth/Complete purchase over the connection
 *   (PODS-123). Only consulted in admin/editor contexts.
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
	 * Transient holding the cached `/upgrades` response. Short-lived (30s): dedupes
	 * the lookup across the successive editor/admin loads that consult the gate,
	 * without a synchronous WPCOM request on each one.
	 */
	const PURCHASES_TRANSIENT = 'jetpack_podcast_site_purchases';

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
	 * The plan slug offered by the editor's upgrade prompt.
	 *
	 * @return string
	 */
	public static function get_required_plan_slug(): string {
		if ( ( new Host() )->is_wpcom_platform() ) {
			return 'value_bundle';
		}
		if ( method_exists( My_Jetpack_Products::class, 'get_bundle_offer' ) ) {
			return My_Jetpack_Products::get_bundle_offer( 'growth' )['wpcom_product_slug'] ?? '';
		}
		return 'jetpack_growth_yearly';
	}

	/**
	 * Whether a self-hosted site owns a Growth/Complete plan. Matches purchased
	 * product slugs, not the `podcasting` feature (which is true for every Jetpack
	 * site on WordPress.com and can't tell free from paid here).
	 */
	private static function self_hosted_has_paid_plan(): bool {
		foreach ( self::get_site_current_purchases() as $purchase ) {
			$slug = is_array( $purchase ) && isset( $purchase['product_slug'] ) ? $purchase['product_slug'] : '';

			// Prefix match so every Growth/Complete billing term counts.
			foreach ( array( 'jetpack_growth', 'jetpack_complete', 'jetpack_pro_' ) as $prefix ) {
				if ( is_string( $slug ) && 0 === strpos( $slug, $prefix ) ) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * The site's current purchases from WordPress.com (`/upgrades`). Cached in a
	 * short transient so successive gate checks don't each fire a WPCOM request.
	 * Fails closed to an empty list on any error, without caching it, so the next
	 * request retries rather than serving a stale empty.
	 *
	 * @return array Purchase entries; empty on failure.
	 */
	private static function get_site_current_purchases(): array {
		$cached = get_transient( self::PURCHASES_TRANSIENT );
		if ( is_array( $cached ) ) {
			return $cached;
		}

		// My Jetpack reads the same list on the Podcast page, so reuse its request; the round trip turns its objects into arrays.
		$purchases = Wpcom_Products::get_site_current_purchases();
		$decoded   = is_array( $purchases ) ? json_decode( wp_json_encode( $purchases, JSON_UNESCAPED_SLASHES ), true ) : null;

		if ( ! is_array( $decoded ) ) {
			return array();
		}

		set_transient( self::PURCHASES_TRANSIENT, $decoded, 30 );
		return $decoded;
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
