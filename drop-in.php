<?php
/*
 * Plugin Name: Drop in Photon noresize mode
 * Plugin URI: https://jetpack.com/support/site-accelerator/
 * Description: Enables the noresize mode for Photon, allowing to avoid intermediate size files generation.
 * Author: Automattic
 * Version: 0.1-alpha
 * Author URI: https://jetpack.com
 * License: GPL2+
 * Text Domain: jetpack-dropin
 *
 * @package jetpack-11287
 *
 * This is a drop-in testing package for https://github.com/Automattic/jetpack/pull/11287
 */

function jetpack_enable_noresize_mode() {
	// The main objective of noresize mode is to disable additional resized image versions creation.
	// This filter handles removal of additional sizes.
	add_filter( 'intermediate_image_sizes_advanced', 'wpcom_intermediate_sizes' );

	// This allows to assign the Photon domain to images that normally use the home URL as base.
	add_filter( 'jetpack_photon_domain', 'jetpack_filter_photon_norezise_mode_domain', 10, 2 );

	add_filter( 'the_content', 'jetpack_filter_content_add', 0 );

	// Jetpack hooks in at six nines (999999) so this filter does at seven.
	add_filter( 'the_content', 'jetpack_filter_content_remove', 9999999 );

	// Regular Photon operation mode filter doesn't run when is_admin(), so we need an additional filter.
	// This is temporary until Jetpack allows more easily running these filters for is_admin().
	if ( is_admin() ) {
		$photon = Jetpack_Photon::instance();
		add_filter( 'image_downsize', array( $photon, 'filter_image_downsize' ), 5, 3 );
		add_filter( 'jetpack_photon_admin_allow_image_downsize', 'jetpack_filter_photon_noresize_allow_downsize', 10, 2 );
	}
}

/**
 * This is our catch-all to strip dimensions from intermediate images in content.
 * Since this primarily only impacts post_content we do a little dance to add the filter early
 * to `the_content` and then remove it later on in the same hook.
 *
 * @param String $content the post content.
 * @return String the post content unchanged.
 */
function jetpack_filter_content_add( $content ) {
	add_filter( 'jetpack_photon_pre_image_url', array( __CLASS__, 'strip_image_dimensions_maybe' ) );
	return $content;
}

/**
 * Removing the content filter that was set previously.
 *
 * @param String $content the post content.
 * @return String the post content unchanged.
 */
function jetpack_filter_content_remove( $content ) {
	remove_filter( 'jetpack_photon_pre_image_url', array( __CLASS__, 'strip_image_dimensions_maybe' ) );
	return $content;
}

/**
 * Short circuits the Photon filter to enable Photon processing for any URL.
 *
 * @param String $photon_url a proposed Photon URL for the media file.
 * @param String $image_url the original media URL.
 * @return String an URL to be used for the media file.
 */
function jetpack_filter_photon_norezise_mode_domain( $photon_url, $image_url ) {
	return $photon_url;
}

/**
 * Allows any image that gets passed to Photon to be resized via Photon.
 *
 * @param Boolean $allow whether to allow the image to get resized with Photon.
 * @param Array   $params an array containing image data, attachment ID and size variant.
 * @return Boolean
 */
function jetpack_filter_photon_noresize_allow_downsize( $allow, $params ) {
	return true;
}

/**
 * Disables intermediate sizes to disallow resizing.
 *
 * @param Array $sizes an array containing image sizes.
 * @return Boolean
 */
function wpcom_intermediate_sizes( $sizes ) {
	return array();
}

add_action( 'plugins_loaded', 'jetpack_enable_noresize_mode' );
