<?php
/**
 * Jetpack_WooCommerce_Analytics_Universal
 *
 * @package Jetpack
 * @author Automattic
 */

use Automattic\Jetpack\Assets;

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
		// loading _wca.
		add_action( 'wp_head', array( $this, 'wp_head_top' ), 1 );

		// add to carts from non-product pages or lists -- search, store etc.
		add_action( 'wp_head', array( $this, 'loop_session_events' ), 2 );

		// loading s.js.
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_tracking_script' ) );

		// Capture cart events.
		add_action( 'woocommerce_add_to_cart', array( $this, 'capture_add_to_cart' ), 10, 6 );

		// single product page view.
		add_action( 'woocommerce_after_single_product', array( $this, 'capture_product_view' ) );

		add_action( 'woocommerce_after_cart', array( $this, 'remove_from_cart' ) );
		add_action( 'woocommerce_after_mini_cart', array( $this, 'remove_from_cart' ) );
		add_action( 'wcct_before_cart_widget', array( $this, 'remove_from_cart' ) );
		add_filter( 'woocommerce_cart_item_remove_link', array( $this, 'remove_from_cart_attributes' ), 10, 2 );

		// Checkout.
		// Send events after checkout template (shortcode).
		add_action( 'woocommerce_after_checkout_form', array( $this, 'checkout_process' ) );
		// Send events after checkout block.
		add_action( 'woocommerce_blocks_enqueue_checkout_block_scripts_after', array( $this, 'checkout_process' ) );

		// order confirmed.
		add_action( 'woocommerce_thankyou', array( $this, 'order_process' ), 10, 1 );
		add_action( 'woocommerce_after_cart', array( $this, 'remove_from_cart_via_quantity' ), 10, 1 );
	}

	/**
	 * Make _wca available to queue events
	 */
	public function wp_head_top() {
		if ( is_cart() || is_checkout() || is_checkout_pay_page() || is_order_received_page() || is_add_payment_method_page() ) {
			echo '<script>window._wca_prevent_referrer = true;</script>' . "\r\n";
		}
		echo '<script>window._wca = window._wca || [];</script>' . "\r\n";
	}


	/**
	 * Place script to call s.js, Store Analytics.
	 */
	public function enqueue_tracking_script() {
		$filename = sprintf(
			'https://stats.wp.com/s-%d.js',
			gmdate( 'YW' )
		);

		Assets::enqueue_async_script( 'woocommerce-analytics', esc_url( $filename ), esc_url( $filename ), array(), null, false );
	}

	/**
	 * Default event properties which should be included with all events.
	 *
	 * @return array Array of standard event props.
	 */
	public function get_common_properties() {
		$site_info          = array(
			'blog_id'     => Jetpack::get_option( 'id' ),
			'ui'          => $this->get_user_id(),
			'url'         => home_url(),
			'woo_version' => WC()->version,
		);
		$cart_checkout_info = self::get_cart_checkout_info();
		return array_merge( $site_info, $cart_checkout_info );
	}

	/**
	 * Render tracks event properties as string of JavaScript object props.
	 *
	 * @param  array $properties Array of key/value pairs.
	 * @return string String of the form "key1: value1, key2: value2, " (etc).
	 */
	private function render_properties_as_js( $properties ) {
		$js_args_string = '';
		foreach ( $properties as $key => $value ) {
			$js_args_string = $js_args_string . "'$key': '" . esc_js( $value ) . "', ";
		}
		return $js_args_string;
	}

	/**
	 * Record an event with optional custom properties.
	 *
	 * @param string  $event_name The name of the event to record.
	 * @param integer $product_id The id of the product relating to the event.
	 * @param array   $properties Optional array of (key => value) event properties.
	 */
	public function record_event( $event_name, $product_id, $properties = array() ) {
		$product = wc_get_product( $product_id );
		if ( ! $product instanceof WC_Product ) {
			return;
		}
		$product_details = $this->get_product_details( $product );

		$all_props = array_merge(
			$properties,
			$this->get_common_properties()
		);

		wc_enqueue_js(
			"_wca.push( {
					'_en': '" . esc_js( $event_name ) . "',
					'pi': '" . esc_js( $product_id ) . "',
					'pn': '" . esc_js( $product_details['name'] ) . "',
					'pc': '" . esc_js( $product_details['category'] ) . "',
					'pp': '" . esc_js( $product_details['price'] ) . "',
					'pt': '" . esc_js( $product_details['type'] ) . "'," .
					$this->render_properties_as_js( $all_props ) . '
				} );'
		);
	}

	/**
	 * On product lists or other non-product pages, add an event listener to "Add to Cart" button click
	 */
	public function loop_session_events() {
		// Check for previous events queued in session data.
		if ( is_object( WC()->session ) ) {
			$data = WC()->session->get( 'wca_session_data' );
			if ( ! empty( $data ) ) {
				foreach ( $data as $data_instance ) {
					$this->record_event(
						$data_instance['event'],
						$data_instance['product_id'],
						array(
							'pq' => $data_instance['quantity'],
						)
					);
				}
				// Clear data, now that these events have been recorded.
				WC()->session->set( 'wca_session_data', '' );
			}
		}
	}

	/**
	 * On the cart page, add an event listener for removal of product click
	 */
	public function remove_from_cart() {
		$common_props = $this->render_properties_as_js(
			$this->get_common_properties()
		);

		// We listen at div.woocommerce because the cart 'form' contents get forcibly
		// updated and subsequent removals from cart would then not have this click
		// handler attached.
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
					'pi': productDetails.id,
					'pq': productDetails.quantity, " .
					$common_props . '
				} );
			} );'
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
	 * @param array $product product.
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
		$this->record_event(
			'woocommerceanalytics_product_view',
			$product->get_id()
		);
	}

	/**
	 * On the Checkout page, trigger an event for each product in the cart
	 */
	public function checkout_process() {
		$cart = WC()->cart->get_cart();

		foreach ( $cart as $cart_item_key => $cart_item ) {
			/**
			* This filter is already documented in woocommerce/templates/cart/cart.php
			*/
			$product = apply_filters( 'woocommerce_cart_item_product', $cart_item['data'], $cart_item, $cart_item_key );

			if ( ! $product ) {
				continue;
			}

			$this->record_event(
				'woocommerceanalytics_product_checkout',
				$product->get_id(),
				array(
					'pq' => $cart_item['quantity'],
				)
			);
		}
	}

	/**
	 * After the checkout process, fire an event for each item in the order
	 *
	 * @param string $order_id Order Id.
	 */
	public function order_process( $order_id ) {
		$order = wc_get_order( $order_id );

		// loop through products in the order and queue a purchase event.
		foreach ( $order->get_items() as $order_item_id => $order_item ) {
			$product = $order->get_product_from_item( $order_item );

			$this->record_event(
				'woocommerceanalytics_product_purchase',
				$product->get_id(),
				array(
					'oi' => $order->get_order_number(),
					'pq' => $order_item->get_quantity(),
				)
			);
		}
	}

	/**
	 * Listen for clicks on the "Update Cart" button to know if an item has been removed by
	 * updating its quantity to zero
	 */
	public function remove_from_cart_via_quantity() {
		$common_props = $this->render_properties_as_js(
			$this->get_common_properties()
		);

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
							'pi': productID, " .
							$common_props . '
						} );
					}
				} );
			} );'
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
	 * Track adding items to the cart.
	 *
	 * @param string $cart_item_key Cart item key.
	 * @param int    $product_id Product added to cart.
	 * @param int    $quantity Quantity added to cart.
	 * @param int    $variation_id Product variation.
	 * @param array  $variation Variation attributes..
	 * @param array  $cart_item_data Other cart data.
	 */
	public function capture_add_to_cart( $cart_item_key, $product_id, $quantity, $variation_id, $variation, $cart_item_data ) {
		$referer_postid = isset( $_SERVER['HTTP_REFERER'] ) ? url_to_postid( $_SERVER['HTTP_REFERER'] ) : 0;
		// if the referring post is not a product OR the product being added is not the same as post.
		// (eg. related product list on single product page) then include a product view event.
		$product_by_referer_postid = wc_get_product( $referer_postid );
		if ( ! $product_by_referer_postid instanceof WC_Product || (int) $product_id !== $referer_postid ) {
			$this->capture_event_in_session_data( $product_id, $quantity, 'woocommerceanalytics_product_view' );
		}
		// add cart event to the session data.
		$this->capture_event_in_session_data( $product_id, $quantity, 'woocommerceanalytics_add_to_cart' );
	}

	/**
	 * Track in-session data.
	 *
	 * @param int    $product_id Product ID.
	 * @param int    $quantity Quantity.
	 * @param string $event Fired event.
	 */
	public function capture_event_in_session_data( $product_id, $quantity, $event ) {

		$product = wc_get_product( $product_id );
		if ( ! $product instanceof WC_Product ) {
			return;
		}

		$quantity = ( 0 === $quantity ) ? 1 : $quantity;

		// check for existing data.
		if ( is_object( WC()->session ) ) {
			$data = WC()->session->get( 'wca_session_data' );
			if ( empty( $data ) || ! is_array( $data ) ) {
				$data = array();
			}
		} else {
			$data = array();
		}

		// extract new event data.
		$new_data = array(
			'event'      => $event,
			'product_id' => (string) $product_id,
			'quantity'   => (string) $quantity,
		);

		// append new data.
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

	/**
	 * Search a specific post for text content.
	 *
	 * Note: similar code is in a WooCommerce core PR:
	 * https://github.com/woocommerce/woocommerce/pull/25932
	 *
	 * @param integer $post_id The id of the post to search.
	 * @param string  $text    The text to search for.
	 * @return integer 1 if post contains $text (otherwise 0).
	 */
	public static function post_contains_text( $post_id, $text ) {
		global $wpdb;

		// Search for the text anywhere in the post.
		$wildcarded = "%{$text}%";

		$result = $wpdb->get_var(
			$wpdb->prepare(
				"
				SELECT COUNT( * ) FROM {$wpdb->prefix}posts
				WHERE ID=%d
				AND {$wpdb->prefix}posts.post_content LIKE %s
				",
				array( $post_id, $wildcarded )
			)
		);

		return ( '0' !== $result ) ? 1 : 0;
	}

	/**
	 * Get info about the cart & checkout pages, in particular
	 * whether the store is using shortcodes or Gutenberg blocks.
	 * This info is cached in a transient.
	 *
	 * Note: similar code is in a WooCommerce core PR:
	 * https://github.com/woocommerce/woocommerce/pull/25932
	 *
	 * @return array
	 */
	public static function get_cart_checkout_info() {
		$transient_name = 'jetpack_woocommerce_analytics_cart_checkout_info_cache';

		$info = get_transient( $transient_name );
		if ( false === $info ) {
			$cart_page_id     = wc_get_page_id( 'cart' );
			$checkout_page_id = wc_get_page_id( 'checkout' );

			$info = array(
				'cart_page_contains_cart_block'         => self::post_contains_text(
					$cart_page_id,
					'<!-- wp:woocommerce/cart'
				),
				'cart_page_contains_cart_shortcode'     => self::post_contains_text(
					$cart_page_id,
					'[woocommerce_cart]'
				),
				'checkout_page_contains_checkout_block' => self::post_contains_text(
					$checkout_page_id,
					'<!-- wp:woocommerce/checkout'
				),
				'checkout_page_contains_checkout_shortcode' => self::post_contains_text(
					$checkout_page_id,
					'[woocommerce_checkout]'
				),
			);

			set_transient( $transient_name, $info, DAY_IN_SECONDS );
		}

		return $info;
	}
}
