<?php
/**
 * Jetpack_WooCommerce_Analytics is ported from the Jetpack_Google_Analytics code.
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require __DIR__ . '/classes/class-jetpack-woocommerce-analytics-trait.php';
require_once __DIR__ . '/classes/class-jetpack-woocommerce-analytics-universal.php';
require_once __DIR__ . '/classes/class-jetpack-woocommerce-analytics-my-account.php';

/**
 * Class Jetpack_WooCommerce_Analytics
 * Instantiate WooCommerce Analytics
 */
class Jetpack_WooCommerce_Analytics {

	/**
	 * Instance of this class
	 *
	 * @var Jetpack_WooCommerce_Analytics - Static property to hold our singleton instance
	 */
	private static $instance = false;

	/**
	 * Instance of the Universal functions
	 *
	 * @var Static property to hold concrete analytics implementation that does the work (universal or legacy)
	 */
	private static $analytics = false;

	/**
	 * Instance of the My account functions
	 *
	 * @var Static property to hold concrete analytics implementation that does the work.
	 */
	private static $myaccount = false;

	/**
	 * WooCommerce Analytics is only available to Jetpack connected WooCommerce stores with both plugins set to active
	 * and WooCommerce version 3.0 or higher
	 *
	 * @return bool
	 */
	public static function should_track_store() {
		/**
		 * Make sure WooCommerce is installed and active
		 *
		 * This action is documented in https://docs.woocommerce.com/document/create-a-plugin
		 */
		if ( ! in_array( 'woocommerce/woocommerce.php', apply_filters( 'active_plugins', Jetpack::get_active_plugins() ), true ) ) {
			return false;
		}
		// Tracking only Site pages.
		if ( is_admin() ) {
			return false;
		}
		// Make sure Jetpack is installed and connected.
		if ( ! Jetpack::is_connection_ready() ) {
			return false;
		}
		// Ensure the WooCommerce class exists and is a valid version.
		$minimum_woocommerce_active = class_exists( 'WooCommerce' ) && version_compare( WC_VERSION, '3.0', '>=' );
		if ( ! $minimum_woocommerce_active ) {
			return false;
		}
		return true;
	}

	/**
	 * This is our constructor, which is private to force the use of get_instance()
	 *
	 * @return void
	 */
	private function __construct() {
		self::$analytics = new Jetpack_WooCommerce_Analytics_Universal();
		self::$myaccount = new Jetpack_WooCommerce_Analytics_My_Account();
	}

	/**
	 * Function to instantiate our class and make it a singleton
	 */
	public static function get_instance() {
		if ( ! self::should_track_store() ) {
			return;
		}
		if ( ! self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}
}

global $jetpack_woocommerce_analytics;
$jetpack_woocommerce_analytics = Jetpack_WooCommerce_Analytics::get_instance();
