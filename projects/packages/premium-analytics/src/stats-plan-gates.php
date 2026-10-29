<?php
/**
 * Which paid Stats features the site's plan lacks, following classic Stats' gates.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Plans;
use Automattic\Jetpack\PremiumAnalytics\REST\Api_Proxy_Controller;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

// Guarded on a symbol the file declares; see the include block in Analytics::load_dashboard_components().
if ( ! function_exists( __NAMESPACE__ . '\\ensure_widget_registry_ready' ) ) {
	require_once __DIR__ . '/widget-modules.php';
}

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

const STATS_TIERS = array( STATS_TIER_COMMERCIAL, STATS_TIER_LEGACY_FREE, STATS_TIER_PAID, STATS_TIER_LEGACY_BASIC, STATS_TIER_FREE, STATS_TIER_JETPACK_FREE, STATS_TIER_UNKNOWN );

/**
 * Jetpack products that support commercial use. PWYW and Free Stats do not.
 */
const JETPACK_STATS_COMMERCIAL_PRODUCTS = array( 'jetpack_stats_monthly', 'jetpack_stats_yearly', 'jetpack_stats_bi_yearly' );

/**
 * Jetpack plan families that bundle commercial Stats.
 */
const JETPACK_STATS_COMMERCIAL_PLAN_PREFIXES = array( 'jetpack_business', 'jetpack_complete', 'jetpack_growth', 'jetpack_pro' );

/**
 * The Stats plan tier the dashboard is gated by.
 *
 * @since 0.13.0
 *
 * @return string One of the STATS_TIER_* values.
 */
function get_stats_plan_tier() {
	$host = new Host();

	if ( $host->is_wpcom_platform() ) {
		$tier = get_wpcom_stats_plan_tier( $host->is_woa_site() );
	} elseif ( $host->is_vip_site() ) {
		$tier = STATS_TIER_COMMERCIAL;
	} else {
		$tier = get_jetpack_stats_plan_tier();
	}

	/**
	 * Filters the Stats plan tier Premium Analytics gates the dashboard by.
	 *
	 * @since 0.13.0
	 *
	 * @param string $tier One of `commercial`, `legacy-free`, `paid`, `legacy-basic`, `free`, `jetpack-free` or
	 *                     `unknown`, which locks nothing. Any other value is ignored.
	 */
	$filtered = apply_filters( STATS_PLAN_TIER_FILTER, $tier );

	// A misspelled tier would otherwise fall through to `unknown` and unlock every paid feature.
	if ( ! in_array( $filtered, STATS_TIERS, true ) ) {
		// One line: tools/replace-next-version-tag.sh only rewrites the token in a single-line call.
		_doing_it_wrong( __FUNCTION__, esc_html( sprintf( /* translators: %s: Filter name. */ __( 'The %s filter must return one of the STATS_TIER_* values.', 'jetpack-premium-analytics-pkg' ), STATS_PLAN_TIER_FILTER ) ), 'jetpack-premium-analytics-0.13.0' );
		return $tier;
	}

	return $filtered;
}

/**
 * The tier of a WordPress.com site, from its stats feature.
 *
 * @since 0.13.0
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
 * The tier of a self-hosted site, from its cached plan.
 *
 * @since 0.13.0
 *
 * @return string One of the STATS_TIER_* values.
 */
function get_jetpack_stats_plan_tier() {
	if ( ! has_cached_jetpack_plan() ) {
		return STATS_TIER_UNKNOWN;
	}

	return has_jetpack_stats_commercial_purchase() ? STATS_TIER_COMMERCIAL : STATS_TIER_JETPACK_FREE;
}

/**
 * Whether the plan cache holds a plan. An empty one cannot tell a paid site from a free one (STATS-475).
 *
 * @since 0.13.0
 *
 * @return bool
 */
function has_cached_jetpack_plan() {
	$plan = get_option( Current_Plan::PLAN_OPTION );

	return is_array( $plan ) && is_array( $plan['features']['active'] ?? null ) && $plan['features']['active'];
}

/**
 * Whether a self-hosted site's cached plan or products support commercial use.
 *
 * @since 0.13.0
 *
 * @return bool
 */
