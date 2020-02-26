<?php
/**
 * Amazon Block.
 *
 * @since 8.x
 *
 * @package Jetpack
 */

jetpack_register_block(
	'jetpack/amazon',
	array( 'render_callback' => 'jetpack_amazon_block_load_assets' )
);

/**
 * Amazon block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the Amazon block attributes.
 * @param string $content String containing the Amazon block content.
 *
 * @return string
 */
function jetpack_amazon_block_load_assets( $attr, $content ) {
	Jetpack_Gutenberg::load_assets_as_required( 'amazon' );
	return $content;
}
