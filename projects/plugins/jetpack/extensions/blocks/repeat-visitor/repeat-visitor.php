<?php
/**
 * Repeat Visitor Block
 *
 * @since 7.2.0
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Repeat_Visitor;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
		__DIR__,
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
	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );

	$classes = Blocks::classes( Blocks::get_block_feature( __DIR__ ), $attributes );

	$count     = isset( $_COOKIE['jp-visit-counter'] ) ? (int) $_COOKIE['jp-visit-counter'] : 0;
	$criteria  = isset( $attributes['criteria'] ) ? $attributes['criteria'] : 'after-visits';
	$threshold = isset( $attributes['threshold'] ) ? (int) $attributes['threshold'] : 3;

	if (
		( 'after-visits' === $criteria && $count >= $threshold ) ||
		( 'before-visits' === $criteria && $count < $threshold )
	) {
		return $content;
	}

	// return an empty div so that view script increments the visit counter in the cookie.
	return '<div class="' . esc_attr( $classes ) . '"></div>';
}