function has_jetpack_stats_commercial_purchase() {
	$plan     = get_option( Current_Plan::PLAN_OPTION );
	$products = get_option( Current_Plan::SITE_PRODUCTS_OPTION, array() );
	$products = is_array( $products ) ? $products : array();

	$slugs = array_column( $products, 'product_slug' );
	if ( isset( $plan['product_slug'] ) ) {
		$slugs[] = $plan['product_slug'];
	}

	foreach ( $slugs as $slug ) {
		if ( in_array( $slug, JETPACK_STATS_COMMERCIAL_PRODUCTS, true ) ) {
			return true;
		}
		foreach ( JETPACK_STATS_COMMERCIAL_PLAN_PREFIXES as $prefix ) {
			if ( 0 === strpos( $slug, $prefix ) ) {
				return true;
			}
		}
	}

	return in_array( 'stats-commercial', $plan['features']['active'] ?? array(), true );
}

/**
 * Whether a self-hosted site's cached plan or products include any Jetpack Stats product, free or PWYW included.
 *
 * @since 0.14.0
 *
 * @return bool
 */
function has_jetpack_stats_product() {
	$plan     = get_option( Current_Plan::PLAN_OPTION );
	$products = get_option( Current_Plan::SITE_PRODUCTS_OPTION, array() );
	$products = is_array( $products ) ? $products : array();

	$slugs = array_column( $products, 'product_slug' );
	if ( isset( $plan['product_slug'] ) ) {
		$slugs[] = $plan['product_slug'];
	}

	foreach ( $slugs as $slug ) {
		if ( is_string( $slug ) && 0 === strpos( $slug, 'jetpack_stats' ) ) {
			return true;
		}
	}

	return false;
}

/**
 * Tiers without paid Stats that get the upgrade banner. `free` gets a section upgrade card instead, as in classic Stats,
 * and `unknown` may be a paid site whose plan has not synced.
 */
const STATS_UPGRADE_BANNER_TIERS = array( STATS_TIER_JETPACK_FREE, STATS_TIER_LEGACY_FREE, STATS_TIER_LEGACY_BASIC );

/**
 * Whether the dashboard offers a paid Stats plan: the tier gets the upgrade banner, the site has no Stats PWYW, and the site first opened the dashboard at least 30 days ago.
 *
 * @since 0.14.0
 *
 * @param string $tier One of the STATS_TIER_* values.
 * @return bool
 */
function offers_free_site_upgrade( $tier ) {
	// Stats offers Simple sites this banner under rules of their own, which are not ported here.
	if ( ! in_array( $tier, STATS_UPGRADE_BANNER_TIERS, true ) || ( new Host() )->is_wpcom_simple() ) {
		return false;
	}

	// Stats treats PWYW as paid and stops its upgrade prompts.
	$products = get_option( Current_Plan::SITE_PRODUCTS_OPTION, array() );
	if ( is_array( $products ) && in_array( 'jetpack_stats_pwyw_yearly', array_column( $products, 'product_slug' ), true ) ) {
		return false;
	}

	$first_visit = get_dashboard_first_visit();

	return null !== $first_visit && time() - $first_visit >= 30 * DAY_IN_SECONDS;
}

/**
 * The features classic Stats gates on WordPress.com Personal: the newer, commercial modules.
 */
const STATS_COMMERCIAL_FEATURES = array( 'authors', 'search-terms', 'videos', 'utm', 'devices', 'regions-cities' );

/**
 * The features gated on legacy-free sites and on self-hosted sites without a commercial purchase.
 */
const STATS_ADVANCED_FEATURES = array( 'utm', 'devices', 'regions-cities' );

/**
 * The features a tier locks.
 *
 * @since 0.13.0
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
				array( 'top-posts', 'referrers', 'countries', 'clicks', 'file-downloads', 'insights', 'tags', 'csv', 'intervals', 'long-date-presets', 'recent-7-days' )
			);
		default:
			return array();
	}
}

/**
 * The dashboard sections a tier replaces with one upgrade prompt, as classic Stats replaces its Insights and Traffic pages.
 *
 * @since 0.14.0
 *
 * @param string $tier One of the STATS_TIER_* values.
 * @return string[] Section slugs.
 */
function get_locked_stats_sections( $tier ) {
	return STATS_TIER_FREE === $tier ? array( 'traffic', 'insights' ) : array();
}

/**
 * What a locked section's upgrade prompt says: classic Stats' upsell, with and without its price.
 *
 * @since 0.14.0
 *
 * @param string $section Section slug.
 * @return array{title:string, description:string, description_with_price:string, features:string[], upgrade_label:string, expand_label:string, support_url:string} The copy.
 */
