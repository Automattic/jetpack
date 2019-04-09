<?php
/**
 * Logo Gallery Block.
 *
 * @since 7.1.0
 *
 * @package Jetpack
 */

jetpack_register_block(
	'jetpack/logo-gallery',
	array(
		'render_callback' => 'jetpack_logo_gallery_block_load_assets',
	)
);

/**
 * Logo gallery block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the logo gallery block attributes.
 * @param string $content String containing the logo gallery block content.
 *
 * @return string
 */
function jetpack_logo_gallery_block_load_assets( $attr, $content ) {
	$dependencies = array();

	Jetpack_Gutenberg::load_assets_as_required( 'logo-gallery', $dependencies );

	return $content;
}
