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
		if ( ! WC_Stats::isActiveStore() ) {
			return;
		}

		if ( is_null( self::$instance ) ) {
			self::$instance = new WC_Stats();
		}
		return self::$instance;
	}

	public function isActiveStore() {
		// Tracking only Site pages
		if ( is_admin() ) {
			return false;
		}
		// Make sure Jetpack is installed and active
		if ( ! Jetpack::is_active() ) {
			return false;
		}

		/**
		 * Make sure WooCommerce is installed and active
		 *
		 * This action is documented in https://docs.woocommerce.com/document/create-a-plugin
		 */
		if ( ! in_array( 'woocommerce/woocommerce.php', apply_filters( 'active_plugins', get_option( 'active_plugins' ) ) ) ) {
			return false;
		}

		return true;
	}

	public function __construct() {
		$this->jetpack = Jetpack::init();
		// add store analytics parameters
		add_action( 'wp_enqueue_scripts', array( $this, 'register_params_scripts' ), 1 );

		// add s.js at the end
		add_action( 'wp_enqueue_scripts', array( $this, 'register_s_script' ), 10 );
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

	public function get_session_id() {
		$session_handler = new WC_Session_Handler();
		$session = $session_handler->get_session_cookie();
		return $session ? $session[ 0 ] : null;
	}

	public function register_s_script() {
		if ( ! is_admin() ) {
			wp_register_script( 'wc_tk_s', 'https://stats.wp.com/s.js', null, null, true );
			wp_enqueue_script( 'wc_tk_s' );
		}
	}

	public function register_params_scripts() {
		if ( ! is_admin() ) {
			$event_params = $this->collect_params();
			wp_register_script( 'wc_tk', null, null, '1.0', true );
			wp_localize_script( 'wc_tk', 'tk_params', $event_params );
			wp_enqueue_script( 'wc_tk' );
		}
	}

	public function collect_params( $params = array() ) {
		if ( is_product() ) {
			$params[ 'blog_id' ] = Jetpack::get_option( 'id' );
			$post = get_post();
			$params[ 'product_id' ] = $post->ID;
		}
		if ( is_cart() ) {
			$cart = WC()->cart->get_cart();
			$params[ 'cart_id' ] = $this->get_session_id();
			$params[ 'cart_products' ] = array_reduce( $cart, array( $this, 'get_cart_ids' ), '' );
			$params[ 'cart_quantities' ] = array_reduce( $cart, array( $this, 'get_cart_quantities' ), '' );
		}
		return $params;
	}
}

WC_Stats::init();