function get_stats_section_copy( $section ) {
	$plan_features = array(
		__( 'Keep your data private and GDPR-compliant', 'jetpack-premium-analytics-pkg' ),
		__( '14-day money-back guarantee', 'jetpack-premium-analytics-pkg' ),
		__( '6 GB storage', 'jetpack-premium-analytics-pkg' ),
		__( 'Unlimited pages, posts, users, and visitors', 'jetpack-premium-analytics-pkg' ),
		__( 'Free domain for one year', 'jetpack-premium-analytics-pkg' ),
		__( 'Ad-free browsing experience for your visitors', 'jetpack-premium-analytics-pkg' ),
		__( 'All premium themes', 'jetpack-premium-analytics-pkg' ),
		__( 'Fast support from our expert team', 'jetpack-premium-analytics-pkg' ),
		__( 'Customize fonts and colors sitewide', 'jetpack-premium-analytics-pkg' ),
	);

	if ( 'insights' === $section ) {
		$title    = __( 'Unlock site insights', 'jetpack-premium-analytics-pkg' );
		$features = array(
			__( 'Monitor your posting activity', 'jetpack-premium-analytics-pkg' ),
			__( 'Track your all-time highlights and insights', 'jetpack-premium-analytics-pkg' ),
		);
	} else {
		$title    = __( 'Unlock site growth analytics', 'jetpack-premium-analytics-pkg' );
		$features = array(
			__( 'View trends and data from any time period', 'jetpack-premium-analytics-pkg' ),
			__( 'Detailed stats about posts, referrers, clicks and more', 'jetpack-premium-analytics-pkg' ),
		);
	}

	return array(
		'title'                  => $title,
		'description'            => __( 'Get detailed insights into your site’s performance with a Personal plan.', 'jetpack-premium-analytics-pkg' ),
		/* translators: %s: The Personal plan's monthly price, such as $4. Keep the <strong> tags around the price. */
		'description_with_price' => __( 'Get detailed insights into your site’s performance for <strong>%s/month</strong> with a Personal plan.', 'jetpack-premium-analytics-pkg' ),
		'features'               => array_merge( $features, $plan_features ),
		'upgrade_label'          => __( 'Upgrade to Personal', 'jetpack-premium-analytics-pkg' ),
		'expand_label'           => __( 'Show all Personal features', 'jetpack-premium-analytics-pkg' ),
		'support_url'            => 'https://wordpress.com/support/stats/',
	);
}

/**
 * Prefix of the per-user transient that caches the Personal plan's price where looking it up is a WordPress.com request.
 */
const PERSONAL_PLAN_PRICE_TRANSIENT = 'jetpack_premium_analytics_personal_price_';

/**
 * The Personal plan's yearly price in the current user's checkout currency, which a locked section quotes per month.
 *
 * @since $$next-version$$
 *
 * @return array{yearly:int, currency:string}|null The price in the currency's smallest unit, or null when WordPress.com has none.
 */
function get_personal_plan_price() {
	// Simple reads its own store; elsewhere the plan list costs a request per call.
	$cache_key = ( new Host() )->is_wpcom_simple() ? null : PERSONAL_PLAN_PRICE_TRANSIENT . get_current_user_id();
	if ( $cache_key ) {
		$cached = get_transient( $cache_key );
		if ( false !== $cached ) {
			return $cached ? $cached : null;
		}
	}

	$plan     = Plans::get_plan( 'personal-bundle', array( 'timeout' => 5 ) );
	$yearly   = $plan->raw_price_integer ?? null;
	$currency = $plan->currency_code ?? null;
	$price    = null;
	if ( is_numeric( $yearly ) && $yearly > 0 && is_string( $currency ) && '' !== $currency ) {
		$price = array(
			'yearly'   => (int) $yearly,
			'currency' => $currency,
		);
	}

	if ( $cache_key ) {
		// A failed lookup is retried sooner than a price goes stale.
		set_transient( $cache_key, $price ?? array(), $price ? 12 * HOUR_IN_SECONDS : HOUR_IN_SECONDS );
	}

	return $price;
}

/**
 * What a locked feature says, worded as classic Stats' upsell; `<link>` wraps the words its support page explains.
 *
 * @since 0.13.0
 *
 * @param string $feature Feature key.
 * @return array{description:string, support_url:string} The copy, generic for a feature without its own.
 */
