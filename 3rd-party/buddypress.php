<?php
/**
 * BuddyPress.
 *
 * @package Jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_filter( 'bp_core_pre_avatar_handle_upload', 'blobphoto' );

/**
 * BlobPhoto.
 *
 * @param  bool $bool Boolean.
 * @return bool $bool Boolean.
 */
function blobphoto( $bool ) {

	add_filter( 'jetpack_photon_skip_image', '__return_true' );

	return $bool;
}
