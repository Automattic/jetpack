<?php
/**
 * Plugin Name: Cookie Consent Test Bootstrap (DEV/TEST ONLY)
 * Description: Loads the jetpack-cookie-consent package and calls Cookie_Consent::init() so the banner, REST endpoint, DB table, and wp-cron cleanup can be exercised. Symlink into wp-content/mu-plugins/. Do NOT ship — for testing the test/cookie-consent-49511 branch only.
 *
 * This file lives inside the package, so __DIR__ resolves the autoloader path
 * regardless of where the monorepo is checked out. Symlink (not copy) it into
 * wp-content/mu-plugins/ so __DIR__ still points back into the package.
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent\Test;

use Automattic\Jetpack\CookieConsent\Cookie_Consent;

/*
 * Standalone-test only: the package is loaded straight from the monorepo (outside
 * wp-content/plugins/), so the plugins_url() calls inside Cookie_Consent resolve
 * against the absolute monorepo path and 404. A real consuming plugin (package in
 * its jetpack_vendor/) does not hit this. To test the frontend here, symlink the
 * package into the web root:
 *
 *   ln -s <monorepo>/projects/packages/cookie-consent \
 *     wp-content/plugins/jetpack-cookie-consent
 *
 * then rewrite the package asset URLs to that web-accessible symlink.
 */
add_filter(
	'plugins_url',
	static function ( $url, $path, $plugin ) {
		$link = WP_PLUGIN_DIR . '/jetpack-cookie-consent';
		if ( is_string( $plugin )
			&& false !== strpos( $plugin, '/packages/cookie-consent/' )
			&& is_link( $link )
		) {
			return plugins_url( $path, $link . '/src' );
		}
		return $url;
	},
	20,
	3
);

$jetpack_cookie_consent_autoload = __DIR__ . '/../vendor/autoload.php';

if ( file_exists( $jetpack_cookie_consent_autoload ) ) {
	require_once $jetpack_cookie_consent_autoload;
	Cookie_Consent::init();
}
