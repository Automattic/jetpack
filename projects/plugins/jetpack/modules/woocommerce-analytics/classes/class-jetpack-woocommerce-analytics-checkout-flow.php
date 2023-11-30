<?php
/**
 * Jetpack_WooCommerce_Analytics_Checkout_Flow
 *
 * @package automattic/jetpack
 * @author Automattic
 */

/**
 * Bail if accessed directly
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Jetpack_WooCommerce_Analytics_Checkout_Flow
 * Class that handles all page view events for the checkout flow (from product view to order confirmation view)
 */
class Jetpack_WooCommerce_Analytics_Checkout_Flow {

	use Jetpack_WooCommerce_Analytics_Trait;

	/**
	 * Jetpack_WooCommerce_Analytics_Checkout_Flow constructor.
	 */
	public function __construct() {
		$this->find_cart_checkout_content_sources();

		// single product page view.
		add_action( 'woocommerce_after_single_product', array( $this, 'capture_product_view' ) );

		// order confirmed page view
		add_action( 'woocommerce_thankyou', array( $this, 'capture_order_confirmation_view' ), 10, 1 );

		// cart page view
		add_action( 'wp_footer', array( $this, 'capture_cart_view' ) );

		// checkout page view
		add_action( 'wp_footer', array( $this, 'capture_checkout_view' ) );
	}

		/**
		 * Track a product page view
		 */
	public function capture_product_view() {
		global $product;
		if ( ! $product instanceof WC_Product ) {
			return;
		}

		$this->record_event(
			'woocommerceanalytics_product_view',
			array(),
			$product->get_id()
		);
	}

	/**
	 * Track the order confirmation page view
	 */
	public function capture_order_confirmation_view() {
		$order_id = absint( get_query_var( 'order-received' ) );
		if ( ! $order_id ) {
			return;
		}

		if ( ! is_order_received_page() ) {
			return;
		}

		$this->record_event(
			'woocommerceanalytics_order_confirmation_view',
			array()
		);
	}

	/**
	 * Track the cart page view
	 */
	public function capture_cart_view() {
		if ( ! is_cart() ) {
			return;
		}
		$this->record_event(
			'woocommerceanalytics_cart_view',
			array()
		);
	}

	/**
	 * Track the checkout page view
	 */
	public function capture_checkout_view() {
		if ( ! is_checkout() ) {
			return;
		}

		// Order received page is also a checkout page, so we need to bail out if we are on that page.
		if ( is_order_received_page() ) {
			return;
		}

		$this->record_event(
			'woocommerceanalytics_checkout_view',
			array()
		);
	}
}
