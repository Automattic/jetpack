<?php
/**
 * This file contains the Post_Thumbnail class used for finding a suitable thumbnail for a post.
 *
 * @package automattic/jetpack-post-list
 */

namespace Automattic\Jetpack\Post_List;

/**
 * The Post_Thumbnail class contains methods to find and return a suitable thumbnail for a post.
 */
class Post_Thumbnail {
	/**
	 * Returns the featured image thumbnail or if no featured image is set, return the first image in the post. If
	 * neither exists returns the image array with null values.
	 *
	 * @param object $post The current post.
	 * @return array|null The thumbnail image id and URLs
	 */
	public static function get_post_thumbnail( $post ) {
		$image_id    = null;
		$image_url   = null;
		$image_alt   = null;
		$image_thumb = false;

		$post_id = $post->ID;

		// If a featured image exists for the post, use that thumbnail.
		if ( has_post_thumbnail( $post_id ) ) {
			$image_id    = get_post_thumbnail_id( $post_id );
			$image_url   = get_the_post_thumbnail_url( $post_id );
			$image_thumb = get_the_post_thumbnail_url( $post_id, array( 50, 50 ) );
			$image_alt   = get_post_meta( $image_id, '_wp_attachment_image_alt', true );
		} else {
			// If a featured image does not exist look for the first "media library" hosted image on the post.
			$attachment_id = self::get_first_image_id_from_post_content( $post->post_content );

			if ( null !== $attachment_id ) {
				$image_id    = $attachment_id;
				$image_url   = wp_get_attachment_image_url( $attachment_id, 'full-size' );
				$image_thumb = wp_get_attachment_image_url( $attachment_id, array( 50, 50 ) );
				$image_alt   = get_post_meta( $attachment_id, '_wp_attachment_image_alt', true );
			}
		}

		// If no thumbnail is found return null.
		if ( false === $image_thumb ) {
			return null;
		}

		// Escape values just in case.
		return array(
			'id'    => esc_attr( $image_id ),
			'url'   => esc_url( $image_url ),
			'thumb' => esc_url( $image_thumb ),
			'alt'   => esc_attr( $image_alt ),
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
		// If $post_content does not contain a value of substance, return null right away and avoid trying to parse it.
		if ( empty( $post_content ) || false === strpos( $post_content, 'wp-image-' ) ) {
			return null;
		}

		$processor = new \WP_HTML_Tag_Processor( $post_content );
		while ( $processor->next_tag( 'img' ) ) {
			$class = $processor->get_attribute( 'class' );
			if ( ! is_string( $class ) ) {
				continue;
			}

			// A class name must be separated from other class names by HTML whitespace.
			$id_pattern = "~(?:^|[ \t\f\r\n])wp-image-(?P<attachment_id>[1-9]\d*)(?:[ \t\f\r\n]|$)~";
			if ( 1 !== preg_match( $id_pattern, $class, $id_match ) ) {
				continue;
			}

			list( /* full match */, $attachment_id ) = $id_match;

			// The pattern matched a non-zero positive integer, so it's safe to cast to (int).
			return (int) $attachment_id;
		}
	}
}
