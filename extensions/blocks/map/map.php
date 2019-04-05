<?php
/**
 * Map block.
 *
 * @since 6.8.0
 *
 * @package Jetpack
 */

jetpack_register_block(
	'jetpack/map',
	array(
		'render_callback' => 'jetpack_map_block_load_assets',
	)
);

/**
 * Map block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the map block attributes.
 * @param string $content String containing the map block content.
 *
 * @return string
 */
function jetpack_map_block_load_assets( $attr, $content ) {
	$api_key = Jetpack_Options::get_option( 'mapbox_api_key' );

	Jetpack_Gutenberg::load_assets_as_required( 'map' );

	return preg_replace( '/<div /', '<div data-api-key="' . esc_attr( $api_key ) . '" ', $content, 1 );
}
