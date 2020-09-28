<?php
/**
 * Pay with PayPal block (aka Simple Payments).
 *
 * @since 9.0.0
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\SimplePayments;

use Jetpack_Simple_Payments;

const FEATURE_NAME = 'simple-payments';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	jetpack_register_block(
		BLOCK_NAME,
		array(
			'render_callback' => __NAMESPACE__ . '\render_block',
			'plan_check'      => true,
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Pay with PayPal block dynamic rendering.
 *
 * @param array  $attr    Array containing the block attributes.
 * @param string $content String containing the block content.
 *
 * @return string
 */
function render_block( $attr, $content ) {
	// Do nothing if block content is a `simple-payment` shortcode.
	if ( preg_match( '/\[simple-payment(.*)]/', $content ) ) {
		return $content;
	}

	// Keep content as-is if rendered in other contexts than frontend (i.e. feed, emails, API, etc.).
	if ( ! jetpack_is_frontend() ) {
		return $content;
	}

	$simple_payments = Jetpack_Simple_Payments::getInstance();
	$simple_payments->enqueue_frontend_assets();

	// Augment block UI with a PayPal button if rendered on the frontend.
	$product_id  = $attr['productId'];
	$dom_id      = wp_unique_id( "jetpack-simple-payments-{$product_id}_" );
	$is_multiple = get_post_meta( $product_id, 'spay_multiple', true ) || '0';

	$simple_payments->setup_paypal_checkout_button( $product_id, $dom_id, $is_multiple );

	$purchase_box = $simple_payments->output_purchase_box( $dom_id, $is_multiple );
	$content      = preg_replace( '#<a class="jetpack-simple-payments-purchase(.*)</a>#i', $purchase_box, $content );

	return $content;
}
