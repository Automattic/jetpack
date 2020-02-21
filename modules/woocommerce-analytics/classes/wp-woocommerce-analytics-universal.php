<?php
/**
 * Jetpack_WooCommerce_Analytics_Universal
 *
 * @package Jetpack
 * @author Automattic
 */

/**
 * Bail if accessed directly
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Jetpack_WooCommerce_Analytics_Universal
 * Filters and Actions added to Store pages to perform analytics
 */
class Jetpack_WooCommerce_Analytics_Universal {
	/**
	 * Jetpack_WooCommerce_Analytics_Universal constructor.
	 */
	public function __construct() {
		// loading _wca
		add_action( 'wp_head', array( $this, 'wp_head_top' ), 1 );

		// add to carts from non-product pages or lists (search, store etc.)
		add_action( 'wp_head', array( $this, 'loop_session_events' ), 2 );

		// loading s.js.
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_tracking_script' ) );

		// Capture cart events
		add_action( 'woocommerce_add_to_cart', array( $this, 'capture_add_to_cart' ), 10, 6 );

		// single product page view
		add_action( 'woocommerce_after_single_product', array( $this, 'capture_product_view' ) );

		add_action( 'woocommerce_after_cart', array( $this, 'remove_from_cart' ) );
		add_action( 'woocommerce_after_mini_cart', array( $this, 'remove_from_cart' ) );
		add_action( 'wcct_before_cart_widget', array( $this, 'remove_from_cart' ) );
		add_filter( 'woocommerce_cart_item_remove_link', array( $this, 'remove_from_cart_attributes' ), 10, 2 );

		// cart checkout
		add_action( 'woocommerce_after_checkout_form', array( $this, 'checkout_process' ) );

		// order confirmed
		add_action( 'woocommerce_thankyou', array( $this, 'order_process' ), 10, 1 );
		add_action( 'woocommerce_after_cart', array( $this, 'remove_from_cart_via_quantity' ), 10, 1 );
	}

	/**
	 * Make _wca available to queue events
	 */
	public function wp_head_top() {
		if ( is_cart() || is_checkout() || is_checkout_pay_page() || is_order_received_page() || is_add_payment_method_page() ) {
			$prevent_referrer_code = '<script>window._wca_prevent_referrer = true;</script>';
			echo "$prevent_referrer_code\r\n";
		}
		$wca_code = '<script>window._wca = window._wca || [];</script>';
		echo "$wca_code\r\n";
	}


	/**
	 * Place script to call s.js, Store Analytics.
	 */
	public function enqueue_tracking_script() {
		$filename = sprintf(
			'https://stats.wp.com/s-%d.js',
			gmdate( 'YW' )
		);

		// phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion
		wp_enqueue_script( 'woocommerce-analytics', esc_url( $filename ), array(), null, false );
	}

