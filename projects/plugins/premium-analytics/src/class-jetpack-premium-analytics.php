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
		// No menu_title: the package supplies its own translated label. Passing one here would
		// mean translating it on plugins_loaded, too early for the textdomain to be loaded.
		Analytics::init();

		// Priority 0 leaves time for Cookie Consent to register its own default-priority
		// init callbacks when the development config filter enables the package.
		add_action( 'init', array( __CLASS__, 'init_cookie_consent' ), 0 );
	}

	/**
	 * Initialize Cookie Consent once WordPress translations can load safely.
	 *
	 * @return void
	 */
	public static function init_cookie_consent() {
		// Ships disabled: the banner is planned for a later release. The package stays wired up
		// so the `jetpack_cookie_consent_config` filter can switch it back on for development.
		Cookie_Consent::init( array( 'enabled' => false ) );
	}
}
