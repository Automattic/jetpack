<?php
/**
 * Utilities.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\Social_Image_Generator;

/**
 * Given a post ID, returns the image URL for the generated image.
 *
 * @param int $post_id Post ID to get the URL for.
 * @return string
 */
function get_image_url( $post_id ) {
	$post_settings = new Post_Settings( $post_id );
	$token         = $post_settings->get_token();

	if ( empty( $token ) ) {
		return '';
	}

	// TODO: update URL
	return 'https://example.com/' . $token;
}
