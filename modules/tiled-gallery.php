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
	add_filter( 'jetpack_module_configuration_url_tiled-gallery', 'jetpack_tiled_gallery_configuration_url' );
}

function jetpack_tiled_gallery_configuration_load() {
	wp_safe_redirect( admin_url( 'options-media.php' ) );
	exit;
}

/**
 * Overrides default configuration url
 *
 * @uses admin_url
 * @return string module settings URL
 */
function jetpack_tiled_gallery_configuration_url() {
	return admin_url( 'options-media.php' );
}

jetpack_load_tiled_gallery();
