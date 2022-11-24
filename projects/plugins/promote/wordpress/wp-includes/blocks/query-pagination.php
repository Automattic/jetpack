<?php
/**
 * Server-side rendering of the `core/query-pagination` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/query-pagination` block on the server.
 *
 * @param array  $attributes Block attributes.
 * @param string $content    Block default content.
 *
 * @return string Returns the wrapper for the Query pagination.
 */
function render_block_core_query_pagination( $attributes, $content ) {
	if ( empty( trim( $content ) ) ) {
		return '';
	}

	return sprintf(
		'<div %1$s>%2$s</div>',
		get_block_wrapper_attributes(),
		$content
	);
}

/**
 * Registers the `core/query-pagination` block on the server.
 */
function register_block_core_query_pagination() {
	register_block_type_from_metadata(
		__DIR__ . '/query-pagination',
		array(
			'render_callback' => 'render_block_core_query_pagination',
		)
	);
}
add_action( 'init', 'register_block_core_query_pagination' );
