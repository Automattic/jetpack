<?php
/**
 * Repeat Visitor Block
 *
 * @since 7.2.0
 *
 * @package Jetpack
 */

jetpack_register_block(
	'jetpack/repeat-visitor',
	array(
		'render_callback' => 'jetpack_repeat_visitor_block_render',
	)
);

/**
 * Repeat Visitor block dependency declaration.
 *
 * @param array  $attributes Array containing the block attributes.
 * @param string $content    String containing the block content.
 *
 * @return string
 */
function jetpack_repeat_visitor_block_render( $attributes, $content ) {
	Jetpack_Gutenberg::load_assets_as_required( 'repeat-visitor' );

	$classes = Jetpack_Gutenberg::block_classes( 'repeat-visitor', $attributes );

	$count     = isset( $_COOKIE['jp-visit-counter'] ) ? intval( $_COOKIE['jp-visit-counter'] ) : 0;
	$criteria  = isset( $attributes['criteria'] ) ? $attributes['criteria'] : 'after-visits';
	$threshold = isset( $attributes['threshold'] ) ? intval( $attributes['threshold'] ) : 3;

	if (
		( 'after-visits' === $criteria && $count >= $threshold ) ||
		( 'before-visits' === $criteria && $count < $threshold )
	) {
		return $content;
	}

	// return an empty div so that view script increments the visit counter in the cookie.
	return '<div class="' . esc_attr( $classes ) . '"></div>';
}
