<?php
/**
 * Minimal `Jetpack` stand-in for the Subscribers section gate.
 *
 * The gate probes for the class alone to decide whether the site has a module
 * system worth consulting. Unlike woocommerce-mocks.php this is NOT required
 * from bootstrap.php: declaring `Jetpack` for the whole suite would flip the
 * gate for every test. It is required from the handful of tests that want the
 * Jetpack-plugin shape, each of which runs in its own process.
 *
 * JETPACK__VERSION deliberately stays undefined, so Modules::get_available()
 * keeps taking its standalone branch and module availability stays under the
 * test's own `jetpack_get_available_standalone_modules` filter.
 *
 * @package automattic/jetpack-premium-analytics
 */

// phpcs:disable Squiz.Commenting, Generic.Commenting, WordPress.Files.FileName

if ( ! class_exists( 'Jetpack' ) ) {
	/**
	 * Stub of the Jetpack plugin's main class.
	 */
	class Jetpack {}
}
