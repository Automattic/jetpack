<?php
/**
 * Retire the classic Stats page on WordPress.com Simple, so Stats opens Stats v2.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\PremiumAnalytics\Classic_Stats;

/**
 * Turn the retirement flag on.
 *
 * Priority 5 leaves the last word to the a8c Feature Flags screen's per-site override at 10,
 * which a `jetpack_feature_flag_enabled_{flag}` filter would beat.
 *
 * @param bool   $enabled Whether the flag is enabled.
 * @param string $name    Feature flag name.
 * @return bool
 */
function wpcom_simple_retire_classic_stats( $enabled, $name ) {
	if ( 'jetpack-stats-classic-page-retired' !== $name ) {
		return $enabled;
	}

	// public-api also serves Jetpack and Atomic sites, whose own plugin decides.
	if ( function_exists( 'is_jetpack_site' ) && is_jetpack_site( get_current_blog_id() ) ) {
		return $enabled;
	}

	return true;
}
add_filter( 'jetpack_feature_flag_enabled', 'wpcom_simple_retire_classic_stats', 5, 2 );

/**
 * List the flag on the a8c Feature Flags screen, since Simple never runs the Jetpack plugin file that registers it.
 *
 * @return void
 */
function wpcom_simple_register_classic_stats_flag() {
	// An older Premium Analytics copy predates the flag.
	if ( is_callable( array( Classic_Stats::class, 'register_feature_flag' ) ) ) {
		Classic_Stats::register_feature_flag();
	}
}
add_action( 'plugins_loaded', 'wpcom_simple_register_classic_stats_flag', 0 );
