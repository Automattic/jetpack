<?php
/**
 * Send A Message Block.
 *
 * @since 8.x
 *
 * @package Jetpack
 */

namespace Jetpack\Send_A_Message_Block;

const FEATURE_NAME = 'send-a-message';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	jetpack_register_block(
		BLOCK_NAME,
		array( 'render_callback' => __NAMESPACE__ . '\load_assets' )
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Send A Message block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the Send A Message block attributes.
 * @param string $content String containing the Send A Message block content.
 *
 * @return string
 */
function load_assets( $attr, $content ) {
	/*
	 * Enqueue necessary scripts and styles.
	 */
	\Jetpack_Gutenberg::load_assets_as_required( 'send-a-message' );

	return $content;
}
