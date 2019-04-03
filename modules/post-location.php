<?php

/**
 * Set the Post Location Gutenberg extension as available.
 */
function jetpack_post_location_set_extension_available() {
	Jetpack_Gutenberg::set_extension_available( 'jetpack/post-location' );
}

add_action( 'init', 'jetpack_post_location_set_extension_available' );
