<?php

/**
* Jetpack_Google_Analytics_Universal hooks and and enqueues support for analytics.js
* https://developers.google.com/analytics/devguides/collection/analyticsjs/
*
* @author allendav 
*/

/**
* Bail if accessed directly
*/
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Jetpack_Google_Analytics_Universal {
	public function __construct() {
		add_filter( 'jetpack_wga_universal_commands', array( $this, 'maybe_anonymize_ip' ) );
		add_filter( 'jetpack_wga_universal_commands', array( $this, 'maybe_track_purchases' ) );

		add_action( 'wp_head', array( $this, 'wp_head' ), 999999 );

		//TODO add_action( 'woocommerce_after_add_to_cart_button', array( $this, 'add_to_cart' ) );
		//TODO add_action( 'wp_footer', array( $this, 'loop_add_to_cart' ) );
		//TODO add_action( 'woocommerce_after_cart', array( $this, 'remove_from_cart' ) );
		//TODO add_action( 'woocommerce_after_mini_cart', array( $this, 'remove_from_cart' ) );

		//TODO add_filter( 'woocommerce_cart_item_remove_link', array( $this, 'remove_from_cart_attributes' ), 10, 2 );

		//TODO add_action( 'woocommerce_after_shop_loop_item', array( $this, 'listing_impression' ) );
		//TODO add_action( 'woocommerce_after_shop_loop_item', array( $this, 'listing_click' ) );
		//TODO add_action( 'woocommerce_after_single_product', array( $this, 'product_detail' ) );
		//TODO add_action( 'woocommerce_after_checkout_form', array( $this, 'checkout_process' ) );

		add_action( 'wp_footer', array( $this, 'wp_footer' ) );
	}

	public function wp_head() {
		$tracking_code = Jetpack_Google_Analytics_Options::get_tracking_code();
		if ( empty( $tracking_code ) ) {
			echo "<!-- No tracking ID configured for Jetpack Google Analytics -->\r\n";
			return;
		}

		// If we're in the admin_area, return without inserting code.
		if ( is_admin() ) {
			return;
		}

		/**
		 * Allow for additional elements to be added to the universal Google Analytics queue (ga) array
		 *
		 * @since 5.6.0
		 *
		 * @param array $custom_vars Array of universal Google Analytics queue elements
		 */
		$universal_commands = apply_filters( 'jetpack_wga_universal_commands', array() );

		$async_code = "
			<!-- Jetpack Google Analytics -->
			<script>
				window.ga = window.ga || function(){ ( ga.q = ga.q || [] ).push( arguments ) }; ga.l=+new Date;
				ga( 'create', '%tracking_id%', 'auto' );
				%universal_commands%
			</script>
			<script async src='https://www.google-analytics.com/analytics.js'></script>
			<!-- End Jetpack Google Analytics -->
		";
		$async_code = str_replace( '%tracking_id%', $tracking_code, $async_code );

		$universal_commands_string = implode( "\r\n", $universal_commands );
		$async_code = str_replace( '%universal_commands%', $universal_commands_string, $async_code );

		echo "$async_code\r\n";
	}

	public function maybe_anonymize_ip( $command_array ) {
		if ( Jetpack_Google_Analytics_Options::anonymize_ip_is_enabled() ) {
			array_push( $command_array, "ga( 'set', 'anonymizeIp', true );" );
		}

		return $command_array;
	}

	public function maybe_track_purchases( $command_array ) {
		global $wp;

		if ( ! Jetpack_Google_Analytics_Options::track_purchases_is_enabled() ) {
			return $command_array;
		}

		if ( ! class_exists( 'WooCommerce' ) ) {
			return $command_array;
		}

		$minimum_woocommerce_active = class_exists( 'WooCommerce' ) && version_compare( WC_VERSION, '3.0', '>=' );
		if ( ! $minimum_woocommerce_active ) {
			return $command_array;
		}

		if ( ! is_order_received_page() ) {
			return $command_array;
		}

		$order_id = isset( $wp->query_vars['order-received'] ) ? $wp->query_vars['order-received'] : 0;
		if ( 0 == $order_id ) {
			return $command_array;
		}

		// A 1 indicates we've already tracked this order - don't do it again
		if ( 1 == get_post_meta( $order_id, '_ga_tracked', true ) ) {
			return $command_array;
		}

		$order = new WC_Order( $order_id );
		$order_currency = $order->get_currency();
		$command = "ga( 'set', '&cu', '" . esc_js( $order_currency ) . "' );";
		array_push( $command_array, $command );

		// Order items
		if ( $order->get_items() ) {
			foreach ( $order->get_items() as $item ) {
				$product = $order->get_product_from_item( $item );
				$sku_or_id = $product->get_sku() ? $product->get_sku() : $product->get_id();

				$item_details = array(
					'id' => $sku_or_id,
					'name' => $item['name'],
					'category' => Jetpack_Google_Analytics_Utils::get_product_categories_concatenated( $product ),
					'price' => $order->get_item_total( $item ),
					'quantity' => $item['qty'],
				);
				$command = "ga( 'ec:addProduct', " . wp_json_encode( $item_details ) . " );";
				array_push( $command_array, $command );
			}
		}

		// Order summary
		$summary = array(
			'id' => $order->get_order_number(),
			'affiliation' => get_bloginfo( 'name' ),
			'revenue' => $order->get_total(),
			'tax' => $order->get_total_tax(),
			'shipping' => $order->get_total_shipping()
		);
		$command = "ga( 'ec:setAction', 'purchase', " . wp_json_encode( $summary ) . " );";
		array_push( $command_array, $command );

		update_post_meta( $order_id, '_ga_tracked', 1 );

		return $command_array;
	}

	public function wp_footer() {
		if ( ! Jetpack_Google_Analytics_Options::has_tracking_code() ) {
			return;
		}

		if ( is_admin() ) {
			return;
		}

		$async_code = "
			<!-- Jetpack Google Analytics -->
			<script>
				ga( 'send', 'pageview' );
			</script>
			<!-- End Jetpack Google Analytics -->
		";

		echo "$async_code\r\n";
	}
}