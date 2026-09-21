<?php
/**
 * Stubs for the WordPress.com feature-gating functions.
 *
 * These are provided by the platform (wpcom on Simple, wpcomsh on Atomic), not by any
 * package, so without them `Product::does_site_have_feature()` can only short-circuit on
 * `function_exists()` and its WordPress.com branch never runs — a wrong slug would ship green.
 *
 * Defaults are inert: with no known features nothing is answered locally, so the fetch path
 * runs exactly as it does off WordPress.com. Tests opt in via Wpcom_Test_Features.
 *
 * @package automattic/my-jetpack
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
