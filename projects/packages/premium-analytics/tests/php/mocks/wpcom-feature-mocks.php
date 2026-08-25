<?php
/**
 * Mock for the WordPress.com feature-gating function.
 *
 * `wpcom_site_has_feature()` is provided by the WPCOM platform (wpcom itself on
 * Simple, wpcomsh on Atomic), not by any package, so without this the platform
 * branch of `is_videopress_available()` can only ever short-circuit on
 * `function_exists()` and answer false. That leaves the true path — the one
 * Simple and Atomic actually take — unexercised, so a wrong feature slug would
 * ship green.
 *
 * State lives in a global rather than a class so this file stays self-contained:
 * `tests/php/mocks/` is excluded from Phan (see .phan/config.php), because the
 * real `wpcom_site_has_feature()` already arrives via the `wpcom` stub set, and
 * a class declared in here would read as undeclared everywhere it is used.
 *
 * The default is inert: with nothing entitled, every feature reads as false,
 * exactly as it did before this mock existed.
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
