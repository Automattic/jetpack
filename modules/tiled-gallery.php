<?php

/**
 * Module Name: Tiled Galleries
 * Module Description: Display image galleries in a variety of elegant arrangements.
 * Jumpstart Description: Display image galleries in a variety of elegant arrangements.
 * First Introduced: 2.1
 * Requires Connection: No
 * Auto Activate: No
 * Module Tags: Photos and Videos
 * Feature: Appearance, Jumpstart
 * Sort Order: 24
 * Additional Search Queries: gallery, tiles, tiled, grid, mosaic, images
 */

function jetpack_load_tiled_gallery() {
	include dirname( __FILE__ ) . "/tiled-gallery/tiled-gallery.php";
}

add_action( 'jetpack_modules_loaded', 'jetpack_tiled_gallery_loaded' );

function jetpack_tiled_gallery_loaded() {
	Jetpack::enable_module_configurable( __FILE__ );
	Jetpack::module_configuration_load( __FILE__, 'jetpack_tiled_gallery_configuration_load' );
}

function jetpack_tiled_gallery_configuration_load() {
	wp_safe_redirect( admin_url( 'options-media.php' ) );
	exit;
}

jetpack_load_tiled_gallery();

// Tile-gallery block definition can be found in wp-calypso repo
jetpack_register_block( 'tiled-gallery', array(
	'render_callback' => 'jetpack_tiled_gallery_load_assets' // This is needed to enqueue front end assets as we request them instead of always
) );

/**
 * Renders the tiled gallery dynamically to the user
 * Currently we use the render_callback to include only load the front end assets when they are required.
 *
 * @param $attr array - array of attributes
 * @param $content string - content block
 *
 * @return string
 */
function jetpack_tiled_gallery_load_assets( $attr, $content ) {
	Jetpack_Gutenberg::load_assets_as_required( 'tiled-gallery' );
	return $content;
}
