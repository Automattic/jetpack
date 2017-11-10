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
		// Does tracks take care of this?
		$user_id = get_current_user_id();
		$cart = WC()->cart->get_cart();
		$cart_ids = array_map( array( $this, 'get_cart_ids' ), $cart );
		$cart_quantities = array_map( array( $this, 'get_cart_quantities' ), $cart );
		// Is this the right id? Is WooCommerce id different?
		$store_id = Jetpack::get_option( 'id' );
		$post = get_post();
		$post_id = $post->ID;
		$post_type = get_post_type( $post_id );
		$post_name = $post->post_name;

		echo "<pre>";
		echo "user id: ";
		print_r( $user_id );
		echo "<br/>";
		echo "post type: ";
		print_r( $post_type );
		echo "<br/>";
		echo "post name: ";
		print_r( $post_name );
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

// Use these to track funnel steps
//get_option( 'woocommerce_shop_page_id' );
//get_option( 'woocommerce_cart_page_id' );
//get_option( 'woocommerce_checkout_page_id' );
//get_option( 'woocommerce_pay_page_id' );
//get_option( 'woocommerce_thanks_page_id' );
//get_option( 'woocommerce_myaccount_page_id' );
//get_option( 'woocommerce_edit_address_page_id' );
//get_option( 'woocommerce_view_order_page_id' );
//get_option( 'woocommerce_terms_page_id' );
