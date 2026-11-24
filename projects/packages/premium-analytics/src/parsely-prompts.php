<?php
/**
 * Who sees the Upgrade to Parsely prompts.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Stats\WPCOM_Stats;
use Automattic\Jetpack\Status\Host;

require_once __DIR__ . '/stats-plan-gates.php';

/**
 * Filter overriding whether the site and user see the prompts.
 *
 * @var string
 */
const OFFERS_PARSELY_PROMPTS_FILTER = 'jetpack_premium_analytics_offers_parsely_prompts';

/**
 * Monthly views a site must reach to qualify.
 *
 * @var int
 */
const PARSELY_PROMPTS_VIEWS_THRESHOLD = 100000;

/**
 * The Stats plan tiers that qualify. VIP needs no rule of its own: it resolves to `commercial`.
 * `paid` only ever comes from WordPress.com, so a self-hosted site's PWYW purchase reads
 * `jetpack-free` and does not qualify however much it pays.
 *
 * @var string[]
 */
const PARSELY_PROMPTS_TIERS = array( STATS_TIER_COMMERCIAL, STATS_TIER_PAID );

/**
 * Transient holding the views figure the threshold is measured against.
 *
 * @var string
 */
const PARSELY_PROMPTS_VIEWS_TRANSIENT = 'jetpack_premium_analytics_parsely_views';

/**
 * How long that figure stands. A promo can lag a site crossing the threshold.
 *
 * @var int
 */
const PARSELY_PROMPTS_VIEWS_TTL = 12 * HOUR_IN_SECONDS;

/**
 * How long a failed lookup stands, so one bad response does not hide the prompt all day.
 *
 * @var int
 */
const PARSELY_PROMPTS_VIEWS_RETRY_TTL = HOUR_IN_SECONDS;

/**
 * Configures the Upgrade to Parsely prompts. The flag registers earlier, at package boot.
 *
 * @since $$next-version$$
 *
 * @return void
 */
function configure_parsely_prompts() {
	add_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_parsely_prompts_script_data', 20 );
}

/**
 * Injects whether the prompts are offered into JetpackScriptData.
 *
 * @since $$next-version$$
 *
 * @param array $data The script data passed by the assets package.
 * @return array
 */
function inject_parsely_prompts_script_data( array $data ): array {
	if ( ! Analytics::renders_dashboard() ) {
		return $data;
	}

	if ( ! isset( $data['premium_analytics'] ) || ! is_array( $data['premium_analytics'] ) ) {
		$data['premium_analytics'] = array();
	}

	$data['premium_analytics']['offers_parsely_prompts'] = offers_parsely_prompts();

	return $data;
}

/**
 * Whether this site and user see the Upgrade to Parsely prompts.
 *
 * @since $$next-version$$
 *
 * @return bool
 */
function offers_parsely_prompts() {
	$offers = Parsely_Prompts::is_enabled()
		&& current_user_can( 'manage_options' )
		// WordPress.com Simple cannot complete the one-step Parsely setup yet.
		&& ! ( new Host() )->is_wpcom_simple()
		&& in_array( get_stats_plan_tier(), PARSELY_PROMPTS_TIERS, true )
		&& ! has_parsely_integration()
		// Last, and behind the short circuit: this is the only condition that costs a request.
		&& get_monthly_stats_views() >= PARSELY_PROMPTS_VIEWS_THRESHOLD;

	/**
	 * Filters whether the site and user see the Upgrade to Parsely prompts. It runs after every
	 * condition, the feature flag included, so returning true shows the prompts with the flag off.
	 *
	 * @since $$next-version$$
	 *
	 * @param bool $offers Whether every condition passed.
	 */
	return (bool) apply_filters( OFFERS_PARSELY_PROMPTS_FILTER, $offers );
}

/**
 * Whether the site already runs Parsely, which it does once a Site ID is set. The plugin answers
 * for itself wherever it can; the option is where it keeps that Site ID, and what it leaves
 * behind once deactivated.
 *
 * @since $$next-version$$
 *
 * @return bool
 */
function has_parsely_integration() {
	$parsely = $GLOBALS['parsely'] ?? null;

	if ( is_object( $parsely ) && method_exists( $parsely, 'site_id_is_set' ) ) {
		return (bool) $parsely->site_id_is_set();
	}

	$settings = get_option( 'parsely' );

	return is_array( $settings ) && is_string( $settings['apikey'] ?? null ) && '' !== $settings['apikey'];
}

/**
 * The site's views for a month, or null when WordPress.com does not say.
 *
 * @since $$next-version$$
 *
 * @return int|null
 */
function get_monthly_stats_views() {
	$cached = get_transient( PARSELY_PROMPTS_VIEWS_TRANSIENT );

	// A cache of any other shape is refetched rather than read, so a stale one heals itself.
	if ( is_array( $cached ) && array_key_exists( 'views', $cached ) ) {
		return $cached['views'];
	}

	$views = fetch_monthly_stats_views();

	/*
	 * A failure is cached too: the stats client refuses to cache a connection failure, so without
	 * this a site whose blog token has gone stale re-sends the request on every admin page render.
	 */
	set_transient(
		PARSELY_PROMPTS_VIEWS_TRANSIENT,
		array( 'views' => $views ),
		null === $views ? PARSELY_PROMPTS_VIEWS_RETRY_TTL : PARSELY_PROMPTS_VIEWS_TTL
	);

	return $views;
}

/**
 * Ask WordPress.com for the site's views for a month.
 *
 * @since $$next-version$$
 *
 * @return int|null
 */
function fetch_monthly_stats_views() {
	$stats = new WPCOM_Stats();

	// Another plugin can load an older jetpack-stats, whose class has no usage endpoint.
	if ( ! method_exists( $stats, 'get_stats_usage' ) ) {
		return null;
	}

	// An older copy of the package takes no request arguments and waits its own 20 seconds.
	$usage = $stats->get_stats_usage( array( 'timeout' => 5 ) );

	if ( is_wp_error( $usage ) ) {
		return null;
	}

	return quietest_monthly_views( is_array( $usage ) ? $usage : array() );
}

/**
 * The lowest views any recent whole month got. WordPress.com measures a site by that figure and
 * then subtracts the views its plan already paid for to reach `billable_monthly_views`, so a site
 * provisioned for its own traffic reports 0 there and would never qualify.
 *
 * @since $$next-version$$
 *
 * @param array $usage The Stats usage payload.
 * @return int|null
 */
function quietest_monthly_views( array $usage ) {
	$months = $usage['recent_usages'] ?? null;

	if ( ! is_array( $months ) ) {
		return null;
	}

	$open_month = $usage['current_usage']['current_start'] ?? null;
	$counts     = array();

	foreach ( $months as $month ) {
		if ( ! is_array( $month ) || ! is_numeric( $month['views_count'] ?? null ) ) {
			continue;
		}

		// The month in progress is a part month, and the lowest of the set would read it as a slump.
		if ( null !== $open_month && ( $month['current_start'] ?? null ) === $open_month ) {
			continue;
		}

		$counts[] = (int) $month['views_count'];
	}

	return empty( $counts ) ? null : min( $counts );
}
