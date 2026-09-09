<?php
/**
 * PayPal Payment Buttons block.
 *
 * @since 14.9
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\PaypalPayments\PayPal_Payment_Buttons;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// Register the block.
add_action( 'init', array( PayPal_Payment_Buttons::class, 'register_block' ), 9 );

/*
 * Register the PayPal REST routes (wpcom/v2/paypal/*) that the block editor calls
 * to connect an account and manage payment links. Without them the block renders
 * but every request the editor makes -- onboarding, connect, button CRUD -- 404s.
 *
 * Only the routes: init_api() would also register the standalone script stubs, which
 * exist for hosts without the Jetpack runtime and would shadow Jetpack's own
 * jetpack-script-data handle.
 */
PayPal_Payment_Buttons::init_rest_api();

/*
 * Register the Payment Links admin page. The standalone plugin wires this up in
 * its own bootstrap; the Jetpack loader has to do the same or PayPal_Admin_Page
 * never runs and the page does not exist in wp-admin.
 */
if ( is_admin() ) {
	PayPal_Payment_Buttons::init_admin();
}

// Load scripts for the editing interface
add_action( 'enqueue_block_editor_assets', array( PayPal_Payment_Buttons::class, 'load_editor_scripts' ), 9 );

// Load styles in the editor iframe context
if ( is_admin() ) {
	add_action( 'enqueue_block_assets', array( PayPal_Payment_Buttons::class, 'load_editor_styles' ), 9 );
}