function get_stats_feature_copy( $feature ) {
	$traffic_support = 'https://jetpack.com/support/jetpack-stats/traffic-dashboard/';

	switch ( $feature ) {
		case 'top-posts':
			return array(
				'description' => __( 'Discover your <link>post and pages</link> traffic in detail and learn what content resonates the most.', 'jetpack-premium-analytics-pkg' ),
				'support_url' => $traffic_support . '#analyzing-popular-posts-pages-and-archives',
			);
		case 'referrers':
			return array(
				'description' => __( 'Find out where your <link>visitors come from</link> to optimize your content strategy.', 'jetpack-premium-analytics-pkg' ),
				'support_url' => $traffic_support . '#referrers',
			);
		case 'countries':
			return array(
				'description' => __( 'Discover where your <link>visitors are located</link> and identify where your traffic is coming from.', 'jetpack-premium-analytics-pkg' ),
				'support_url' => $traffic_support . '#views-by-locations',
			);
		case 'regions-cities':
			return array(
				'description' => __( 'Access to <link>region and city stats</link> for more accurate analysis.', 'jetpack-premium-analytics-pkg' ),
				'support_url' => $traffic_support . '#regions-and-cities',
			);
		case 'clicks':
			return array(
				'description' => __( 'Learn what <link>external links</link> your visitors click on your site to reveal their areas of interest.', 'jetpack-premium-analytics-pkg' ),
				'support_url' => $traffic_support . '#clicks',
			);
		case 'file-downloads':
			return array(
				'description' => __( 'Discover the most <link>downloaded files</link> by your visitors.', 'jetpack-premium-analytics-pkg' ),
				'support_url' => 'https://wordpress.com/support/stats/analyze-content-performance/#track-file-downloads',
			);
		case 'authors':
			return array(
				'description' => __( 'Identify your audience’s <link>favorite writers</link> and perspectives.', 'jetpack-premium-analytics-pkg' ),
				'support_url' => $traffic_support . '#authors',
			);
		case 'search-terms':
			return array(
				'description' => __( 'Discover the <link>terms and phrases</link> your visitors use to find your site.', 'jetpack-premium-analytics-pkg' ),
				'support_url' => $traffic_support . '#search-terms',
			);
		case 'videos':
			return array(
				'description' => __( 'Discover your <link>most popular videos</link> and find out how they performed.', 'jetpack-premium-analytics-pkg' ),
				'support_url' => 'https://jetpack.com/support/jetpack-videopress/add-video-block-editor/video-stats/',
			);
		case 'utm':
			return array(
				'description' => __( 'Generate UTM parameters and track your <link>campaign performance data</link>.', 'jetpack-premium-analytics-pkg' ),
				'support_url' => $traffic_support . '#harnessing-utm-stats-for-precision-tracking',
			);
		case 'devices':
			return array(
				'description' => __( 'See which <link>devices, browsers and OS</link> your visitors are using.', 'jetpack-premium-analytics-pkg' ),
				'support_url' => $traffic_support . '#devices-stats',
			);
		case 'tags':
			return array(
				'description' => __( 'Track the most viewed <link>tags & categories</link>.', 'jetpack-premium-analytics-pkg' ),
				'support_url' => 'https://wordpress.com/support/stats/learn-insights-about-your-website/#all-time-insights',
			);
		case 'recent-7-days':
			return array(
				'description' => __( 'See more than the last 7 days of your stats.', 'jetpack-premium-analytics-pkg' ),
				'support_url' => '',
			);
		case 'long-date-presets':
			return array(
				'description' => __( 'See periods beyond the last 30 days in one click.', 'jetpack-premium-analytics-pkg' ),
				'support_url' => '',
			);
		case 'intervals':
			return array(
				'description' => __( 'Group your charts by week, month or year.', 'jetpack-premium-analytics-pkg' ),
				'support_url' => '',
			);
		default:
			return array(
				'description' => __( 'Upgrade your plan to unlock Jetpack Stats.', 'jetpack-premium-analytics-pkg' ),
				'support_url' => '',
			);
	}
}

/**
 * Locales with translated WordPress.com support articles: Calypso's `supportSiteLocales`, which classic Stats links with.
 */
const WPCOM_SUPPORT_LOCALES = array( 'ar', 'de', 'es', 'fr', 'he', 'id', 'it', 'ja', 'ko', 'nl', 'pt-br', 'ru', 'sv', 'tr', 'zh-cn', 'zh-tw' );

/**
 * A WordPress.com support URL in the current user's language, where that support site has one.
 *
 * Leaves jetpack.com URLs in English: its localized support docs are missing for most locales.
 *
 * @since 0.13.0
 *
 * @param string $url Support URL, in English.
 * @return string
 */
