<?php
/**
 * Mock for the WordPress.com feature-gating function.
 *
 * `wpcom_site_has_feature()` is provided by the platform (wpcom on Simple, wpcomsh on Atomic),
 * not by any package; without this, the platform branch of `is_videopress_available()` can only
 * short-circuit on `function_exists()` and read false, leaving the real path unexercised — so a
 * wrong feature slug would ship green.
 *
 * State lives in a global, not a class: `tests/php/mocks/` is excluded from Phan (the real
 * `wpcom_site_has_feature()` already arrives via the `wpcom` stub set), so a class declared here
 * would read as undeclared everywhere it's used.
 *
 * Default is inert: with nothing entitled, every feature reads false, as before this mock existed.
 *
 * @package automattic/jetpack-premium-analytics
 */

/**
 * Feature slugs the simulated WordPress.com site is entitled to.
 *
 * Tests assign to this directly; reset it in tear_down().
 */
$GLOBALS['jpa_test_wpcom_features'] = array();

if ( ! function_exists( 'wpcom_site_has_feature' ) ) {
	/**
	 * Whether the simulated WordPress.com site is entitled to this feature.
	 *
	 * @param string $feature Feature slug.
	 * @return bool
	 */
	function wpcom_site_has_feature( $feature ) {
		return in_array( $feature, $GLOBALS['jpa_test_wpcom_features'] ?? array(), true );
	}
}
