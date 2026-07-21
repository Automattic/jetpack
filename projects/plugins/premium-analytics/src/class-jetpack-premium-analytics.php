<?php
/**
 * Primary class file for the Jetpack Premium Analytics plugin.
 *
 * @package automattic/jetpack-premium-analytics-plugin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

use Automattic\Jetpack\CookieConsent\Cookie_Consent;
use Automattic\Jetpack\PremiumAnalytics\Analytics;

/**
 * Class Jetpack_Premium_Analytics
 *
 * Thin wrapper that initializes the premium-analytics package.
 *
 * @phan-constructor-used-for-side-effects
 */
class Jetpack_Premium_Analytics {

	/**
	 * Constructor.
	 */
	public function __construct() {
		Analytics::init( array( 'menu_title' => 'Analytics' ) );

		// Ships disabled: the banner is planned for a later release. The package stays wired up
		// so the `jetpack_cookie_consent_config` filter can switch it back on for development.
		Cookie_Consent::init( array( 'enabled' => false ) );
	}
}
