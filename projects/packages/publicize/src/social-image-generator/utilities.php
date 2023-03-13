<?php
/**
 * Utilities.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\Social_Image_Generator;

use Automattic\Jetpack\Redirect;

/**
 * Given a post ID, returns the image URL for the generated image.
 *
 * @param int $post_id Post ID to get the URL for.
 * @return string
 */
function get_image_url( $post_id ) {
	$post_settings = new Post_Settings( $post_id );
	$token         = $post_settings->get_token();

	if ( ! $post_settings->is_enabled() || empty( $token ) ) {
		return '';
	}

	return add_query_arg(
		array( 'query' => rawurlencode( 't=' . $token ) ),
		Redirect::get_url( 'sigenerate', array( 'site' => null ) )
	);
}
