<?php
/**
 * Instagram Gallery Block.
 *
 * @since 8.5.0
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Instagram_Gallery;

use Jetpack_Gutenberg;

const FEATURE_NAME = 'instagram-gallery';
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
 * Instagram Gallery block render callback.
 *
 * @param array  $attributes Array containing the Instagram Gallery block attributes.
 * @param string $content The Instagram Gallery block content.
 *
 * @return string
 */
function render_block( $attributes, $content ) {
	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );
	return $content;
}
