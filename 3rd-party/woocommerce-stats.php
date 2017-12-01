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
		// add store analytics for product views and add-to-cart events
		add_action( 'wp_enqueue_scripts', array( $this, 'product_and_add_to_cart_events' ), 1 );

		// add store analytics for purchase events
		add_action( 'woocommerce_payment_complete', array( $this, 'handle_purchase_event' ), 10, 1 );

		// add s.js at the end
		add_action( 'wp_enqueue_scripts', array( $this, 'register_s_script' ), 10 );

		add_action( 'woocommerce_add_to_cart', array( $this, 'capture_add_to_cart_from_product_page' ), 10, 6 );
	}

	public function get_cart_ids( $result, $item ) {
		$comma = strlen( $result ) > 0 ? ',' : '';
		return $result . $comma . $item['product_id'];
	}

	public function get_cart_quantities( $result, $item ) {
		$comma = strlen( $result ) > 0 ? ',' : '';
		return $result . $comma . $item['quantity'];
	}

	public function get_session_id() {
		// NOTE: one session can have multiple id's, this method is not sufficient
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

	public function product_and_add_to_cart_events() {
		$blogid = Jetpack::get_option( 'id' );
		$post_id = get_post()->ID;

		if ( is_product() ) {
			wc_enqueue_js( "
				window._sta = window._sta || [];
				_sta.push( { 
					_en: 'woocommerce_analytics_product_view',
					blog_id: " . $blogid . ",
					product_id: " . $post_id . ",
				} );
			" );
		} else {
			// How to get cart information here? Switch to using cart hash?
			wc_enqueue_js( "
				window._sta = window._sta || [];
				jQuery('body').on('added_to_cart',function(){
					_sta.push( {
						_en: 'woocommerce_analytics_product_view',
						blog_id: " . $blogid . ",
						product_id: " . $post_id . ",
					} );
					_sta.push( {
						_en: 'woocommerce_analytics_add_to_cart',
						blog_id: " . $blogid . ",
						cart_id: 'get_cart_id_from_somwhere??',
					} );
				});
			" );
		}
	}

	// this is when added from product page post request
	public function capture_add_to_cart_from_product_page() {
		$cart = WC()->cart->get_cart();
		wc_enqueue_js( "
			jQuery( function( $ ) {
				_sta.push( {
					_en: 'woocommerce_analytics_add_to_cart',
					blog_id: " . $blogid . ",
					cart_id: " . $this->get_session_id() . ",
					cart_products: " . array_reduce( $cart, array( $this, 'get_cart_ids' ), '' ) . ",
					cart_quantities: " . array_reduce( $cart, array( $this, 'get_cart_quantities' ), '' ) . "
				} );
			} );
		" );
	}

	public function handle_purchase_event() {
		$cart = WC()->cart->get_cart();
		// this one not working yet
		wc_enqueue_js( "
			window._sta = window._sta || [];
			_sta.push( {
				_en: 'woocommerce_analytics_purchase',
				blog_id: " . Jetpack::get_option( 'id' ) . ",
				cart_id: '" . $this->get_session_id() . "',
				cart_products: " . array_reduce( $cart, array( $this, 'get_cart_ids' ), '' ) . ",
				cart_quantities: " . array_reduce( $cart, array( $this, 'get_cart_quantities' ), '' ) . "
			} );
		" );
	}
}

WC_Stats::init();
