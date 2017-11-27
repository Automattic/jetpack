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
		/**
		 * Make sure WooCommerce is installed and active
		 *
		 * This action is documented in https://docs.woocommerce.com/document/create-a-plugin
		 */
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

		add_action( 'wp_enqueue_scripts', array( $this, 'writeDataToDom' ) );
	}

	public function get_cart_ids( $result, $item ) {
		$comma = strlen( $result ) > 0 ? ',' : '';
		return $result . $comma . $item['product_id'];
	}

	public function get_cart_quantities( $result, $item ) {
		$comma = strlen( $result ) > 0 ? ',' : '';
		return $result . $comma . $item['quantity'];
	}

	public function get_store_page( $post_type, $post_id ) {
		if ( 'product' === $post_type ) {
			return 'product';
		}

		switch ( $post_id ) {
			case get_option( 'woocommerce_cart_page_id' ):
				return 'cart_view';
			case get_option( 'woocommerce_checkout_page_id' ):
				global $wp;
				if ( false !== strpos( $wp->request, 'order-received' ) ) {
					return 'checkout_complete';
				}
				return 'checkout_view';
			case get_option( 'woocommerce_view_order_page_id' ):
				return 'view_order';
			default:
				return $post_type;
		}
	}

	public function writeDataToDom() {
		$cart = WC()->cart->get_cart();
		$cart_ids = array_reduce( $cart, array( $this, 'get_cart_ids' ), '' );
		$cart_quantities = array_reduce( $cart, array( $this, 'get_cart_quantities' ), '' );
		// Is this the right id? Is WooCommerce id different?
		$store_id = Jetpack::get_option( 'id' );
		$post = get_post();
		$post_id = $post->ID;
		$post_type = get_post_type( $post_id );
		$store_page = $this->get_store_page( $post_type, $post_id );
		$order_number = $_GET['key'];

		echo "
			<div 
				id='store_data'
				style='display: none;' 
				data-store_id='" . $store_id . "'
				data-post_type='" . $post_type . "'
				data-post_id='" . $post_id . "'
				data-store_page='" . $store_page . "'
				data-cart_ids='" . $cart_ids . "'
				data-cart_quantities='" . $cart_quantities . "'
				data-order_number='" . $order_number . "'>
			</div>
		";
	}
}

WC_Stats::init();
