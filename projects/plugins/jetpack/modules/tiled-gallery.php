<?php
/**
 * Module Name: Tiled Galleries
 * Module Description: Create visually engaging tiled image galleries with multiple layout options.
 * First Introduced: 2.1
 * Requires Connection: No
 * Auto Activate: No
 * Module Tags: Photos and Videos
 * Feature: Appearance
 * Sort Order: 24
 * Additional Search Queries: gallery, tiles, tiled, grid, mosaic, images
 *
 * @package jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Include the tiled gallery for loading.
 */
function jetpack_load_tiled_gallery() {
	include __DIR__ . '/tiled-gallery/tiled-gallery.php';
}

add_action( 'jetpack_modules_loaded', 'jetpack_tiled_gallery_loaded' );

/**
 * Enable the tiled gallery module.
 */
function jetpack_tiled_gallery_loaded() {
	Jetpack::enable_module_configurable( __FILE__ );
	add_filter( 'jetpack_module_configuration_url_tiled-gallery', 'jetpack_tiled_gallery_configuration_url' );
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
