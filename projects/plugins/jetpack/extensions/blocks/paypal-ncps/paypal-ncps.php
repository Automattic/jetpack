<?php
/**
 * PayPal NCPS block.
 *
 * @since 14.8.0
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\PaypalPayments\Paypal_NCPS;

// Register the block.
add_action( 'init', array( Paypal_NCPS::class, 'register_block' ), 9 );

// Load scripts for the editing interface
add_action( 'enqueue_block_editor_assets', array( Paypal_NCPS::class, 'load_editor_scripts' ), 9 );

// Load styles in the editor iframe context
if ( is_admin() ) {
	add_action( 'enqueue_block_assets', array( Paypal_NCPS::class, 'load_editor_styles' ), 9 );
}
