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

		// event woocommerce_init ??
		add_action( 'wp_enqueue_scripts', array( $this, 'track' ) );
	}

	public function get_cart_ids( $item ) {
		return $item[ 'product_id' ];
	}

	public function get_cart_quantities( $item ) {
		return $item[ 'quantity' ];
	}

	public function track() {
		$cart = WC()->cart->get_cart();
		$cart_ids = array_map( array( $this, 'get_cart_ids' ), $cart );
		$cart_quantities = array_map( array( $this, 'get_cart_quantities' ), $cart );
		$store_id = Jetpack::get_option( 'id' );
		$post_id = get_the_ID();
		$post_type = get_post_type( $post_id );

		echo "<pre>";
		echo "post type: ";
		print_r( $post_type );
		echo "<br/>";
		echo "post id: ";
		print_r( $post_id );
		echo "<br/>";
		echo "store id: ";
		print_r( $store_id );
		echo "<br/>";
		echo "cart ids: ";
		print_r( $cart_ids );
		echo "<br/>";
		echo "cart quantities: ";
		print_r( $cart_quantities );
		echo "</pre>";
	}
}

WC_Stats::init();
