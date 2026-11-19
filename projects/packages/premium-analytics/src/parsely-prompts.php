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
 * Billable monthly views a site must reach to qualify.
 *
 * @var int
 */
const PARSELY_PROMPTS_VIEWS_THRESHOLD = 100000;

/**
 * The Stats plan tiers that qualify. VIP needs no rule of its own: it resolves to `commercial`.
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
	 * Filters whether the site and user see the Upgrade to Parsely prompts.
	 *
	 * @since $$next-version$$
	 *
	 * @param bool $offers Whether every condition passed.
	 */
	return (bool) apply_filters( OFFERS_PARSELY_PROMPTS_FILTER, $offers );
}

/**
 * Whether the site already runs Parsely. Either signal alone is enough: suppressing the
 * prompt for a site that is not a customer costs less than showing it to one that is.
 *
 * @since $$next-version$$
 *
 * @return bool
 */
function has_parsely_integration() {
	if ( class_exists( 'Parsely\Parsely' ) ) {
		return true;
	}

	$settings = get_option( 'parsely' );

	return is_array( $settings ) && is_string( $settings['apikey'] ?? null ) && '' !== $settings['apikey'];
}

/**
 * The site's billable views for a month, or null when WordPress.com does not say.
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
 * Ask WordPress.com for the site's billable views for a month.
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

	$usage = $stats->get_stats_usage();

	if ( is_wp_error( $usage ) ) {
		return null;
	}

	/*
	 * Not `current_usage.views_count`, which counts the open billing period so far: a site that
	 * reliably clears the threshold would qualify late each month and lose it at every reset.
	 */
	$views = $usage['billable_monthly_views'] ?? null;

	return is_numeric( $views ) ? (int) $views : null;
}
