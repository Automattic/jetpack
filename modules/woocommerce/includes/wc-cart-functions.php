<?php
/**
 * WooCommerce Cart Functions
 *
 * Functions for cart specific things.
 *
 * @author 		WooThemes
 * @category 	Core
 * @package 	WooCommerce/Functions
 * @version     2.1.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

/**
 * Prevent password protected products being added to the cart
 *
 * @param  bool $passed
 * @param  int $product_id
 * @return bool
 */
function wc_protected_product_add_to_cart( $passed, $product_id ) {
	if ( post_password_required( $product_id ) ) {
		$passed = false;
		wc_add_notice( __( 'This product is protected and cannot be purchased.', 'woocommerce' ), 'error' );
	}
	return $passed;
}
add_filter( 'woocommerce_add_to_cart_validation', 'wc_protected_product_add_to_cart', 10, 2 );

/**
 * Clears the cart session when called
 */
function wc_empty_cart() {
	if ( ! isset( WC()->cart ) || WC()->cart == '' ) {
		WC()->cart = new WC_Cart();
	}
	WC()->cart->empty_cart( false );
}

/**
 * Load the persistent cart
 *
 * @param string $user_login
 * @param WP_User $user
 * @deprecated 2.3
 */
function wc_load_persistent_cart( $user_login, $user ) {
	if ( ! $user || ! ( $saved_cart = get_user_meta( $user->ID, '_woocommerce_persistent_cart', true ) ) ) {
		return;
	}

	if ( empty( WC()->session->cart ) || ! is_array( WC()->session->cart ) || sizeof( WC()->session->cart ) === 0 ) {
		WC()->session->cart = $saved_cart['cart'];
	}
}

/**
 * Add to cart messages.
 *
 * @access public
 * @param int|array $product_id
 */
function wc_add_to_cart_message( $product_id ) {

	if ( is_array( $product_id ) ) {

		$titles = array();

		foreach ( $product_id as $id ) {
			$titles[] = get_the_title( $id );
		}

		$added_text = sprintf( __( 'Added %s to your cart.', 'woocommerce' ), wc_format_list_of_items( $titles ) );

	} else {
		$added_text = sprintf( __( '&quot;%s&quot; was successfully added to your cart.', 'woocommerce' ), get_the_title( $product_id ) );
	}

	// Output success messages
	if ( get_option( 'woocommerce_cart_redirect_after_add' ) == 'yes' ) :

		$return_to 	= apply_filters( 'woocommerce_continue_shopping_redirect', wp_get_referer() ? wp_get_referer() : home_url() );

		$message 	= sprintf('<a href="%s" class="button wc-forward">%s</a> %s', $return_to, __( 'Continue Shopping', 'woocommerce' ), $added_text );

	else :

		$message 	= sprintf('<a href="%s" class="button wc-forward">%s</a> %s', wc_get_page_permalink( 'cart' ), __( 'View Cart', 'woocommerce' ), $added_text );

	endif;

	wc_add_notice( apply_filters( 'wc_add_to_cart_message', $message, $product_id ) );
}

/**
 * Comma separate a list of item names, and replace final comma with 'and'
 * @param  array $items
 * @return string
 */
function wc_format_list_of_items( $items ) {
	return '&quot;' . join( __( '&quot; and &quot;', 'woocommerce' ), array_filter( array_merge( array( implode( '&quot;, &quot;', array_slice( $items, 0, -1 ) ) ), array_slice( $items, -1 ) ) ) ) . '&quot;';
}

/**
 * Clear cart after payment.
 *
 * @access public
 * @return void
 */
function wc_clear_cart_after_payment() {
	global $wp;

	if ( ! empty( $wp->query_vars['order-received'] ) ) {

		$order_id  = absint( $wp->query_vars['order-received'] );
		$order_key = isset( $_GET['key'] ) ? wc_clean( $_GET['key'] ) : '';

		if ( $order_id > 0 ) {
			$order = wc_get_order( $order_id );

			if ( $order->order_key === $order_key ) {
				WC()->cart->empty_cart();
			}
		}
	}

	if ( WC()->session->order_awaiting_payment > 0 ) {
		$order = wc_get_order( WC()->session->order_awaiting_payment );

		if ( $order && $order->id > 0 ) {
			// If the order has not failed, or is not pending, the order must have gone through
			if ( ! $order->has_status( array( 'failed', 'pending', 'cancelled' ) ) ) {
				WC()->cart->empty_cart();
			}
		}
	}
}
add_action( 'get_header', 'wc_clear_cart_after_payment' );

/**
 * Get the subtotal
 *
 * @access public
 * @return string
 */
function wc_cart_totals_subtotal_html() {
	echo WC()->cart->get_cart_subtotal();
}

/**
 * Get shipping methods
 *
 * @access public
 * @return void
 */
function wc_cart_totals_shipping_html() {
	$packages = WC()->shipping->get_packages();

	foreach ( $packages as $i => $package ) {
		$chosen_method = isset( WC()->session->chosen_shipping_methods[ $i ] ) ? WC()->session->chosen_shipping_methods[ $i ] : '';

		wc_get_template( 'cart/cart-shipping.php', array( 'package' => $package, 'available_methods' => $package['rates'], 'show_package_details' => ( sizeof( $packages ) > 1 ), 'index' => $i, 'chosen_method' => $chosen_method ) );
	}
}

