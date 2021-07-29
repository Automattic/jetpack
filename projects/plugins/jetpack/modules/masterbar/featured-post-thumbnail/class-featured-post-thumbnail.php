<?php
/**
 * Featured Image - post-thumbnail Support.
 *
 * Adds support for `post-thumbnail` image on get media endpoint which is used by Gutenberg featured image.
 * This is only interim fix and should removed as soon as permanent fix is available.
 * For more context see: https://github.com/Automattic/wp-calypso/issues/52010
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

/**
 * Class Featured_Post_Thumbnail
 */
class Featured_Post_Thumbnail {

	/**
	 * FeaturedPostThumbnail constructor.
	 * Register targeted filters
	 */
	public function __construct() {
		add_filter( 'rest_prepare_attachment', array( $this, 'force_add_featured_post_thumbnail_image_support' ), 20, 2 );
	}

	/**
	 * Force add featured thumbnail image to JSON response
	 *
	 * @param  \WP_REST_Response $response The original response of attachment.
	 * @param  \WP_Post          $attachment An attachment object which contains attachment.
	 * @return \WP_REST_Response
	 */
	public function force_add_featured_post_thumbnail_image_support( $response, $attachment ) {
		// Thumbnail size we are interested in.
		$size = 'post-thumbnail';

		// Return early if media details doesn't exists in response.
		if ( ! isset( $response->data['media_details']['sizes'] ) ) {
			return $response;
		}

		$sizes = $response->data['media_details']['sizes'];

		// Return response as it is if post-thumbnail size exists already.
		if ( isset( $sizes[ $size ] ) ) {
			return $response;
		}

		// Return response as it is if the attachment doesn't have ID attribute.
		if ( ! isset( $attachment->ID ) ) {
			return $response;
		}

		// Get the `post-thumbnail` size image source url.
		list( $source_url, $width, $height ) = wp_get_attachment_image_src( $attachment->ID, $size );

		// Return response as it is if we fail to retrieve `post-thumbnail` image source url.
		if ( ! $source_url ) {
			return $response;
		}

		// Append new `post-thumbnail` to the response array.
		$sizes[ $size ] = array(
			'file'       => basename( $source_url ),
			'width'      => $width,
			'height'     => $height,
			'mime_type'  => $attachment->post_mime_type,
			'source_url' => $source_url,
		);

		$response->data['media_details']['sizes'] = $sizes;

		return $response;
	}
}
