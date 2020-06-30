<?php
/**
 * WhatsApp Button Block.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\WhatsApp_Button;

use Jetpack;
use Jetpack_Gutenberg;

const PARENT_NAME  = 'send-a-message';
const FEATURE_NAME = 'whatsapp-button';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	jetpack_register_block(
		BLOCK_NAME,
		array( 'render_callback' => __NAMESPACE__ . '\render_block' )
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Render callback.
 *
 * @param array  $attributes Array containing the block attributes.
 * @param string $content    String containing the block content.
 *
 * @return string
 */
function render_block( $attributes, $content ) {
	Jetpack_Gutenberg::load_styles_as_required( PARENT_NAME . '/' . FEATURE_NAME );

	return $content;
}