/**
 * Get taxes total
 *
 * @access public
 * @return void
 */
function wc_cart_totals_taxes_total_html() {
	echo apply_filters( 'woocommerce_cart_totals_taxes_total_html', wc_price( WC()->cart->get_taxes_total() ) );
}

/**
 * Get a coupon label
 *
 * @access public
 * @param string $coupon
 * @return void
 */
function wc_cart_totals_coupon_label( $coupon ) {
	if ( is_string( $coupon ) )
		$coupon = new WC_Coupon( $coupon );

	echo apply_filters( 'woocommerce_cart_totals_coupon_label', esc_html( __( 'Coupon:', 'woocommerce' ) . ' ' . $coupon->code ), $coupon );
}

/**
 * Get a coupon value
 *
 * @access public
 * @param string $coupon
 * @return void
 */
function wc_cart_totals_coupon_html( $coupon ) {
	if ( is_string( $coupon ) ) {
		$coupon = new WC_Coupon( $coupon );
    }

	$value  = array();

	if ( $amount = WC()->cart->get_coupon_discount_amount( $coupon->code, WC()->cart->display_cart_ex_tax ) ) {
		$discount_html = '-' . wc_price( $amount );
	} else {
		$discount_html = '';
	}

	$value[] = apply_filters( 'woocommerce_coupon_discount_amount_html', $discount_html, $coupon );

	if ( $coupon->enable_free_shipping() ) {
		$value[] = __( 'Free shipping coupon', 'woocommerce' );
    }

    // get rid of empty array elements
    $value = array_filter( $value );
	$value = implode( ', ', $value ) . ' <a href="' . esc_url( add_query_arg( 'remove_coupon', urlencode( $coupon->code ), defined( 'WOOCOMMERCE_CHECKOUT' ) ? WC()->cart->get_checkout_url() : WC()->cart->get_cart_url() ) ) . '" class="woocommerce-remove-coupon" data-coupon="' . esc_attr( $coupon->code ) . '">' . __( '[Remove]', 'woocommerce' ) . '</a>';

	echo apply_filters( 'woocommerce_cart_totals_coupon_html', $value, $coupon );
}

/**
 * Get order total html including inc tax if needed
 *
 * @access public
 * @return void
 */
function wc_cart_totals_order_total_html() {
	$value = '<strong>' . WC()->cart->get_total() . '</strong> ';

	// If prices are tax inclusive, show taxes here
	if ( wc_tax_enabled() && WC()->cart->tax_display_cart == 'incl' ) {
		$tax_string_array = array();

		if ( get_option( 'woocommerce_tax_total_display' ) == 'itemized' ) {
			foreach ( WC()->cart->get_tax_totals() as $code => $tax )
				$tax_string_array[] = sprintf( '%s %s', $tax->formatted_amount, $tax->label );
		} else {
			$tax_string_array[] = sprintf( '%s %s', wc_price( WC()->cart->get_taxes_total( true, true ) ), WC()->countries->tax_or_vat() );
		}

		if ( ! empty( $tax_string_array ) ) {
			$value .= '<small class="includes_tax">' . sprintf( __( '(Includes %s)', 'woocommerce' ), implode( ', ', $tax_string_array ) ) . '</small>';
		}
	}

	echo apply_filters( 'woocommerce_cart_totals_order_total_html', $value );
}

/**
 * Get the fee value
 *
 * @param object $fee
 * @return void
 */
function wc_cart_totals_fee_html( $fee ) {
	$cart_totals_fee_html = ( 'excl' == WC()->cart->tax_display_cart ) ? wc_price( $fee->amount ) : wc_price( $fee->amount + $fee->tax );

	echo apply_filters( 'woocommerce_cart_totals_fee_html', $cart_totals_fee_html, $fee );
}

/**
 * Get a shipping methods full label including price
 * @param  object $method
 * @return string
 */
function wc_cart_totals_shipping_method_label( $method ) {
	$label = $method->label;

	if ( $method->cost > 0 ) {
		if ( WC()->cart->tax_display_cart == 'excl' ) {
			$label .= ': ' . wc_price( $method->cost );
			if ( $method->get_shipping_tax() > 0 && WC()->cart->prices_include_tax ) {
				$label .= ' <small>' . WC()->countries->ex_tax_or_vat() . '</small>';
			}
		} else {
			$label .= ': ' . wc_price( $method->cost + $method->get_shipping_tax() );
			if ( $method->get_shipping_tax() > 0 && ! WC()->cart->prices_include_tax ) {
				$label .= ' <small>' . WC()->countries->inc_tax_or_vat() . '</small>';
			}
		}
	} elseif ( $method->id !== 'free_shipping' ) {
		$label .= ' (' . __( 'Free', 'woocommerce' ) . ')';
	}

	return apply_filters( 'woocommerce_cart_shipping_method_full_label', $label, $method );
}
