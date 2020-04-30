<?php
/**
 * Markdown Block.
 *
 * @since 6.8.0
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Markdown;

const FEATURE_NAME = 'markdown';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	jetpack_register_block( BLOCK_NAME );
}
add_action( 'init', __NAMESPACE__ . '\register_block' );
