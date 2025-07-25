<?php
/**
 * PayPal Payment Buttons block.
 *
 * @since 14.9
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\PaypalPayments\PayPal_Payment_Buttons;

// Register the block.
add_action( 'init', array( PayPal_Payment_Buttons::class, 'register_block' ), 9 );

// Load scripts for the editing interface
add_action( 'enqueue_block_editor_assets', array( PayPal_Payment_Buttons::class, 'load_editor_scripts' ), 9 );

// Load styles in the editor iframe context
if ( is_admin() ) {
	add_action( 'enqueue_block_assets', array( PayPal_Payment_Buttons::class, 'load_editor_styles' ), 9 );
}
