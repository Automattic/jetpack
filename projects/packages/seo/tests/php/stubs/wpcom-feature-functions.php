<?php
/**
 * Stubs for the WordPress.com feature-gating functions.
 *
 * These are provided by the WordPress.com platform, not by any package. When they
 * exist, `Current_Plan::supports()` hijacks to them instead of consulting the
 * plan's own feature list (see `packages/plans/src/class-current-plan.php`). They
 * are absent off-WordPress.com, which is why self-hosted always falls through to
 * the plan data — and why `advanced-seo`, which every plan class supports, can only
 * ever read as unsupported on WordPress.com.
 *
 * Defaults are inert: with no known features nothing hijacks, so the plan data path
 * runs exactly as it does off-WordPress.com. Tests opt in via Wpcom_Test_Features.
 *
 * @package automattic/jetpack-seo
 */

if ( ! function_exists( 'wpcom_feature_exists' ) ) {
	/**
	 * Whether the simulated WordPress.com platform gates this feature.
	 *
	 * @param string $feature Feature slug.
	 * @return bool
	 */
	function wpcom_feature_exists( $feature ) {
		return in_array( $feature, Wpcom_Test_Features::$known, true );
	}
}

if ( ! function_exists( 'wpcom_site_has_feature' ) ) {
	/**
	 * Whether the simulated WordPress.com site is entitled to this feature.
	 *
	 * @param string $feature Feature slug.
	 * @return bool
	 */
	function wpcom_site_has_feature( $feature ) {
		return in_array( $feature, Wpcom_Test_Features::$entitled, true );
	}
}
