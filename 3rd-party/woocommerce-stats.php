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

		add_action( 'woocommerce_init', array( $this, 'track' ) );
	}

	public function get_cart_ids( $item ) {
		return $item[ 'product_id' ];
	}

	public function track() {
		$cart = WC()->cart->get_cart();
		$cart_ids = array_map( array( $this, 'get_cart_ids' ), $cart );

		echo "<pre>";
		print_r( $cart_ids );
		echo "</pre>";
	}
}

WC_Stats::init();
