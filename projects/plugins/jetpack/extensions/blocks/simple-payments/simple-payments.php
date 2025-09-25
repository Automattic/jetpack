<?php
/**
 * Pay with PayPal block (aka Simple Payments).
 *
 * @since 9.0.0
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\PaypalPayments\SimplePayments\Block;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// Register the block
add_action( 'init', array( Block::class, 'register_block' ), 9 );

// Disable AMP for posts with the block.
add_filter( 'amp_skip_post', array( Block::class, 'amp_skip_post' ), 10, 3 );

// Load scripts for the editing interface
add_action( 'enqueue_block_editor_assets', array( Block::class, 'load_editor_scripts' ), 9 );

// Load styles in the editor iframe context
if ( is_admin() ) {
	add_action( 'enqueue_block_assets', array( Block::class, 'load_editor_styles' ), 9 );
}
