<?php
/**
 * Jetpack_WooCommerce_Analytics_Universal
 *
 * @package automattic/jetpack
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
	 * Trait to handle common analytics functions.
	 */
	use Jetpack_WooCommerce_Analytics_Trait;

	/**
	 * Jetpack_WooCommerce_Analytics_Universal constructor.
	 */
	public function __construct() {
		$this->cart_checkout_templates_in_use = class_exists( 'Automattic\WooCommerce\Blocks\Package' ) && version_compare( Automattic\WooCommerce\Blocks\Package::get_version(), '10.6.0', '>=' );
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

		add_filter( 'woocommerce_checkout_posted_data', array( $this, 'save_checkout_post_data' ), 10, 1 );
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
						array(
							'pq' => $data_instance['quantity'],
						),
						$data_instance['product_id']
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
		if ( str_contains( $url, 'data-product_id' ) ) {
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
	 * Get the selected shipping option for a cart item. If the name cannot be found in the options table, the method's
	 * ID will be used.
	 *
	 * @param string $cart_item_key the cart item key.
	 *
	 * @return mixed|bool
	 */
	public function get_shipping_option_for_item( $cart_item_key ) {
		$packages         = wc()->shipping()->get_packages();
		$selected_options = wc()->session->get( 'chosen_shipping_methods' );

		if ( ! is_array( $packages ) || ! is_array( $selected_options ) ) {
			return false;
		}

		foreach ( $packages as $package_id => $package ) {

			if ( ! isset( $package['contents'] ) || ! is_array( $package['contents'] ) ) {
				return false;
			}

			foreach ( $package['contents'] as $package_item ) {
				if ( ! isset( $package_item['key'] ) || $package_item['key'] !== $cart_item_key || ! isset( $selected_options[ $package_id ] ) ) {
					continue;
				}
				$selected_rate_id = $selected_options[ $package_id ];
				$method_key_id    = sanitize_text_field( str_replace( ':', '_', $selected_rate_id ) );
				$option_name      = 'woocommerce_' . $method_key_id . '_settings';
				$option_value     = get_option( $option_name );
				$title            = '';
				if ( is_array( $option_value ) && isset( $option_value['title'] ) ) {
					$title = $option_value['title'];
				}
				if ( ! $title ) {
					return $selected_rate_id;
				}
				return $title;
			}
		}

		return false;
	}

	/**
	 * On the Checkout page, trigger an event for each product in the cart
	 */
	public function checkout_process() {
		$cart = WC()->cart->get_cart();
		$this->get_additional_blocks_on_page();

		$guest_checkout = ucfirst( get_option( 'woocommerce_enable_guest_checkout', 'No' ) );
		$create_account = ucfirst( get_option( 'woocommerce_enable_signup_and_login_from_checkout', 'No' ) );

		$enabled_payment_options = array_filter(
			WC()->payment_gateways->get_available_payment_gateways(),
			function ( $payment_gateway ) {
				if ( ! $payment_gateway instanceof WC_Payment_Gateway ) {
					return false;
				}

				return $payment_gateway->is_available();
			}
		);

		$enabled_payment_options = array_keys( $enabled_payment_options );
		$include_express_payment = false;

		$wcpay_version              = get_option( 'woocommerce_woocommerce_payments_version' );
		$has_required_wcpay_version = version_compare( $wcpay_version, '2.9.0', '>=' );
		// Check express payment availablity only if WC Pay is enabled and express checkout (payment request) is enabled.
		if ( in_array( 'woocommerce_payments', $enabled_payment_options, true ) && $has_required_wcpay_version ) {
			$wcpay_settings = get_option( 'woocommerce_woocommerce_payments_settings', array() );
			if ( array_key_exists( 'payment_request', $wcpay_settings ) && 'yes' === $wcpay_settings['payment_request'] ) {
				$include_express_payment = true;
			}
		}

		foreach ( $cart as $cart_item_key => $cart_item ) {
			/**
			* This filter is already documented in woocommerce/templates/cart/cart.php
			*/
			$product = apply_filters( 'woocommerce_cart_item_product', $cart_item['data'], $cart_item, $cart_item_key );

			if ( ! $product || ! $product instanceof WC_Product ) {
				continue;
			}

			$cart           = wc()->cart->get_cart();
			$products_count = is_array( $cart ) ? count( $cart ) : '0';
			$coupons        = wc()->cart->applied_coupons;
			$coupon_used    = is_array( $coupons ) && count( $coupons ) > 0 ? '1' : '0';
			$order_totals   = wc()->cart->get_totals();
			$order_value    = '0';
			if ( isset( $order_totals['total'] ) ) {
				$order_value = $order_totals['total'];
			}

			if ( true === $include_express_payment ) {
				$properties = $this->process_event_properties(
					'woocommerceanalytics_product_checkout',
					array(
						'pq'                => $cart_item['quantity'],
						'payment_options'   => $enabled_payment_options,
						'device'            => wp_is_mobile() ? 'mobile' : 'desktop',
						'guest_checkout'    => 'Yes' === $guest_checkout ? 'Yes' : 'No',
						'create_account'    => 'Yes' === $create_account ? 'Yes' : 'No',
						'express_checkout'  => 'null',
						'shipping_option'   => $this->get_shipping_option_for_item( $cart_item_key ),
						'products_count'    => $products_count,
						'coupon_used'       => $coupon_used,
						'order_value'       => $order_value,
						'store_currency'    => get_woocommerce_currency(),
						'additional_blocks' => $this->additional_blocks_on_page,
						'template_used'     => $this->cart_checkout_templates_in_use ? '1' : '0',
					),
					$product->get_id()
				);
				wc_enqueue_js(
					"
					// wcpay.payment-request.availability event gets fired twice.
					// make sure we push only one event.
					var cartItem_{$cart_item_key}_logged = false;
				    wp.hooks.addAction('wcpay.payment-request.availability', 'wcpay', function(args) {
				        if ( true === cartItem_{$cart_item_key}_logged ) {
				            return;
				        }
				        var properties = {$properties};
				        properties.express_checkout = args.paymentRequestType;
				        _wca.push(properties);
						cartItem_{$cart_item_key}_logged = true;
				    });
				"
				);
			} else {
				$this->record_event(
					'woocommerceanalytics_product_checkout',
					array(
						'pq'                => $cart_item['quantity'],
						'payment_options'   => $enabled_payment_options,
						'device'            => wp_is_mobile() ? 'mobile' : 'desktop',
						'guest_checkout'    => 'Yes' === $guest_checkout ? 'Yes' : 'No',
						'create_account'    => 'Yes' === $create_account ? 'Yes' : 'No',
						'express_checkout'  => 'null',
						'shipping_option'   => $this->get_shipping_option_for_item( $cart_item_key ),
						'products_count'    => $products_count,
						'coupon_used'       => $coupon_used,
						'order_value'       => $order_value,
						'store_currency'    => get_woocommerce_currency(),
						'additional_blocks' => $this->additional_blocks_on_page,
						'template_used'     => $this->cart_checkout_templates_in_use ? '1' : '0',
					),
					$product->get_id()
				);
			}
		}
	}

	/**
	 * After the checkout process, fire an event for each item in the order
	 *
	 * @param string $order_id Order Id.
	 */
	public function order_process( $order_id ) {
		$order = wc_get_order( $order_id );

		if (
			! $order
			|| ! $order instanceof WC_Order
		) {
			return;
		}

		$payment_option = $order->get_payment_method();

		if ( is_object( WC()->session ) ) {
			$create_account = true === WC()->session->get( 'wc_checkout_createaccount_used' ) ? 'Y' : 'N';
		} else {
			$create_account = 'N';
		}

		$guest_checkout = $order->get_user() ? 'N' : 'Y';

		$express_checkout = 'null';
		// When the payment option is woocommerce_payment
		// See if Google Pay or Apple Pay was used.
		if ( 'woocommerce_payments' === $payment_option ) {
			$payment_option_title = $order->get_payment_method_title();
			if ( 'Google Pay (WooCommerce Payments)' === $payment_option_title ) {
				$express_checkout = array( 'google_pay' );
			} elseif ( 'Apple Pay (WooCommerce Payments)' === $payment_option_title ) {
				$express_checkout = array( 'apple_pay' );
			}
		}

		// loop through products in the order and queue a purchase event.
		foreach ( $order->get_items() as $order_item ) {
			$product_id = is_callable( array( $order_item, 'get_product_id' ) ) ? $order_item->get_product_id() : -1;

			$order_items       = $order->get_items();
			$order_items_count = 0;
			if ( is_array( $order_items ) ) {
				$order_items_count = count( $order_items );
			}
			$order_coupons       = $order->get_coupons();
			$order_coupons_count = 0;
			if ( is_array( $order_coupons ) ) {
				$order_coupons_count = count( $order_coupons );
			}
			$this->record_event(
				'woocommerceanalytics_product_purchase',
				array(
					'oi'                => $order->get_order_number(),
					'pq'                => $order_item->get_quantity(),
					'device'            => wp_is_mobile() ? 'mobile' : 'desktop',
					'payment_option'    => $payment_option,
					'create_account'    => $create_account,
					'guest_checkout'    => $guest_checkout,
					'express_checkout'  => $express_checkout,
					'products_count'    => $order_items_count,
					'coupon_used'       => $order_coupons_count,
					'order_value'       => $order->get_total(),
					'store_currency'    => get_woocommerce_currency(),
					'additional_blocks' => $this->additional_blocks_on_page,
					'template_used'     => $this->cart_checkout_templates_in_use ? '1' : '0',
				),
				$product_id
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
	 * Tracks any additional blocks loaded on the Cart/Checkout page.
	 *
	 * @var array
	 */
	private $additional_blocks_on_page = array();

	/**
	 * Gets the inner blocks of a block.
	 *
	 * @param array $inner_blocks The inner blocks.
	 *
	 * @return array
	 */
	private function get_inner_blocks( $inner_blocks ) {
		$block_names = array();
		if ( ! empty( $inner_blocks['blockName'] ) ) {
			$block_names[] = $inner_blocks['blockName'];
		}
		if ( isset( $inner_blocks['innerBlocks'] ) && is_array( $inner_blocks['innerBlocks'] ) ) {
			$block_names = array_merge( $block_names, $this->get_inner_blocks( $inner_blocks['innerBlocks'] ) );
		}
		return $block_names;
	}

	/**
	 * Gets the IDs of additional blocks on the Cart/Checkout pages or templates.
	 *
	 * @return void
	 */
	public function get_additional_blocks_on_page() {
		global $post;
		$content = $post->post_content;

		$cart_checkout_templates_in_use = class_exists( 'Automattic\WooCommerce\Blocks\Package' ) && version_compare( Automattic\WooCommerce\Blocks\Package::get_version(), '10.6.0', '>=' );

		if ( $cart_checkout_templates_in_use ) {
			if ( function_exists( 'get_block_template' ) ) {
				$content = get_block_template( 'woocommerce/woocommerce//page-checkout' )->content;
			}

			if ( function_exists( 'gutenberg_get_block_template' ) ) {
				$content = gutenberg_get_block_template( 'woocommerce/woocommerce//page-checkout' )->content;
			}
		}

		$parsed_blocks = parse_blocks( $content );
		$other_blocks  = array_filter(
			$parsed_blocks,
			function ( $block ) {
				if ( ! isset( $block['blockName'] ) ) {
					return false;
				}
				if ( is_checkout() && 'woocommerce/checkout' !== $block['blockName'] ) {
					return true;
				}
				if ( is_cart() && 'woocommerce/cart' !== $block['blockName'] ) {
					return true;
				}
				return false;
			}
		);

		$all_inner_blocks = array();

		// Loop over each "block group". In templates the blocks are grouped up.
		foreach ( $other_blocks as $block ) {

			// This check is necessary because sometimes this is null when using templates.
			if ( ! empty( $block['blockName'] ) ) {
				$all_inner_blocks[] = $block['blockName'];
			}

			if ( ! isset( $block['innerBlocks'] ) || ! is_array( $block['innerBlocks'] ) || 0 === count( $block['innerBlocks'] ) ) {
				continue;
			}

			foreach ( $block['innerBlocks'] as $inner_content ) {
				$all_inner_blocks = array_merge( $all_inner_blocks, $this->get_inner_blocks( $inner_content ) );
			}
		}
		$this->additional_blocks_on_page = $all_inner_blocks;
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
	public function capture_add_to_cart( $cart_item_key, $product_id, $quantity, $variation_id, $variation, $cart_item_data ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$referer_postid = isset( $_SERVER['HTTP_REFERER'] ) ? url_to_postid( esc_url_raw( wp_unslash( $_SERVER['HTTP_REFERER'] ) ) ) : 0;
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
			$line = implode( '/', $out );
		}
		return $line;
	}

	/**
	 * Save createaccount post data to be used in $this->order_process.
	 *
	 * @param array $data post data from the checkout page.
	 *
	 * @return array
	 */
	public function save_checkout_post_data( array $data ) {
		$session = WC()->session;
		if ( is_object( $session ) ) {
			if ( isset( $data['createaccount'] ) && ! empty( $data['createaccount'] ) ) {
				$session->set( 'wc_checkout_createaccount_used', true );
				$session->save_data();
			}
		}
		return $data;
	}
}
