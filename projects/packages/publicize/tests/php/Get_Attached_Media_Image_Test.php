<?php
/**
 * Tests for Publicize_Base::get_attached_media_image().
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use PHPUnit\Framework\Attributes\CoversMethod;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Publicize\Publicize_Base::get_attached_media_image
 */
#[CoversMethod( Publicize_Base::class, 'get_attached_media_image' )]
class Get_Attached_Media_Image_Test extends BaseTestCase {

	/**
	 * Regression test for SOCIAL-498.
	 *
	 * The attached media image must be requested with a full [ width, height ] size
	 * pair. A single-element array made WordPress core read an undefined $size[1] in
	 * media.php, emitting "Undefined array key 1" warnings on the front end of posts
	 * shared with the "no link" option.
	 */
	public function test_get_attached_media_image_requests_two_dimension_size() {
		$attachment_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_mime_type' => 'image/png',
				'post_title'     => 'SOCIAL-498 attachment',
				'post_status'    => 'inherit',
			)
		);

		// wp_attachment_is_image() requires an attached file to be present.
		update_post_meta( $attachment_id, '_wp_attached_file', '2026/06/social-498.png' );

		$post_id = wp_insert_post(
			array(
				'post_title'  => 'SOCIAL-498 post',
				'post_status' => 'publish',
			)
		);

		update_post_meta(
			$post_id,
			Publicize_Base::POST_JETPACK_SOCIAL_OPTIONS,
			array( 'attached_media' => array( array( 'id' => $attachment_id ) ) )
		);

		$captured_size = null;
		add_filter(
			'wp_get_attachment_image_src',
			function ( $image, $id, $size ) use ( &$captured_size ) {
				$captured_size = $size;
				return $image;
			},
			10,
			3
		);

		( new Publicize() )->get_attached_media_image( $post_id );

		$this->assertSame( array( 1200, 1200 ), $captured_size );
	}
}
