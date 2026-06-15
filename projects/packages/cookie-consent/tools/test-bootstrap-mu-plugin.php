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

$jetpack_cookie_consent_autoload = __DIR__ . '/../vendor/autoload.php';

if ( file_exists( $jetpack_cookie_consent_autoload ) ) {
	require_once $jetpack_cookie_consent_autoload;
	Cookie_Consent::init();
}
