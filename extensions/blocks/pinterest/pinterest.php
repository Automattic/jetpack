<?php
/**
 * Pinterest Block.
 *
 * @since 7.x
 *
 * @package Jetpack
 */

jetpack_register_block(
	'jetpack/pinterest',
	array( 'render_callback' => 'jetpack_pinterest_block_load_assets' )
);

/**
 * Pinterest block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the Pinterest block attributes.
 * @param string $content String containing the Pinterest block content.
 *
 * @return string
 */
function jetpack_pinterest_block_load_assets( $attr, $content ) {
	Jetpack_Gutenberg::load_assets_as_required( 'pinterest' );
	return $content;
}
