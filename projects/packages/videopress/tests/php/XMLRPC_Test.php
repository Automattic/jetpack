<?php
/**
 * Tests for the VideoPress XMLRPC class.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use PHPUnit\Framework\Attributes\BeforeClass;
use WorDBless\BaseTestCase;
use WorDBless\Posts;

/**
 * Class to test the VideoPress XMLRPC class.
 */
class XMLRPC_Test extends BaseTestCase {

	/**
	 * Sets up the test environment before the class tests begin.
	 *
	 * @beforeClass
	 */
	#[BeforeClass]
	public static function set_up_class() {
		require_once __DIR__ . '/../../src/utility-functions.php';
		Posts::init();
	}

	/**
	 * The media item title, description and caption supplied by the uploader are applied to the
	 * created attachment.
	 */
	public function test_create_media_item_uses_supplied_meta() {
		$media = array(
			array(
				'url'         => 'https://videopress.com/v/original-file-name.mp4',
				'title'       => 'Edited Library Title',
				'description' => 'Edited library description',
				'caption'     => 'Edited library caption',
			),
		);

		$post = XMLRPC::init()->create_media_item( $media )['media'][0]['post'];

		$this->assertSame( 'Edited Library Title', $post->post_title );
		$this->assertSame( 'Edited library description', $post->post_content );
		$this->assertSame( 'Edited library caption', $post->post_excerpt );
	}

	/**
	 * A supplied title of "0" is treated as a real title, not as a missing value.
	 */
	public function test_create_media_item_keeps_zero_string_title() {
		$media = array(
			array(
				'url'   => 'https://videopress.com/v/original-file-name.mp4',
				'title' => '0',
			),
		);

		$this->assertSame( '0', XMLRPC::init()->create_media_item( $media )['media'][0]['post']->post_title );
	}

	/**
	 * When no title is supplied, the attachment falls back to a title derived from the file name.
	 */
	public function test_create_media_item_falls_back_to_file_name() {
		$media = array(
			array(
				'url' => 'https://videopress.com/v/original-file-name.mp4',
			),
		);

		$result = XMLRPC::init()->create_media_item( $media );

		$this->assertSame( sanitize_title( 'original-file-name.mp4' ), $result['media'][0]['post']->post_title );
	}

	/**
	 * Copy retries return the same attachment without resetting its completed metadata.
	 */
	public function test_copy_request_reuses_the_attachment() {
		$request_id = 'source12:32457391-3ebf-4c67-ac58-a34dd71399bf';
		$media      = array(
			array(
				'title'                      => 'New video',
				'videopress_copy_request_id' => $request_id,
			),
		);
		$first      = XMLRPC::init()->create_videopress_copy( $media );
		$post_id    = $first['media'][0]['post']->ID;
		$metadata   = array(
			'videopress' => array(
				'guid'     => 'newcopy1',
				'finished' => true,
			),
		);
		wp_update_attachment_metadata( $post_id, $metadata );
		$second = XMLRPC::init()->create_videopress_copy( $media );

		$this->assertSame( $post_id, $second['media'][0]['post']->ID );
		$this->assertSame( $request_id, $second['media'][0]['videopress_copy_request_id_ack'] );
		$this->assertSame( $request_id, get_post_meta( $post_id, '_videopress_copy_request_id', true ) );
		$this->assertSame( $metadata, wp_get_attachment_metadata( $post_id ) );
	}

	/**
	 * An in-flight or uncertain creation is never replaced by a duplicate attachment.
	 */
	public function test_copy_request_keeps_an_uncertain_reservation() {
		$request_id = 'source12:32457391-3ebf-4c67-ac58-a34dd71399b0';
		$option     = 'videopress_copy_attachment_' . hash( 'sha256', $request_id );
		add_option( $option, 0, '', false );
		$result = XMLRPC::init()->create_videopress_copy( array( array( 'videopress_copy_request_id' => $request_id ) ) );

		$this->assertArrayHasKey( 'videopress_copy_attachment_pending', $result['errors'] );
		$this->assertSame( 0, (int) get_option( $option ) );
	}

	/**
	 * A deleted copy is not recreated by replaying an old request.
	 */
	public function test_copy_request_does_not_recreate_a_deleted_attachment() {
		$request_id = 'source12:32457391-3ebf-4c67-ac58-a34dd71399b1';
		$media      = array(
			array(
				'title'                      => 'New video',
				'videopress_copy_request_id' => $request_id,
			),
		);
		$first      = XMLRPC::init()->create_videopress_copy( $media );
		wp_delete_post( $first['media'][0]['post']->ID, true );
		$second = XMLRPC::init()->create_videopress_copy( $media );

		$this->assertArrayHasKey( 'videopress_copy_attachment_unavailable', $second['errors'] );
	}

	/**
	 * Malformed copy identifiers are rejected before creating a media item.
	 */
	public function test_copy_request_rejects_an_invalid_identifier() {
		$result = XMLRPC::init()->create_videopress_copy( array( array( 'videopress_copy_request_id' => '../../invalid' ) ) );

		$this->assertArrayHasKey( 'videopress_copy_invalid_request', $result['errors'] );
	}

	/**
	 * The copy-only method rejects ordinary uploads before creating an attachment.
	 */
	public function test_copy_method_requires_its_idempotency_identifier() {
		$result = XMLRPC::init()->create_videopress_copy( array( array( 'title' => 'Incomplete copy request' ) ) );

		$this->assertArrayHasKey( 'videopress_copy_invalid_request', $result['errors'] );
	}
}
