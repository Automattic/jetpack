<?php
/**
 * Adrenalina Block.
 *
 * @since 7.x
 *
 * @package Jetpack
 */

jetpack_register_block(
	'jetpack/adrenalina',
	array( 'render_callback' => 'jetpack_adrenalina_block_load_assets' )
);

/**
 * Adrenalina block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the Adrenalina block attributes.
 * @param string $content String containing the Adrenalina block content.
 *
 * @return string
 */
function jetpack_adrenalina_block_load_assets( $attr, $content ) {
	Jetpack_Gutenberg::load_assets_as_required( 'adrenalina' );
	return $content;
}
