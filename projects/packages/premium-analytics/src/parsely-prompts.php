<?php
/**
 * Who sees the Upgrade to Parsely prompts.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use Automattic\Jetpack\Stats\WPCOM_Stats;
use Automattic\Jetpack\Status\Host;

require_once __DIR__ . '/stats-plan-gates.php';

/**
 * Flag that turns the Upgrade to Parsely prompts on for the sites that qualify.
 *
 * @var string
 */
const PARSELY_PROMPTS_FLAG = 'jetpack-stats-parsely-prompts';

/**
 * Filter overriding whether the site and user see the prompts.
 *
 * @var string
 */
const OFFERS_PARSELY_PROMPTS_FILTER = 'jetpack_premium_analytics_offers_parsely_prompts';

/**
 * Views a site must get in the current month to qualify.
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
 * Register the flag, so feature-flag tooling lists it.
 *
 * @since $$next-version$$
 *
 * @return void
 */
function register_parsely_prompts_feature_flag() {
	Feature_Flags::register(
		PARSELY_PROMPTS_FLAG,
		array(
			'default'     => false,
			'description' => 'Show the Upgrade to Parsely prompts to sites that qualify: a paid Stats plan, 100,000 monthly views, and no Parsely of their own.',
			'owner'       => 'jetpack-stats',
		)
	);
}

/**
 * Configures the Upgrade to Parsely prompts.
 *
 * @since $$next-version$$
 *
 * @return void
 */
function configure_parsely_prompts() {
	register_parsely_prompts_feature_flag();
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
	// Script data prints on every Jetpack admin page; only the dashboard shows the prompts.
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
	$offers = Feature_Flags::is_enabled( PARSELY_PROMPTS_FLAG )
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
 * The site's views so far this billing month, or null when WordPress.com does not say.
 *
 * @since $$next-version$$
 *
 * @return int|null
 */
function get_monthly_stats_views() {
	$usage = ( new WPCOM_Stats() )->get_stats_usage();

	if ( is_wp_error( $usage ) || ! is_array( $usage['current_usage'] ?? null ) ) {
		return null;
	}

	$views = $usage['current_usage']['views_count'] ?? null;

	return is_numeric( $views ) ? (int) $views : null;
}
