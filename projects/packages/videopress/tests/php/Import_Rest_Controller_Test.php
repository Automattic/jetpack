<?php
/**
 * Tests for the Studio YouTube import controller's local-record logic:
 * the completion endpoint and the draft-thumbnail delete cascade.
 *
 * The listing/import routes lean on WP_Query meta queries and media
 * sideloading, which WorDBless does not support — those paths are covered
 * by the JS suites against mocked responses instead.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WorDBless\BaseTestCase;
use WP_Error;
use WP_REST_Request;

/**
 * Test suite for Import_Rest_Controller::complete_import() and
 * Import_Rest_Controller::cleanup_draft_thumbnail().
 */
class Import_Rest_Controller_Test extends BaseTestCase {

	/**
	 * Create a draft placeholder attachment with import meta.
	 *
	 * @param int $thumbnail_id Sideloaded thumbnail attachment ID (0 for none).
	 * @return int The placeholder attachment ID.
	 */
	private function create_draft( $thumbnail_id = 0 ) {
		$draft_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'post_mime_type' => Import_Rest_Controller::DRAFT_MIME_TYPE,
				'post_title'     => 'Imported draft',
			)
		);

		update_post_meta(
			$draft_id,
			Import_Rest_Controller::META_IMPORT,
			array(
				'source'                  => 'youtube',
				'external_id'             => 'yt-abc',
				'title'                   => 'Imported draft',
				'thumbnail_attachment_id' => $thumbnail_id,
			)
		);
		update_post_meta( $draft_id, Import_Rest_Controller::META_IMPORT_EXTERNAL_ID, 'youtube:yt-abc' );
		update_post_meta( $draft_id, Import_Rest_Controller::META_IMPORT_STATUS, Import_Rest_Controller::STATUS_AWAITING_MEDIA );

		return $draft_id;
	}

	/**
	 * Create an image attachment standing in for a sideloaded thumbnail.
	 *
	 * @param bool $flagged Whether to set the videopress_poster_image flag.
	 * @return int The attachment ID.
	 */
	private function create_thumbnail( $flagged = true ) {
		$thumbnail_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'post_mime_type' => 'image/jpeg',
				'post_title'     => 'Sideloaded thumbnail',
			)
		);
		if ( $flagged ) {
			update_post_meta( $thumbnail_id, 'videopress_poster_image', 1 );
		}

		return $thumbnail_id;
	}

	/**
	 * Create a plain video attachment standing in for the uploaded video.
	 *
	 * @return int The attachment ID.
	 */
	private function create_video() {
		return wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'post_mime_type' => 'video/videopress',
				'post_title'     => 'Uploaded video',
			)
		);
	}

	/**
	 * Build a REST request for the completion endpoint.
	 *
	 * @param int $draft_id The draft placeholder ID.
	 * @param int $media_id The uploaded video ID.
	 * @return WP_REST_Request
	 */
	private function complete_request( $draft_id, $media_id ) {
		$request = new WP_REST_Request( 'POST', '/jetpack/v4/videopress/import/complete' );
		$request->set_param( 'draft_id', $draft_id );
		$request->set_param( 'media_id', $media_id );

		return $request;
	}

	/**
	 * Tests that complete_import moves the markers onto the video and deletes the draft.
	 */
	public function test_complete_import_moves_markers_and_deletes_draft() {
		$draft_id = $this->create_draft();
		$media_id = $this->create_video();

		$controller = new Import_Rest_Controller();
		$response   = $controller->complete_import( $this->complete_request( $draft_id, $media_id ) );

		$this->assertNotInstanceOf( WP_Error::class, $response );
		$this->assertSame(
			array(
				'completed' => true,
				'media_id'  => $media_id,
			),
			$response->get_data()
		);

		// Markers now live on the completed video…
		$this->assertSame( 'youtube:yt-abc', get_post_meta( $media_id, Import_Rest_Controller::META_IMPORT_EXTERNAL_ID, true ) );
		$this->assertSame( Import_Rest_Controller::STATUS_COMPLETED, get_post_meta( $media_id, Import_Rest_Controller::META_IMPORT_STATUS, true ) );
		$import = get_post_meta( $media_id, Import_Rest_Controller::META_IMPORT, true );
		$this->assertIsArray( $import );
		$this->assertSame( 'yt-abc', $import['external_id'] );

		// …and the placeholder is gone.
		$this->assertNull( get_post( $draft_id ) );
	}

	/**
	 * Tests that complete_import rejects a draft_id that is not a draft placeholder.
	 */
	public function test_complete_import_rejects_non_draft() {
		$media_id = $this->create_video();

		$controller = new Import_Rest_Controller();
		$response   = $controller->complete_import( $this->complete_request( $media_id, $media_id ) );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'import_draft_not_found', $response->get_error_code() );
	}

	/**
	 * Tests that complete_import rejects a media_id that does not exist (or is a draft).
	 */
	public function test_complete_import_rejects_missing_media() {
		$draft_id = $this->create_draft();

		$controller = new Import_Rest_Controller();
		$response   = $controller->complete_import( $this->complete_request( $draft_id, 987654 ) );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'import_media_not_found', $response->get_error_code() );

		// The draft survives a failed completion.
		$this->assertNotNull( get_post( $draft_id ) );
	}

	/**
	 * Deleting a draft cascades to its flagged sideloaded thumbnail.
	 */
	public function test_cleanup_draft_thumbnail_deletes_flagged_thumbnail() {
		$thumbnail_id = $this->create_thumbnail();
		$draft_id     = $this->create_draft( $thumbnail_id );

		Import_Rest_Controller::cleanup_draft_thumbnail( $draft_id, get_post( $draft_id ) );

		$this->assertNull( get_post( $thumbnail_id ) );
	}

	/**
	 * The cascade refuses to delete images the sideloader did not flag.
	 */
	public function test_cleanup_draft_thumbnail_skips_unflagged_attachment() {
		$thumbnail_id = $this->create_thumbnail( false );
		$draft_id     = $this->create_draft( $thumbnail_id );

		Import_Rest_Controller::cleanup_draft_thumbnail( $draft_id, get_post( $draft_id ) );

		$this->assertNotNull( get_post( $thumbnail_id ) );
	}

	/**
	 * The cascade ignores attachments that are not draft placeholders.
	 */
	public function test_cleanup_draft_thumbnail_ignores_non_drafts() {
		$thumbnail_id = $this->create_thumbnail();
		$video_id     = $this->create_video();
		update_post_meta(
			$video_id,
			Import_Rest_Controller::META_IMPORT,
			array( 'thumbnail_attachment_id' => $thumbnail_id )
		);

		Import_Rest_Controller::cleanup_draft_thumbnail( $video_id, get_post( $video_id ) );

		$this->assertNotNull( get_post( $thumbnail_id ) );
	}
}
