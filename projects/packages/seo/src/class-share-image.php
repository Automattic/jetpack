<?php
/**
 * Default image for social cards without a content-specific image.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use WP_Error;
use WP_REST_Request;

/**
 * Supplies an owner-selected image through the existing social fallback.
 *
 * @since $$next-version$$
 */
class Share_Image {
	/**
	 * Option containing the attachment ID.
	 *
	 * @var string
	 */
	const OPTION = 'jetpack_seo_default_share_image';

	/** Register the fallback without changing Social's content-specific images. */
	public static function init() {
		add_filter( 'jetpack_og_default_site_image', array( __CLASS__, 'fallback_image' ), 20 );
	}

	/**
	 * Reject invalid media choices before core updates any settings.
	 *
	 * @param mixed           $response Previous response.
	 * @param array           $handler Route handler.
	 * @param WP_REST_Request $request Settings request.
	 * @return mixed
	 */
	public static function validate_request( $response, $handler, WP_REST_Request $request ) {
		if ( null !== $response || ! current_user_can( 'manage_options' ) || ! preg_match( '#^/wp/v2/(?:sites/[^/]+/)?settings$#', $request->get_route() ) || ! in_array( $request->get_method(), array( 'POST', 'PUT', 'PATCH' ), true ) || ! $request->has_param( self::OPTION ) ) {
			return $response;
		}
		$value = $request->get_param( self::OPTION );
		if ( 0 === $value ) {
			return $response;
		}
		if ( ! current_user_can( 'upload_files' ) || ! current_user_can( 'edit_post', $value ) || ! self::image( $value ) ) {
			return new WP_Error( 'jetpack_seo_invalid_share_image', __( 'Choose a JPEG, PNG, GIF or WebP image from the Media Library.', 'jetpack-seo' ), array( 'status' => 400 ) );
		}
		return $response;
	}

	/**
	 * Resolve a supported attachment on the current site.
	 *
	 * @param int $id Attachment ID.
	 * @return array|null
	 */
	public static function image( $id ) {
		if ( ! $id || 'attachment' !== get_post_type( $id ) || 'trash' === get_post_status( $id ) || ! in_array( get_post_mime_type( $id ), array( 'image/jpeg', 'image/png', 'image/gif', 'image/webp' ), true ) ) {
			return null;
		}
		$image = wp_get_attachment_image_src( $id, 'full' );
		if ( ! $image || empty( $image[1] ) || empty( $image[2] ) ) {
			return null;
		}
		return array(
			'type'     => 'seo_default',
			'id'       => (int) $id,
			'src'      => $image[0],
			'width'    => $image[1],
			'height'   => $image[2],
			'alt_text' => (string) get_post_meta( $id, '_wp_attachment_image_alt', true ),
		);
	}

	/**
	 * Preserve an existing custom fallback, otherwise use the configured image.
	 *
	 * @param array $image Existing custom fallback.
	 * @return array
	 */
	public static function fallback_image( $image ) {
		if ( Seo_Tools::is_disabled() ) {
			return $image;
		}
		return ! empty( $image['src'] ) ? $image : ( self::image( (int) get_option( self::OPTION, 0 ) ) ?? $image );
	}
}
