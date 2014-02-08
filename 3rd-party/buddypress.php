<?php

add_filter( 'bp_core_pre_avatar_handle_upload', 'blobphoto' );
function blobphoto( $bool ) {

	add_filter( 'jetpack_photon_skip_image', '__return_true' );

	return $bool;
}
