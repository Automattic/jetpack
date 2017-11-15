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

		add_action( 'wp_enqueue_scripts', array( $this, 'track' ) );
		add_action( 'rest_api_init', function() {
			register_rest_route( 'jetpack/v4', '/tracks', array(
				'methods' => 'POST',
				'callback' => array( $this, 'handle_client_tracks' ),
			) );
		} );
	}

	public function handle_client_tracks( $request ) {
		return json_encode( $request->get_params() );
	}

	public function get_cart_ids( $item ) {
		return $item[ 'product_id' ];
	}

	public function get_cart_quantities( $item ) {
		return $item[ 'quantity' ];
	}

	public function get_uncachable_page_type( $post_id ) {

		switch ( $post_id ) {
			case get_option( 'woocommerce_cart_page_id' ):
				return 'cart_view';
			case get_option( 'woocommerce_checkout_page_id' ):
				global $wp;
				if ( strpos( $wp->request, 'order-received' ) !== false ) {
					return 'checkout_complete';
				}
				return 'checkout_view';
			case get_option( 'woocommerce_view_order_page_id' ):
				return 'view_order';
			default:
				null;
		}
	}

	public function track() {
		$cart = WC()->cart->get_cart();
		$cart_ids = array_map( array( $this, 'get_cart_ids' ), $cart );
		$cart_quantities = array_map( array( $this, 'get_cart_quantities' ), $cart );
		// Is this the right id? Is WooCommerce id different?
		$store_id = Jetpack::get_option( 'id' );
		$post = get_post();
		$post_id = $post->ID;
		$post_type = get_post_type( $post_id );
		$post_name = $post->post_name;
		$uncachable_page_type = $this->get_uncachable_page_type( $post_id );
		if ( $uncachable_page_type ) {
			echo "<pre style=\"font-size: 12px;\">";
			echo "Tracks properties sent by PHP:";
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
			echo "page type: ";
			print_r( $uncachable_page_type );
			echo "<br/>";
			echo "cart ids: ";
			print_r( $cart_ids );
			echo "<br/>";
			echo "cart quantities: ";
			print_r( $cart_quantities );
			if ( isset( $_GET[ 'key' ] ) ) {
				echo "<br/>";
				echo "order number: ";
				print_r( $_GET[ 'key' ] );
			}
			echo "</pre>";
		} else {
			wc_enqueue_js(
				"var data = {
					'post_type': '" . $post_type . "',
					'post_id': " . $post_id . ",
					'post_name': '" . $post_name . "',
					'store_id': " . $store_id . ",
					'cart_ids': " . json_encode( $cart_ids ) . ",
					'cart_quantities': " . json_encode( $cart_quantities ) . "
				};
				jQuery.post( 'wp-json/jetpack/v4/tracks', data, function(response) {
					console.log( 'Tracks properties sent by PHP:' );
					console.log( JSON.parse( response ) );
				});"
			);
		}
	}
}

WC_Stats::init();
