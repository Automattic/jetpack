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
	 * The minimum plan slug to upsell: WordPress.com Premium (`value_bundle`) or
	 * Jetpack Growth (`jetpack_growth_yearly`).
	 *
	 * @return string
	 */
	public static function get_required_plan_slug(): string {
		return ( new Host() )->is_wpcom_platform() ? 'value_bundle' : 'jetpack_growth_yearly';
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
			foreach ( array( 'jetpack_growth', 'jetpack_complete' ) as $prefix ) {
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

		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/upgrades?site=%d', (int) Jetpack_Options::get_option( 'id' ) ),
			'1.2',
			array( 'method' => 'GET' )
		);

		if ( is_wp_error( $response ) || 200 !== (int) wp_remote_retrieve_response_code( $response ) ) {
			return array();
		}

		$decoded = json_decode( wp_remote_retrieve_body( $response ), true );
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
