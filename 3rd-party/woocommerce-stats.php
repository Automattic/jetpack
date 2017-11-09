<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class WC_Stats {
	/**
	 * @var Jetpack
	 **/
	private $jetpack;

	/**
	 * @var WC_Stats
	 **/
	private static $instance = null;

	static function init() {
		// Tracking only Site pages
		if ( is_admin() ) {
			return;
		}
		// Make sure Jetpack is installed and active
		if ( ! Jetpack::is_active() ) {
			return;
		}
		// Make sure WooCommerce is installed and active
		if ( ! in_array( 'woocommerce/woocommerce.php', apply_filters( 'active_plugins', get_option( 'active_plugins' ) ) ) ) {
			return;
		}
		if ( is_null( self::$instance ) ) {
			self::$instance = new WC_Stats();
		}
		return self::$instance;
	}

	public function __construct() {
		$this->jetpack = Jetpack::init();

		add_action( 'init', array( $this, 'track' ) );
	}

	public function track() {
		echo "<pre>";
//		print_r( WC_Data::get_data_store() );
//		print_r( WC_Cart::get_cart_from_session() );
//		print_r( WC()->cart->cart_contents );
		print_r( WC() );
//		global $wp_query;
//		print_r($wp_query);
		echo "</pre>";
	}
}

WC_Stats::init();
