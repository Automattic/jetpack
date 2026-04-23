<?php
/**
 * Site-state reader for the Plugin Conflicts Guardian.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Reports the versions that matter for compatibility comparison: the
 * current WordPress version and the PHP version the site runs on.
 *
 * Kept as a thin class (rather than free functions) so tests and the
 * future AI-ability adapter can inject a fake via dependency injection.
 */
class PCG_Site_State {

	/**
	 * Current WordPress version string (e.g. "6.7.2").
	 *
	 * @return string
	 */
	public function wp_version() {
		global $wp_version;
		return isset( $wp_version ) ? (string) $wp_version : '';
	}

	/**
	 * Current PHP version string (e.g. "8.1.27").
	 *
	 * @return string
	 */
	public function php_version() {
		return PHP_VERSION;
	}
}
