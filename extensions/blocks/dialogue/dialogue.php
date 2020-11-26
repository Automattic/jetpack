<?php
/**
 * Dialogue Block.
 *
 * @since 9.x
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Dialogue;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

const FEATURE_NAME = 'dialogue';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	$deprecated = function_exists( 'gutenberg_get_post_from_context' );
	$uses       = $deprecated ? 'context' : 'uses_context';
	register_block_type(
		BLOCK_NAME,
		array(
			'render_callback' => __NAMESPACE__ . '\render_block',
			$uses             => array( 'jetpack/conversation-speakers' ),
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Dialogue block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the Dialogue block attributes.
 * @param string $content String containing the Dialogue block content.
 *
 * @return string
 */
function render_block( $attr, $content, $block ) {
	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );
	return $content;
}
