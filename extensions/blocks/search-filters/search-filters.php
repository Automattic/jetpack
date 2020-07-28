<?php
/**
 * Search Results Block
 *
 * @since 8.9.0
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Search_Filters;

use Jetpack_Gutenberg;

const FEATURE_NAME = 'search-filters';
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
 * Repeat Visitor block dependency declaration.
 *
 * @param array  $attributes Array containing the block attributes.
 * @param string $content    String containing the block content.
 *
 * @return string
 */
function render_block( $attributes, $content ) {
	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );
	return $content;

	// $classes = Jetpack_Gutenberg::block_classes( FEATURE_NAME, $attributes );
	// return an empty div so that view script increments the visit counter in the cookie.
	// return '<div class="' . esc_attr( $classes ) . '"></div>';
}
