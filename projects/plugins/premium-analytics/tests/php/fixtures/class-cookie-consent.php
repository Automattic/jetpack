<?php
/**
 * Cookie Consent initializer test double.
 *
 * @package automattic/jetpack-premium-analytics-plugin
 */

namespace Automattic\Jetpack\CookieConsent;

/**
 * Records calls to the Cookie Consent initializer.
 */
class Cookie_Consent {
	/**
	 * Record an initialization call.
	 *
	 * @param array $config Cookie Consent configuration.
	 * @return void
	 */
	public static function init( array $config = array() ) {
		$GLOBALS['jpa_test_cookie_consent_init_configs'][] = $config;
	}
}
