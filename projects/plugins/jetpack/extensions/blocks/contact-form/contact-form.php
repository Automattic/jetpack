<?php
/**
 * Contact Form Block.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Contact_Form;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// Register the block
add_action( 'init', array( Contact_Form_Block::class, 'register_block' ), 9 );

// Load scripts for the editing interface
add_action( 'enqueue_block_editor_assets', array( Contact_Form_Block::class, 'load_editor_scripts' ), 9 );

// Load styles in the editor iframe context
if ( is_admin() ) {
	add_action( 'enqueue_block_assets', array( Contact_Form_Block::class, 'load_editor_styles' ), 9 );
}
