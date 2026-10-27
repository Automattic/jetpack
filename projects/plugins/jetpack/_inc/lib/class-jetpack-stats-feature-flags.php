<?php
/**
 * Stats feature flags.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\PremiumAnalytics\Classic_Stats;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Jetpack's entry to the flag that retires the classic Stats page, which the Premium Analytics package owns.
 *
 * @since 16.4
 */
class Jetpack_Stats_Feature_Flags {

	/**
	 * Register the flag.
	 *
	 * @return void
	 */
	public static function register() {
		if ( class_exists( Classic_Stats::class ) ) {
			Classic_Stats::register_feature_flag();
		}
	}

	/**
	 * Whether the retirement flag is on. Drop the classic page only once Stats v2 is enabled too.
	 *
	 * A build without the package has no Stats v2 to give way to. Read on `plugins_loaded`, so a filter
	 * forcing it has to be added before that.
	 *
	 * @return bool
	 */
	public static function is_classic_page_retired() {
		return class_exists( Classic_Stats::class ) && Classic_Stats::is_retired();
	}
}

Jetpack_Stats_Feature_Flags::register();