	/**
	 * On product lists or other non-product pages, add an event listener to "Add to Cart" button click
	 */
	public function loop_session_events() {
		$blogid = Jetpack::get_option( 'id' );

		// check for previous add-to-cart cart events
		if ( is_object( WC()->session ) ) {
			$data = WC()->session->get( 'wca_session_data' );
			if ( ! empty( $data ) ) {
				foreach ( $data as $data_instance ) {
					$product = wc_get_product( $data_instance['product_id'] );
					if ( ! $product instanceof WC_Product ) {
						continue;
					}
					$product_details = $this->get_product_details( $product );
					wc_enqueue_js(
						"_wca.push( {
								'_en': '" . esc_js( $data_instance['event'] ) . "',
								'blog_id': '" . esc_js( $blogid ) . "',
								'pi': '" . esc_js( $data_instance['product_id'] ) . "',
								'pn': '" . esc_js( $product_details['name'] ) . "',
								'pc': '" . esc_js( $product_details['category'] ) . "',
								'pp': '" . esc_js( $product_details['price'] ) . "',
								'pq': '" . esc_js( $data_instance['quantity'] ) . "',
								'pt': '" . esc_js( $product_details['type'] ) . "',
								'ui': '" . esc_js( $this->get_user_id() ) . "',
							} );"
					);
				}
				// clear data
				WC()->session->set( 'wca_session_data', '' );
			}
		}
	}

	/**
	 * On the cart page, add an event listener for removal of product click
	 */
	public function remove_from_cart() {

		// We listen at div.woocommerce because the cart 'form' contents get forcibly
		// updated and subsequent removals from cart would then not have this click
		// handler attached.
		$blogid = Jetpack::get_option( 'id' );
		wc_enqueue_js(
			"jQuery( 'div.woocommerce' ).on( 'click', 'a.remove', function() {
				var productID = jQuery( this ).data( 'product_id' );
				var quantity = jQuery( this ).parent().parent().find( '.qty' ).val()
				var productDetails = {
					'id': productID,
					'quantity': quantity ? quantity : '1',
				};
				_wca.push( {
					'_en': 'woocommerceanalytics_remove_from_cart',
					'blog_id': '" . esc_js( $blogid ) . "',
					'pi': productDetails.id,
					'pq': productDetails.quantity,
					'ui': '" . esc_js( $this->get_user_id() ) . "',
				} );
			} );"
		);
	}

	/**
	 * Adds the product ID to the remove product link (for use by remove_from_cart above) if not present
	 *
	 * @param string $url Full HTML a tag of the link to remove an item from the cart.
	 * @param string $key Unique Key ID for a cart item.
	 *
	 * @return mixed.
	 */
	public function remove_from_cart_attributes( $url, $key ) {
		if ( false !== strpos( $url, 'data-product_id' ) ) {
			return $url;
		}

		$item    = WC()->cart->get_cart_item( $key );
		$product = $item['data'];

		$new_attributes = sprintf(
			'" data-product_id="%s">',
			esc_attr( $product->get_id() )
		);

		$url = str_replace( '">', $new_attributes, $url );
		return $url;
	}

	/**
	 * Gather relevant product information
	 *
	 * @param array $product product
	 * @return array
	 */
	public function get_product_details( $product ) {
		return array(
			'id'       => $product->get_id(),
			'name'     => $product->get_title(),
			'category' => $this->get_product_categories_concatenated( $product ),
			'price'    => $product->get_price(),
			'type'     => $product->get_type(),
		);
	}

	/**
	 * Track a product page view
	 */
	public function capture_product_view() {

		global $product;
		$blogid          = Jetpack::get_option( 'id' );
		$product_details = $this->get_product_details( $product );

		wc_enqueue_js(
			"_wca.push( {
				'_en': 'woocommerceanalytics_product_view',
				'blog_id': '" . esc_js( $blogid ) . "',
				'pi': '" . esc_js( $product_details['id'] ) . "',
				'pn': '" . esc_js( $product_details['name'] ) . "',
				'pc': '" . esc_js( $product_details['category'] ) . "',
				'pp': '" . esc_js( $product_details['price'] ) . "',
				'pt': '" . esc_js( $product_details['type'] ) . "',
				'ui': '" . esc_js( $this->get_user_id() ) . "',
			} );"
		);
	}

	/**
	 * On the Checkout page, trigger an event for each product in the cart
	 */
	public function checkout_process() {

		$universal_commands = array();
		$cart               = WC()->cart->get_cart();
		$blogid             = Jetpack::get_option( 'id' );

		foreach ( $cart as $cart_item_key => $cart_item ) {
			/**
			* This filter is already documented in woocommerce/templates/cart/cart.php
			*/
			$product = apply_filters( 'woocommerce_cart_item_product', $cart_item['data'], $cart_item, $cart_item_key );

			if ( ! $product ) {
				continue;
			}

			$product_details = $this->get_product_details( $product );

			$universal_commands[] = "_wca.push( {
				'_en': 'woocommerceanalytics_product_checkout',
				'blog_id': '" . esc_js( $blogid ) . "',
				'pi': '" . esc_js( $product_details['id'] ) . "',
				'pn': '" . esc_js( $product_details['name'] ) . "',
				'pc': '" . esc_js( $product_details['category'] ) . "',
				'pp': '" . esc_js( $product_details['price'] ) . "',
				'pq': '" . esc_js( $cart_item['quantity'] ) . "',
				'pt': '" . esc_js( $product_details['type'] ) . "',
				'ui': '" . esc_js( $this->get_user_id() ) . "',
			} );";
		}

		wc_enqueue_js( implode( "\r\n", $universal_commands ) );
	}

	/**
	 * After the checkout process, fire an event for each item in the order
	 *
	 * @param string $order_id Order Id.
	 */
	public function order_process( $order_id ) {
		$order              = wc_get_order( $order_id );
		$universal_commands = array();
		$blogid             = Jetpack::get_option( 'id' );

		// loop through products in the order and queue a purchase event.
		foreach ( $order->get_items() as $order_item_id => $order_item ) {
			$product = $order->get_product_from_item( $order_item );

			$product_details = $this->get_product_details( $product );

			$universal_commands[] = "_wca.push( {
				'_en': 'woocommerceanalytics_product_purchase',
				'blog_id': '" . esc_js( $blogid ) . "',
				'pi': '" . esc_js( $product_details['id'] ) . "',
				'pn': '" . esc_js( $product_details['name'] ) . "',
				'pc': '" . esc_js( $product_details['category'] ) . "',
				'pp': '" . esc_js( $product_details['price'] ) . "',
				'pq': '" . esc_js( $order_item->get_quantity() ) . "',
				'pt': '" . esc_js( $product_details['type'] ) . "',
				'oi': '" . esc_js( $order->get_order_number() ) . "',
				'ui': '" . esc_js( $this->get_user_id() ) . "',
			} );";
		}

		wc_enqueue_js( implode( "\r\n", $universal_commands ) );
	}

	/**
	 * Listen for clicks on the "Update Cart" button to know if an item has been removed by
	 * updating its quantity to zero
	 */
	public function remove_from_cart_via_quantity() {
		$blogid = Jetpack::get_option( 'id' );

		wc_enqueue_js(
			"
			jQuery( 'button[name=update_cart]' ).on( 'click', function() {
				var cartItems = jQuery( '.cart_item' );
				cartItems.each( function( item ) {
					var qty = jQuery( this ).find( 'input.qty' );
					if ( qty && qty.val() === '0' ) {
						var productID = jQuery( this ).find( '.product-remove a' ).data( 'product_id' );
						_wca.push( {
							'_en': 'woocommerceanalytics_remove_from_cart',
							'blog_id': '" . esc_js( $blogid ) . "',
							'pi': productID,
							'ui': '" . esc_js( $this->get_user_id() ) . "',
						} );
					}
				} );
			} );
		"
		);
	}

	/**
	 * Get the current user id
	 *
	 * @return int
	 */
	public function get_user_id() {
		if ( is_user_logged_in() ) {
			$blogid = Jetpack::get_option( 'id' );
			$userid = get_current_user_id();
			return $blogid . ':' . $userid;
		}
		return 'null';
	}

	/**
	 * @param $cart_item_key
	 * @param $product_id
	 * @param $quantity
	 * @param $variation_id
	 * @param $variation
	 * @param $cart_item_data
	 */
	public function capture_add_to_cart( $cart_item_key, $product_id, $quantity, $variation_id, $variation, $cart_item_data ) {
		$referer_postid = isset( $_SERVER['HTTP_REFERER'] ) ? url_to_postid( $_SERVER['HTTP_REFERER'] ) : 0;
		// if the referring post is not a product OR the product being added is not the same as post
		// (eg. related product list on single product page) then include a product view event
		$product_by_referer_postid = wc_get_product( $referer_postid );
		if ( ! $product_by_referer_postid instanceof WC_Product || (int) $product_id !== $referer_postid ) {
			$this->capture_event_in_session_data( $product_id, $quantity, 'woocommerceanalytics_product_view' );
		}
		// add cart event to the session data
		$this->capture_event_in_session_data( $product_id, $quantity, 'woocommerceanalytics_add_to_cart' );
	}

	/**
	 * @param $product_id
	 * @param $quantity
	 * @param $event
	 */
	public function capture_event_in_session_data( $product_id, $quantity, $event ) {

		$product = wc_get_product( $product_id );
		if ( ! $product instanceof WC_Product ) {
			return;
		}

		$quantity = ( $quantity == 0 ) ? 1 : $quantity;

		// check for existing data
		if ( is_object( WC()->session ) ) {
			$data = WC()->session->get( 'wca_session_data' );
			if ( empty( $data ) || ! is_array( $data ) ) {
				$data = array();
			}
		} else {
			$data = array();
		}

		// extract new event data
		$new_data = array(
			'event'      => $event,
			'product_id' => (string) $product_id,
			'quantity'   => (string) $quantity,
		);

		// append new data
		$data[] = $new_data;

		WC()->session->set( 'wca_session_data', $data );
	}

	/**
	 * Gets product categories or varation attributes as a formatted concatenated string
	 *
	 * @param object $product WC_Product.
	 * @return string
	 */
	public function get_product_categories_concatenated( $product ) {

		if ( ! $product instanceof WC_Product ) {
			return '';
		}

		$variation_data = $product->is_type( 'variation' ) ? wc_get_product_variation_attributes( $product->get_id() ) : '';
		if ( is_array( $variation_data ) && ! empty( $variation_data ) ) {
			$line = wc_get_formatted_variation( $variation_data, true );
		} else {
			$out        = array();
			$categories = get_the_terms( $product->get_id(), 'product_cat' );
			if ( $categories ) {
				foreach ( $categories as $category ) {
					$out[] = $category->name;
				}
			}
			$line = join( '/', $out );
		}
		return $line;
	}

}
