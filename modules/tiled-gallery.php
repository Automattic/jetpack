<?php

/**
 * Module Name: Tiled Galleries
 * Module Description: Display image galleries in a variety of elegant arrangements.
 * First Introduced: 2.1
 * Requires Connection: No
 * Auto Activate: No
 * Module Tags: Photos and Videos
 * Feature: Appearance
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
