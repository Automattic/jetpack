<?php
/**
 * The PostList Admin Area.
 *
 * @package automattic/jetpack-post-list
 */

namespace Automattic\Jetpack\PostList;

/**
 * The PostList Admin Area
 */
class Post_Image {
	/**
	 * Returns the featured image or if no featured image is set, return the first image in the post. If neither exists
	 * returns the featured image array with null values.
	 *
	 * @param object $post The current post.
	 * @return array The featured image id and URLs
	 */
	public static function get_featured_or_first_post_image( $post ) {
		$image_id    = null;
		$image_url   = null;
		$image_thumb = null;

		$post_id = $post->ID;

		// If a featured image exists for the post, use that thumbnail.
		if ( has_post_thumbnail( $post_id ) ) {
			$image_id    = get_post_thumbnail_id( $post_id );
			$image_url   = get_the_post_thumbnail_url( $post_id );
			$image_thumb = get_the_post_thumbnail_url( $post_id, array( 50, 50 ) );
		} else {
			// If a featured image does not exist look for the first "media library" hosted image on the post.
			$attachment_id = self::get_first_image_id_from_post_content( $post->post_content );

			if ( null !== $attachment_id ) {
				$image_id    = $attachment_id;
				$image_url   = wp_get_attachment_image_url( $attachment_id, 'full-size' );
				$image_thumb = wp_get_attachment_image_url( $attachment_id, array( 50, 50 ) );
			}
		}

		return array(
			'id'    => $image_id,
			'url'   => $image_url,
			'thumb' => $image_thumb,
		);
	}

	/**
	 * Looks for the first image in the post content containing a class value of 'wp-image-{$attachment_id}' and
	 * returns the $attachment_id from that class value.
	 *
	 * @param string $post_content The current post's HTML content.
	 * @return int The image attachment id.
	 */
	public static function get_first_image_id_from_post_content( $post_content ) {
		$attachment_id = null;
		$dom           = new \DOMDocument();

		// libxml_use_internal_errors(true) silences PHP warnings and errors from malformed HTML in loadHTML().
		// you can consult libxml_get_last_error() or libxml_get_errors() to check for errors if needed.
		libxml_use_internal_errors( true );
		$dom->loadHTML( $post_content );

		// Media library images have a class attribute value containing 'wp-image-{$attachment_id}'.
		// Use DomXPath to parse the post content and get the first img tag containing 'wp-image-' as a class value.
		$class_name = 'wp-image-';
		$dom_x_path = new \DomXPath( $dom );
		$nodes      = $dom_x_path->query( "//img[contains(@class, '$class_name')]/@class" );

		if ( $nodes->length > 0 ) {
			// Get the class attribute value of the 1st image node (aka index 0).
			$class_value = $nodes[0]->value;

			// Ignore all class attribute values except 'wp-image{$attachment_id}'.
			preg_match( '/wp-image-\d+/', $class_value, $class_value );

			// Get the $attachment_id from the end of the class name value.
			$attachment_id = (int) str_replace( $class_name, '', $class_value[0] );
		}

		return $attachment_id;
	}
}