function localize_stats_support_url( $url ) {
	$prefix = 'https://wordpress.com/support/';
	if ( ! str_starts_with( $url, $prefix ) ) {
		return $url;
	}

	$locale = strtolower( str_replace( '_', '-', get_user_locale() ) );
	if ( ! in_array( $locale, WPCOM_SUPPORT_LOCALES, true ) ) {
		$locale = strtok( $locale, '-' );
	}
	if ( ! in_array( $locale, WPCOM_SUPPORT_LOCALES, true ) ) {
		return $url;
	}

	return 'https://wordpress.com/' . $locale . '/support/' . substr( $url, strlen( $prefix ) );
}

/**
 * Where to buy a locked feature: the dashboard's upgrade page on a Jetpack site, a WordPress.com plan elsewhere.
 *
 * @since 0.13.0
 *
 * @param string $feature Feature key, or the slug of a locked section, which no commercial feature shares.
 * @param string $tier    One of the STATS_TIER_* values.
 * @param string $from    Where the upgrade starts, reported as the upgrade page's source.
 * @return string The URL.
 */
function get_stats_upgrade_url( $feature, $tier, $from = 'jetpack-premium-analytics' ) {
	if ( STATS_TIER_JETPACK_FREE === $tier ) {
		return Analytics::dashboard_url( '/upgrade?source=' . rawurlencode( $from ) );
	}

	$return_path = 'admin.php?page=' . Analytics::MENU_PAGE_SLUG;
	$plan        = in_array( $feature, STATS_COMMERCIAL_FEATURES, true ) ? 'premium' : 'personal';
	$site_slug   = ( new Status() )->get_site_suffix();

	return 'https://wordpress.com/checkout/' . rawurlencode( $site_slug ) . '/' . $plan . '?redirect_to=' . rawurlencode( admin_url( $return_path ) );
}

/**
 * The gates the client applies: each locked feature's copy and upgrade URL, the feature of each widget type it locks, and each locked section's prompt.
 *
 * @since 0.13.0
 *
 * @return array{tier:string, locked_features:array<string,array{description:string, support_url:string, upgrade_url:string}>, locked_widget_types:array<string,string>, locked_sections:array<string,array{title:string, description:string, description_with_price:string, features:string[], upgrade_label:string, expand_label:string, support_url:string, upgrade_url:string, open_widget_types:string[], plan_price:array{yearly:int, currency:string}|null}>}
 */
function get_stats_plan_gates() {
	$tier     = get_stats_plan_tier();
	$features = get_locked_stats_features( $tier );

	$locked_features = array();
	foreach ( $features as $feature ) {
		$copy                        = get_stats_feature_copy( $feature );
		$copy['support_url']         = localize_stats_support_url( $copy['support_url'] );
		$locked_features[ $feature ] = $copy + array( 'upgrade_url' => get_stats_upgrade_url( $feature, $tier, 'jetpack-premium-analytics-locked-feature' ) );
	}

	$locked_widget_types = array();
	if ( $locked_features ) {
		ensure_widget_registry_ready();

		foreach ( get_available_widget_types() as $name => $widget_type ) {
			if ( isset( $widget_type->plan_feature ) && isset( $locked_features[ $widget_type->plan_feature ] ) ) {
				$locked_widget_types[ $name ] = $widget_type->plan_feature;
			}
		}
	}

	$locked_sections = array();
	$sections        = get_locked_stats_sections( $tier );
	$plan_price      = $sections ? get_personal_plan_price() : null;
	foreach ( $sections as $section ) {
		$copy                        = get_stats_section_copy( $section );
		$copy['support_url']         = localize_stats_support_url( $copy['support_url'] );
		$locked_sections[ $section ] = $copy + array(
			'upgrade_url'       => get_stats_upgrade_url( $section, $tier ),
			// An allowlist, so a widget type no plan feature names is hidden too.
			'open_widget_types' => 'traffic' === $section ? array( 'jpa/traffic-chart' ) : array(),
			'plan_price'        => $plan_price,
		);
	}

	return array(
		'tier'                => $tier,
		'locked_features'     => $locked_features,
		'locked_widget_types' => $locked_widget_types,
		'locked_sections'     => $locked_sections,
	);
}

/**
 * Configures the plan gates script data.
 *
 * @since 0.13.0
 *
 * @return void
 */
