<?php
/**
 * Module Name: Progressive Web Apps
 * Module Description: Speed up and improve the reliability of your site using the latest in web technology.
 * Sort Order: 38
 * Recommendation Order: 18
 * First Introduced: 5.6.0
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: Developers
 * Feature: Traffic
 * Additional Search Queries: manifest, pwa, progressive
 */

require_once ( JETPACK__PLUGIN_DIR . 'modules/pwa/class.jetpack-pwa-helpers.php' );
require_once ( JETPACK__PLUGIN_DIR . 'modules/pwa/class.jetpack-pwa-manifest.php' );

class Jetpack_PWA {
	/**
	 * @var Jetpack_PWA
	 */
	private static $__instance = null;

	/**
	 * Singleton implementation
	 *
	 * @return Jetpack_PWA
	 */
	public static function instance() {
		if ( is_null( self::$__instance ) ) {
			self::$__instance = new Jetpack_PWA;
		}

		return self::$__instance;
	}

	private function __construct() {
		Jetpack_PWA_Manifest::instance();
	}
}

Jetpack_PWA::instance();
