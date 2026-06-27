<?php
/**
 * POC: gated consumer of the jetpack-cookie-consent package (EDI-425).
 *
 * Proof of concept only — NOT production ready. When explicitly enabled, this
 * boots the new Accept / Reject / Customize consent banner from the
 * jetpack-cookie-consent package on a standard Jetpack site, and suppresses the
 * legacy `eucookielaw` Cookie Consent block (see
 * extensions/blocks/cookie-consent/cookie-consent.php) so only one banner renders.
 *
 * Default is OFF. Enable with either:
 *   define( 'JETPACK_COOKIE_CONSENT_POC', true ); // in wp-config.php
 *   add_filter( 'jetpack_enable_cookie_consent_poc', '__return_true' );
 *
 * The package additionally needs the WP Consent API plugin active to write
 * consent state. Out of scope for this POC: admin UI / settings, Consent API
 * bundling, copy/region configuration, and any rollout decision.
 *
 * @link https://linear.app/a8c/issue/EDI-425
 * @link https://github.com/Automattic/jetpack/pull/49736 (the mirrored Premium Analytics integration)
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\CookieConsent\Cookie_Consent;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Single gate for the cookie-consent reject-button POC (EDI-425).
 *
 * Used both to decide whether to boot the package and whether to suppress the
 * legacy block, so the two stay in lockstep.
 *
 * @return bool Whether the POC is enabled.
 */
function jetpack_cookie_consent_poc_enabled() {
	/**
	 * Filters whether the cookie-consent reject-button POC is enabled.
	 *
	 * Defaults to the JETPACK_COOKIE_CONSENT_POC constant.
	 *
	 * @since $$next-version$$
	 *
	 * @param bool $enabled Whether the POC is enabled.
	 */
	return (bool) apply_filters(
		'jetpack_enable_cookie_consent_poc',
		defined( 'JETPACK_COOKIE_CONSENT_POC' ) && JETPACK_COOKIE_CONSENT_POC
	);
}

/**
 * Boot the jetpack-cookie-consent package when the POC is enabled.
 *
 * Mirrors the Premium Analytics integration (PR #49736): the only functional
 * boot step is Cookie_Consent::init().
 *
 * @return void
 */
function jetpack_cookie_consent_poc_init() {
	if ( ! jetpack_cookie_consent_poc_enabled() ) {
		return;
	}

	if ( class_exists( Cookie_Consent::class ) ) {
		Cookie_Consent::init();
	}
}
