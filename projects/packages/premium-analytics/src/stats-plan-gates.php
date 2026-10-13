<?php
/**
 * Which paid Stats features the site's plan lacks, following classic Stats' gates (STATS-508).
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Status;
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

/**
 * The features classic Stats gates on WordPress.com Personal: the newer, commercial modules.
 */
const STATS_COMMERCIAL_FEATURES = array( 'authors', 'search-terms', 'videos', 'utm', 'devices', 'regions-cities' );

/**
 * The features gated on legacy-free sites and on self-hosted sites without a commercial purchase (STATS-348).
 */
const STATS_ADVANCED_FEATURES = array( 'utm', 'devices', 'regions-cities' );

/**
 * Widget types that show nothing but a locked feature. Locations is absent: countries and regions lock separately.
 */
const STATS_FEATURE_WIDGET_TYPES = array(
	'top-posts'      => array( 'jpa/stats-top-posts' ),
	'referrers'      => array( 'jpa/referrers' ),
	'clicks'         => array( 'jpa/clicks' ),
	'file-downloads' => array( 'jpa/file-downloads' ),
	'authors'        => array( 'jpa/authors', 'jpa/author-top-posts', 'jpa/author-performance' ),
	'search-terms'   => array( 'jpa/search-terms' ),
	'videos'         => array( 'videopress/top-videos', 'jpa/video-detail-views-performance', 'jpa/video-detail-embeds' ),
	'utm'            => array( 'jpa/utm-insights' ),
	'devices'        => array( 'jpa/devices', 'jpa/top-platforms' ),
	'insights'       => array(
		'jpa/annual-highlights',
		'jpa/all-time-stats',
		'jpa/most-popular-time',
		'jpa/most-popular-day',
		'jpa/popular-post',
		'jpa/latest-post',
		'jpa/posting-activity',
		'jpa/views-over-years',
		'jpa/most-commented-posts',
		'jpa/most-commented-authors',
		'jpa/shares',
		'jpa/tags',
	),
);

/**
 * The features a tier locks.
 *
 * @since $$next-version$$
 *
 * @param string $tier One of the STATS_TIER_* values.
 * @return string[] Feature keys.
 */
function get_locked_stats_features( $tier ) {
	switch ( $tier ) {
		case STATS_TIER_LEGACY_FREE:
		case STATS_TIER_JETPACK_FREE:
			return STATS_ADVANCED_FEATURES;
		case STATS_TIER_PAID:
			return STATS_COMMERCIAL_FEATURES;
		case STATS_TIER_LEGACY_BASIC:
			return array_merge( STATS_COMMERCIAL_FEATURES, array( 'referrers', 'clicks', 'csv', 'intervals', 'long-date-presets' ) );
		case STATS_TIER_FREE:
			return array_merge(
				STATS_COMMERCIAL_FEATURES,
				array( 'top-posts', 'referrers', 'countries', 'clicks', 'file-downloads', 'insights', 'csv', 'intervals', 'recent-7-days' )
			);
		default:
			return array();
	}
}

/**
 * Where to buy a locked feature. Classic Stats' destinations until STATS-522 ships a new one.
 *
 * @since $$next-version$$
 *
 * @param string $feature Feature key.
 * @param string $tier    One of the STATS_TIER_* values.
 * @return string
 */
function get_stats_upgrade_url( $feature, $tier ) {
	$return_path = 'admin.php?page=' . Analytics::MENU_PAGE_SLUG . '&jpa_purchased=1';

	if ( STATS_TIER_JETPACK_FREE === $tier ) {
		$query = http_build_query(
			array(
				'from'         => 'jetpack-premium-analytics',
				'productType'  => 'commercial',
				'redirect_uri' => $return_path,
			),
			'',
			'&',
			PHP_QUERY_RFC3986
		);

		return admin_url( 'admin.php?page=stats#!/stats/purchase/' . (int) \Jetpack_Options::get_option( 'id' ) . '?' . $query );
	}

	$plan      = in_array( $feature, STATS_COMMERCIAL_FEATURES, true ) ? 'premium' : 'personal';
	$site_slug = ( new Status() )->get_site_suffix();

	return 'https://wordpress.com/checkout/' . rawurlencode( $site_slug ) . '/' . $plan . '?redirect_to=' . rawurlencode( admin_url( $return_path ) );
}

/**
 * The gates the client applies: each locked feature's upgrade URL, and each fully locked widget type's feature.
 *
 * @since $$next-version$$
 *
 * @return array{tier:string, locked_features:array<string,string>, locked_widget_types:array<string,string>}
 */
function get_stats_plan_gates() {
	$tier     = get_stats_plan_tier();
	$features = get_locked_stats_features( $tier );

	$locked_features     = array();
	$locked_widget_types = array();
	foreach ( $features as $feature ) {
		$locked_features[ $feature ] = get_stats_upgrade_url( $feature, $tier );
		foreach ( STATS_FEATURE_WIDGET_TYPES[ $feature ] ?? array() as $type ) {
			$locked_widget_types[ $type ] = $feature;
		}
	}

	if ( isset( $locked_features['countries'], $locked_features['regions-cities'] ) ) {
		$locked_widget_types['jpa/locations'] = 'countries';
	}

	return array(
		'tier'                => $tier,
		'locked_features'     => $locked_features,
		'locked_widget_types' => $locked_widget_types,
	);
}

/**
 * Configures the plan gates script data.
 *
 * @since $$next-version$$
 *
 * @return void
 */
function configure_stats_plan_gates() {
	add_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_stats_plan_gates_script_data', 20 );
	add_action( 'admin_init', __NAMESPACE__ . '\\maybe_refresh_plan_after_purchase' );
}

/**
 * Injects the plan gates into JetpackScriptData.
 *
 * @since $$next-version$$
 *
 * @param array $data The script data passed by the assets package.
 * @return array
 */
function inject_stats_plan_gates_script_data( array $data ): array {
	if ( ! isset( $data['premium_analytics'] ) || ! is_array( $data['premium_analytics'] ) ) {
		$data['premium_analytics'] = array();
	}

	$gates = get_stats_plan_gates();

	// Objects, so an empty map reaches JS as `{}` rather than `[]`.
	$data['premium_analytics']['plan_gates'] = array(
		'tier'                => $gates['tier'],
		'locked_features'     => (object) $gates['locked_features'],
		'locked_widget_types' => (object) $gates['locked_widget_types'],
	);

	return $data;
}

/**
 * Refreshes a self-hosted site's cached plan when checkout sends the reader back, so the purchase unlocks at once.
 *
 * @since $$next-version$$
 *
 * @return void
 */
function maybe_refresh_plan_after_purchase() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only trigger: it only re-reads the site's own plan.
	if ( empty( $_GET['jpa_purchased'] ) || ( new Host() )->is_wpcom_platform() ) {
		return;
	}

	$current_plan = 'Automattic\\Jetpack\\Current_Plan';
	if ( ! class_exists( $current_plan ) || ! method_exists( $current_plan, 'refresh_from_wpcom' ) ) {
		return;
	}

	// One remote fetch a minute, however often the flagged URL is reloaded.
	if ( get_transient( 'jetpack_premium_analytics_plan_refreshed' ) ) {
		return;
	}
	set_transient( 'jetpack_premium_analytics_plan_refreshed', 1, MINUTE_IN_SECONDS );

	call_user_func( array( $current_plan, 'refresh_from_wpcom' ) );
}
