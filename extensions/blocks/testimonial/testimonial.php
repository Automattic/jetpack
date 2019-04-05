<?php
/**
 * Testimonial Block.
 *
 * @since 7.1.0
 *
 * @package Jetpack
 */

jetpack_register_block( 'jetpack/testimonial', array(
    'render_callback' => 'jetpack_testimonial_block_load_assets',
) );

/**
 * Testimonial block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the testimonial block attributes.
 * @param string $content String containing the testimonial block content.
 *
 * @return string
 */
function jetpack_testimonial_block_load_assets( $attr, $content ) {
	$dependencies = array();

	Jetpack_Gutenberg::load_assets_as_required( 'testimonial', $dependencies );

	return $content;
}
