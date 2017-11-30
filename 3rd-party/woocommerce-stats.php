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

	static function getScriptTag() {
		if ( WC_Stats::isActiveStore() ) {
			return "
				<script type='text/javascript' src='https://stats.wp.com/s.js'></script>
			";
		}
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

	public function get_session_id() {
		$session_handler = new WC_Session_Handler();
		$session = $session_handler->get_session_cookie();
		return $session ? $session[ 0 ] : null;
	}

	public function writeDataToDom() {
		$cart = WC()->cart->get_cart();
		$cart_ids = array_reduce( $cart, array( $this, 'get_cart_ids' ), '' );
		$cart_quantities = array_reduce( $cart, array( $this, 'get_cart_quantities' ), '' );
		// Is this the right id? Is WooCommerce id different?
		$blog_id = Jetpack::get_option( 'id' );
		$post = get_post();
		$post_id = $post->ID;
		$post_type = get_post_type( $post_id );
		$store_page = $this->get_store_page( $post_type, $post_id );
		$order_number = $_GET['key'];
		$tracks_identity = jetpack_tracks_get_identity( get_current_user_id() );
//		data-ut='" . $tracks_identity[ '_ut' ] . "'
//		data-ui='" . $tracks_identity[ '_ui' ] . "'>
		$session_id = $this->get_session_id();

		echo "
			<div 
				id='store_data'
				style='display: none;' 
				data-blog_id='" . $blog_id . "'
				data-post='" . $post_id . "'
				data-cart='" . $session_id . "'
				data-cart_i='" . $cart_ids . "'
				data-cart_q='" . $cart_quantities . "'>
				
			</div>
		";
	}
}

WC_Stats::init();
