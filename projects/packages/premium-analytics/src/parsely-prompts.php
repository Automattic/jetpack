<?php
/**
 * Who sees the Upgrade to Parse.ly prompts.
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
 * Field on the Stats usage payload that opens the prompts for a site. WordPress.com decides which
 * sites get them, which is the only switch a self-hosted site can be reached by between plugin
 * releases: those sites answer no filter and store no state of their own, so anything in the
 * plugin would hold until the next release. STATS-680 serves it.
 *
 * Only an explicit `true` opens them, so a payload that predates the field, and a failed lookup,
 * both leave them closed.
 *
 * @var string
 */
const PARSELY_PROMPTS_ENABLED_FIELD = 'parsely_prompts_enabled';

/**
 * Transient holding the views figure the threshold is measured against, and whether
 * WordPress.com opens the prompts for the site. Both come from one request.
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
 * Configures the Upgrade to Parse.ly prompts. The flag registers earlier, at package boot.
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
 * Whether this site and user see the Upgrade to Parse.ly prompts.
 *
 * @since $$next-version$$
 *
 * @return bool
 */
function offers_parsely_prompts() {
	$offers = current_user_can( 'manage_options' )
		// WordPress.com Simple cannot complete the one-step Parse.ly setup yet.
		&& ! ( new Host() )->is_wpcom_simple()
		&& in_array( get_stats_plan_tier(), PARSELY_PROMPTS_TIERS, true )
		&& ! has_parsely_integration()
		// Last, and behind the short circuit: these two share the one request this check costs.
		&& prompts_enabled_by_wordpress_com()
		&& get_monthly_stats_views() >= PARSELY_PROMPTS_VIEWS_THRESHOLD;

	/**
	 * Filters whether the site and user see the Upgrade to Parse.ly prompts. It runs after every
	 * condition, so returning true shows them to a site WordPress.com has not opened them for.
	 * This is how a development site, which WordPress.com will never open them for, shows them.
	 *
	 * @since $$next-version$$
	 *
	 * @param bool $offers Whether every condition passed.
	 */
	return (bool) apply_filters( OFFERS_PARSELY_PROMPTS_FILTER, $offers );
}

/**
 * Whether the site already runs Parse.ly, which it does once a Site ID is set. The plugin answers
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
	return get_parsely_prompts_usage()['views'];
}

/**
 * Whether WordPress.com opens the prompts for this site.
 *
 * @since $$next-version$$
 *
 * @return bool
 */
function prompts_enabled_by_wordpress_com() {
	return get_parsely_prompts_usage()['enabled'];
}

/**
 * What the Stats usage payload says, kept for the rest of the TTL so the two conditions that read
 * it cost one request between them.
 *
 * @since $$next-version$$
 *
 * @return array{views: int|null, enabled: bool}
 */
function get_parsely_prompts_usage() {
	$cached = get_transient( PARSELY_PROMPTS_VIEWS_TRANSIENT );

	// A cache of any other shape is refetched rather than read, so one written before `enabled`
	// existed heals itself instead of holding the prompts closed for the rest of its life.
	if ( is_array( $cached ) && array_key_exists( 'views', $cached ) && array_key_exists( 'enabled', $cached ) ) {
		return $cached;
	}

	$usage = fetch_parsely_prompts_usage();

	/*
	 * A failure is cached too: the stats client refuses to cache a connection failure, so without
	 * this a site whose blog token has gone stale re-sends the request on every admin page render.
	 */
	set_transient(
		PARSELY_PROMPTS_VIEWS_TRANSIENT,
		$usage,
		null === $usage['views'] ? PARSELY_PROMPTS_VIEWS_RETRY_TTL : PARSELY_PROMPTS_VIEWS_TTL
	);

	return $usage;
}

/**
 * Ask WordPress.com for the site's views for a month, and whether it opens the prompts.
 *
 * @since $$next-version$$
 *
 * @return array{views: int|null, enabled: bool}
 */
function fetch_parsely_prompts_usage() {
	$stats = new WPCOM_Stats();

	// Another plugin can load an older jetpack-stats, whose class has no usage endpoint.
	if ( ! method_exists( $stats, 'get_stats_usage' ) ) {
		return array(
			'views'   => null,
			'enabled' => false,
		);
	}

	// An older copy of the package takes no request arguments and waits its own 20 seconds.
	$usage = $stats->get_stats_usage( array( 'timeout' => 5 ) );

	if ( is_wp_error( $usage ) ) {
		return array(
			'views'   => null,
			'enabled' => false,
		);
	}

	$usage = is_array( $usage ) ? $usage : array();

	return array(
		'views'   => quietest_monthly_views( $usage ),
		'enabled' => true === ( $usage[ PARSELY_PROMPTS_ENABLED_FIELD ] ?? null ),
	);
}

/**
 * The lowest views any of the site's closed billing periods got. `recent_usages` reports those, a
 * month each, and the period in progress is reported apart from them in `current_usage`.
 *
 * WordPress.com measures a site by that figure and then subtracts the views its plan already paid
 * for to reach `billable_monthly_views`, so a site provisioned for its own traffic reports 0 there
 * and would never qualify.
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

	$counts = array();

	foreach ( $months as $month ) {
		if ( ! is_array( $month ) || ! is_numeric( $month['views_count'] ?? null ) ) {
			continue;
		}

		$counts[] = (int) $month['views_count'];
	}

	return empty( $counts ) ? null : min( $counts );
}