function configure_stats_plan_gates() {
	add_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_stats_plan_gates_script_data', 20 );
	add_action( 'admin_init', __NAMESPACE__ . '\\maybe_refresh_jetpack_plan' );
	add_action( 'admin_init', __NAMESPACE__ . '\\maybe_invalidate_stats_caches' );
}

/**
 * Injects the plan gates into JetpackScriptData.
 *
 * @since 0.13.0
 *
 * @param array $data The script data passed by the assets package.
 * @return array
 */
function inject_stats_plan_gates_script_data( array $data ): array {
	// Script data prints on every Jetpack admin page; only the dashboard reads the gates.
	if ( ! Analytics::is_dashboard_request() ) {
		return $data;
	}

	if ( ! isset( $data['premium_analytics'] ) || ! is_array( $data['premium_analytics'] ) ) {
		$data['premium_analytics'] = array();
	}

	$gates = get_stats_plan_gates();

	// Objects, so an empty map reaches JS as `{}` rather than `[]`.
	$data['premium_analytics']['plan_gates'] = array(
		'tier'                => $gates['tier'],
		'locked_features'     => (object) $gates['locked_features'],
		'locked_widget_types' => (object) $gates['locked_widget_types'],
		'locked_sections'     => (object) $gates['locked_sections'],
		// The banner sells the commercial features, so `utm` picks the plan that unlocks them.
		'free_site_upgrade'   => offers_free_site_upgrade( $gates['tier'] )
			? array(
				'upgrade_url'       => get_stats_upgrade_url( 'utm', $gates['tier'], 'jetpack-premium-analytics-free-site-upgrade-notice' ),
				'has_stats_product' => has_jetpack_stats_product(),
			)
			: null,
	);

	return $data;
}

/**
 * Transient throttling the refresh of an empty plan cache.
 */
const EMPTY_PLAN_REFRESH_TRANSIENT = 'jetpack_premium_analytics_empty_plan_refresh';

/**
 * Transient throttling the refresh after a purchase.
 */
const PURCHASE_PLAN_REFRESH_TRANSIENT = 'jetpack_premium_analytics_purchase_plan_refresh';

/**
 * Transient throttling the cache invalidation after a purchase.
 */
const PURCHASE_CACHE_INVALIDATION_TRANSIENT = 'jetpack_premium_analytics_purchase_cache_invalidation';

/**
 * Drops the cached Stats replies a checkout made stale, before the dashboard it returns to asks for them.
 *
 * @since 0.13.0
 *
 * @return void
 */
function maybe_invalidate_stats_caches() {
	// Simple serves the dashboard from WordPress.com, with neither cache.
	if ( ! Analytics::is_dashboard_request() || '' === get_stats_purchase_success_type() || ( new Host() )->is_wpcom_simple() ) {
		return;
	}

	// The marker is a plain GET parameter, so a crafted link could otherwise drop the caches on every visit.
	if ( get_transient( PURCHASE_CACHE_INVALIDATION_TRANSIENT ) ) {
		return;
	}
	set_transient( PURCHASE_CACHE_INVALIDATION_TRANSIENT, 1, MINUTE_IN_SECONDS );

	Api_Proxy_Controller::invalidate_cache();
	delete_transient( Notices::NOTICES_CACHE_KEY );
}

/**
 * Refreshes a self-hosted site's cached plan on the dashboard when it is empty or a checkout just returned.
 *
 * Script data is final once printed, so the gates can only change before it.
 *
 * @since 0.13.0
 *
 * @return void
 */
function maybe_refresh_jetpack_plan() {
	if ( ! Analytics::is_dashboard_request() || ( new Host() )->is_wpcom_platform() ) {
		return;
	}

	// An unconnected visit cannot fetch the plan, so it must not start the throttle that would skip the first load after connecting.
	if ( ! ( new Connection_Manager() )->is_connected() ) {
		return;
	}

	if ( '' !== get_stats_purchase_success_type() ) {
		$transient = PURCHASE_PLAN_REFRESH_TRANSIENT;
		$ttl       = MINUTE_IN_SECONDS;
	} elseif ( ! has_cached_jetpack_plan() ) {
		$transient = EMPTY_PLAN_REFRESH_TRANSIENT;
		$ttl       = 15 * MINUTE_IN_SECONDS;
	} else {
		return;
	}

	if ( get_transient( $transient ) ) {
		return;
	}
	set_transient( $transient, 1, $ttl );

	Current_Plan::refresh_from_wpcom( array( 'timeout' => 5 ) );
}
