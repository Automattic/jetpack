<?php
/**
 * Controllable stand-in for the WordPress.com feature registry.
 *
 * Backs the `wpcom_feature_exists()` / `wpcom_site_has_feature()` stubs in
 * wpcom-feature-functions.php. Kept in its own file because a file may not mix
 * class and function declarations (Universal.Files.SeparateFunctionsFromOO),
 * mirroring the class-woocommerce.php / woocommerce-functions.php split.
 *
 * @package automattic/jetpack-seo
 */

/**
 * Test-controlled WordPress.com feature state.
 */
class Wpcom_Test_Features {

	/**
	 * Feature slugs the simulated platform gates. A feature absent here is not
	 * hijacked at all, so the plan's own feature list answers for it.
	 *
	 * @var string[]
	 */
	public static $known = array();

	/**
	 * Feature slugs the simulated site is actually entitled to.
	 *
	 * @var string[]
	 */
	public static $entitled = array();

	/**
	 * Restore the inert defaults.
	 */
	public static function reset() {
		self::$known    = array();
		self::$entitled = array();
	}
}
