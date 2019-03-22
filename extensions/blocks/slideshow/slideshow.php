<?php
/**
 * Slideshow Block.
 *
 * @since 7.1.0
 *
 * @package Jetpack
 */

jetpack_register_block(
	'jetpack/slideshow',
	array(
		'render_callback' => 'jetpack_slideshow_block_load_assets',
	)
);

/**
 * Slideshow block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the slideshow block attributes.
 * @param string $content String containing the slideshow block content.
 *
 * @return string
 */
function jetpack_slideshow_block_load_assets( $attr, $content ) {
	$dependencies = array(
		'lodash',
		'wp-polyfill',
	);

	Jetpack_Gutenberg::load_assets_as_required( 'slideshow', $dependencies );

	return $content;
}
