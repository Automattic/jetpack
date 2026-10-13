<?php
/**
 * Which paid Stats features the site's plan lacks, following classic Stats' gates (STATS-508).
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Status\Host;

/**
 * Filter overriding the Stats plan tier.
 *
 * @var string
 */
const STATS_PLAN_TIER_FILTER = 'jetpack_premium_analytics_stats_plan_tier';

const STATS_TIER_COMMERCIAL   = 'commercial';
const STATS_TIER_LEGACY_FREE  = 'legacy-free';
const STATS_TIER_PAID         = 'paid';
const STATS_TIER_LEGACY_BASIC = 'legacy-basic';
const STATS_TIER_FREE         = 'free';
const STATS_TIER_JETPACK_FREE = 'jetpack-free';
const STATS_TIER_UNKNOWN      = 'unknown';

/**
 * Jetpack products that support commercial use. PWYW and Free Stats do not.
 */
const JETPACK_STATS_COMMERCIAL_PRODUCTS = array( 'jetpack_stats_monthly', 'jetpack_stats_yearly', 'jetpack_stats_bi_yearly' );

/**
 * Jetpack plan families that bundle commercial Stats.
 */
const JETPACK_STATS_COMMERCIAL_PLAN_PREFIXES = array( 'jetpack_business', 'jetpack_complete', 'jetpack_growth' );

/**
 * The Stats plan tier the dashboard is gated by.
 *
 * @since $$next-version$$
 *
 * @return string One of the STATS_TIER_* values.
 */
function get_stats_plan_tier() {
	$host = new Host();

	if ( $host->is_wpcom_platform() ) {
		$tier = get_wpcom_stats_plan_tier( $host->is_woa_site() );
	} elseif ( $host->is_vip_site() || has_jetpack_stats_commercial_purchase() ) {
		$tier = STATS_TIER_COMMERCIAL;
	} else {
		$tier = STATS_TIER_JETPACK_FREE;
	}

	/**
	 * Filters the Stats plan tier Premium Analytics gates the dashboard by.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $tier One of the STATS_TIER_* values; `unknown` gates nothing.
	 */
	return (string) apply_filters( STATS_PLAN_TIER_FILTER, $tier );
}

/**
 * The tier of a WordPress.com site, from its stats feature.
 *
 * @since $$next-version$$
 *
 * @param bool $is_atomic Whether the site is Atomic.
 * @return string One of the STATS_TIER_* values.
 */
function get_wpcom_stats_plan_tier( $is_atomic ) {
	if ( ! function_exists( 'wpcom_site_has_feature' ) ) {
		return STATS_TIER_UNKNOWN;
	}

	// Unsynced Atomic data reads like a site that bought nothing; see Current_Plan::get_wpcom_site_specific_features().
	if ( $is_atomic && function_exists( 'wpcom_get_site_purchases' ) && ! \wpcom_get_site_purchases() ) {
		return STATS_TIER_UNKNOWN;
	}

	// Calypso's shouldGateStats() order: legacy free outranks paid.
	$tiers = array(
		'stats-commercial' => STATS_TIER_COMMERCIAL,
		'stats-free'       => STATS_TIER_LEGACY_FREE,
		'stats-paid'       => STATS_TIER_PAID,
		'stats-basic'      => STATS_TIER_LEGACY_BASIC,
	);
	foreach ( $tiers as $feature => $tier ) {
		if ( \wpcom_site_has_feature( $feature ) ) {
			return $tier;
		}
	}

	return STATS_TIER_FREE;
}

/**
 * Whether a self-hosted site owns a purchase that supports commercial use, from the cached plan options.
 *
 * @since $$next-version$$
 *
 * @return bool
 */
function has_jetpack_stats_commercial_purchase() {
	$plan     = get_option( 'jetpack_active_plan', array() );
	$plan     = is_array( $plan ) ? $plan : array();
	$products = get_option( 'jetpack_site_products', array() );
	$products = is_array( $products ) ? $products : array();

	$slugs = array_column( array_filter( $products, 'is_array' ), 'product_slug' );
	if ( isset( $plan['product_slug'] ) ) {
		$slugs[] = $plan['product_slug'];
	}

	foreach ( array_filter( $slugs, 'is_string' ) as $slug ) {
		if ( in_array( $slug, JETPACK_STATS_COMMERCIAL_PRODUCTS, true ) ) {
			return true;
		}
		foreach ( JETPACK_STATS_COMMERCIAL_PLAN_PREFIXES as $prefix ) {
			if ( 0 === strpos( $slug, $prefix ) ) {
				return true;
			}
		}
	}

	$active = $plan['features']['active'] ?? array();

	return is_array( $active ) && in_array( 'stats-commercial', $active, true );
}
