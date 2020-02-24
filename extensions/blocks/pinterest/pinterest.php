<?php
/**
 * Pinterest Block.
 *
 * @since 8.0.0
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
	wp_enqueue_script( 'pinterest-pinit', 'https://assets.pinterest.com/js/pinit.js', array(), JETPACK__VERSION, true );
	return $content;
}
