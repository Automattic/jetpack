<?php
/**
 * Jetpack_WooCommerce_Analytics is ported from the Jetpack_Google_Analytics code.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Assets;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require __DIR__ . '/classes/class-jetpack-woocommerce-analytics-trait.php';
require_once __DIR__ . '/classes/class-jetpack-woocommerce-analytics-universal.php';
require_once __DIR__ . '/classes/class-jetpack-woocommerce-analytics-my-account.php';
require_once __DIR__ . '/classes/class-jetpack-woocommerce-analytics-checkout-flow.php';

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
	 * Instance of the Checkout Flow functions
	 *
	 * @var Static property to hold concrete analytics implementation that does the work.
	 */
	private static $views = false;

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
		// loading _wca.
		add_action( 'wp_head', array( $this, 'wp_head_top' ), 1 );

		// loading s.js.
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_tracking_script' ) );

		self::$analytics = new Jetpack_WooCommerce_Analytics_Universal();
		self::$myaccount = new Jetpack_WooCommerce_Analytics_My_Account();
		if ( class_exists( 'Automattic\WooCommerce\Blocks\Package' ) && version_compare( Automattic\WooCommerce\Blocks\Package::get_version(), '11.6.2', '>=' ) ) {
			self::$views = new Jetpack_WooCommerce_Analytics_Checkout_Flow();
		}
	}

		/**
		 * Make _wca available to queue events
		 */
	public function wp_head_top() {
		if ( is_cart() || is_checkout() || is_checkout_pay_page() || is_order_received_page() || is_add_payment_method_page() ) {
			echo '<script>window._wca_prevent_referrer = true;</script>' . "\r\n";
		}
		echo '<script>window._wca = window._wca || [];</script>' . "\r\n";
	}

	/**
	 * Place script to call s.js, Store Analytics.
	 */
	public function enqueue_tracking_script() {
		$filename = sprintf(
			'https://stats.wp.com/s-%d.js',
			gmdate( 'YW' )
		);

		Assets::enqueue_async_script( 'woocommerce-analytics', esc_url( $filename ), esc_url( $filename ), array(), null, false );
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
