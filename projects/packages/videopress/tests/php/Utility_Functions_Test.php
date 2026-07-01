<?php
/**
 * Tests for functions defined in utility-functions.php.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack;

use PHPUnit\Framework\Attributes\BeforeClass;
use WorDBless\BaseTestCase;
use WorDBless\Posts;

class Utility_Functions_Test extends BaseTestCase {

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
	 * Test video_get_info_by_blogpostid when $post_id is invalid.
	 */
	public function test_video_get_info_by_blogpostid_invalid_post_id() {
		$blog_id = 1;
		$post_id = -1;

		$video_info = video_get_info_by_blogpostid( $blog_id, $post_id );

		// Check that the returned object has default values
		$this->assertInstanceOf( 'stdClass', $video_info );
		$this->assertSame( 0, $video_info->post_id );
		$this->assertSame( '', $video_info->description );
		$this->assertSame( '', $video_info->title );
		$this->assertSame( '', $video_info->caption );
		$this->assertSame( $blog_id, $video_info->blog_id );
		$this->assertNull( $video_info->guid );
		$this->assertSame( '0000-00-00 00:00:00', $video_info->finish_date_gmt );
		$this->assertNull( $video_info->rating );
		$this->assertSame( 2, $video_info->privacy_setting ); // 2 = Site default
	}

	/**
	 * Test video_get_info_by_blogpostid with non-VideoPress $post_id.
	 */
	public function test_video_get_info_by_blogpostid_non_videopress_post() {
		$blog_id = 1;

		$post_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_mime_type' => 'image/jpeg',
				'post_title'     => 'Test image',
				'post_content'   => 'Test content',
				'post_excerpt'   => 'Test caption',
			)
		);

		$video_info = video_get_info_by_blogpostid( $blog_id, $post_id );

		// Check that the returned object has basic post data but no VideoPress specific data
		$this->assertInstanceOf( 'stdClass', $video_info );
		$this->assertSame( $post_id, $video_info->post_id );
		$this->assertSame( $blog_id, $video_info->blog_id );
		$this->assertSame( 'Test content', $video_info->description );
		$this->assertSame( 'Test image', $video_info->title );
		$this->assertSame( 'Test caption', $video_info->caption );
		$this->assertNull( $video_info->guid );
		$this->assertSame( '0000-00-00 00:00:00', $video_info->finish_date_gmt );
		$this->assertNull( $video_info->rating );
		$this->assertSame( 2, $video_info->privacy_setting ); // 2 = Site default
	}

	/**
	 * Test video_get_info_by_blogpostid with VideoPress $post_id.
	 */
	public function test_video_get_info_by_blogpostid_videopress_post() {
		$blog_id = 1;
		$guid    = 'abc123xyz';

		// Create a VideoPress post
		$post_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_mime_type' => 'video/videopress',
				'post_title'     => 'Test video',
				'post_content'   => 'Test description',
				'post_excerpt'   => 'Test caption',
			)
		);

		// Add GUID meta
		add_post_meta( $post_id, 'videopress_guid', $guid );

		$finish_time = time();

		// Add attachment metadata
		$metadata = array(
			'videopress' => array(
				'rating'          => 'G',
				'allow_download'  => 1,
				'display_embed'   => 1,
				'privacy_setting' => 1, // 1 = Private
				'finished'        => $finish_time,
			),
		);
		wp_update_attachment_metadata( $post_id, $metadata );

		$video_info = video_get_info_by_blogpostid( $blog_id, $post_id );

		// Check VideoPress data
		$this->assertInstanceOf( 'stdClass', $video_info );
		$this->assertSame( $post_id, $video_info->post_id );
		$this->assertSame( $blog_id, $video_info->blog_id );
		$this->assertSame( 'Test description', $video_info->description );
		$this->assertSame( 'Test video', $video_info->title );
		$this->assertSame( 'Test caption', $video_info->caption );
		$this->assertSame( $guid, $video_info->guid );
		$this->assertSame( gmdate( 'Y-m-d H:i:s', $finish_time ), $video_info->finish_date_gmt );
		$this->assertSame( 'G', $video_info->rating );
		$this->assertSame( 1, $video_info->allow_download );
		$this->assertSame( 1, $video_info->display_embed );
		$this->assertSame( 1, $video_info->privacy_setting ); // 1 = Private
	}

	/**
	 * Test videopress_is_finished_processing returns false when no VideoPress meta is present.
	 */
	public function test_videopress_is_finished_processing_without_meta() {
		$post_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_mime_type' => 'video/videopress',
				'post_title'     => 'Test video',
			)
		);

		$this->assertFalse( videopress_is_finished_processing( $post_id ) );
	}

	/**
	 * Test videopress_is_finished_processing returns the stored finish timestamp when present.
	 */
	public function test_videopress_is_finished_processing_returns_timestamp() {
		$post_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_mime_type' => 'video/videopress',
				'post_title'     => 'Test video',
			)
		);

		$finish_time = time();
		wp_update_attachment_metadata(
			$post_id,
			array(
				'videopress' => array(
					'finished' => $finish_time,
				),
			)
		);

		$this->assertSame( $finish_time, videopress_is_finished_processing( $post_id ) );
	}

	/**
	 * Test that video_image_url_by_guid returns null without warnings when no
	 * post matches the guid.
	 *
	 * The videopress_get_post_by_guid() helper returns false (not a WP_Error)
	 * when no post is found. The function previously only guarded against
	 * WP_Error and then dereferenced false ($post->ID), raising "Attempt to read
	 * property on false" and "array offset on false" warnings.
	 */
	public function test_video_image_url_by_guid_returns_null_for_unknown_guid() {
		$this->assertNull( video_image_url_by_guid( 'nonexistent-guid', 'jpg' ) );
	}

	/**
	 * Test that video_image_url_by_guid returns null without warnings when the
	 * attachment is found but has no usable poster metadata.
	 *
	 * When wp_get_attachment_metadata() returns false (no metadata stored), or
	 * the metadata lacks videopress['poster'], reading
	 * $meta['videopress']['poster'] previously raised "Trying to access array
	 * offset on false" / "Undefined array key" warnings.
	 */
	public function test_video_image_url_by_guid_returns_null_for_missing_poster_metadata() {
		// Attachment with a guid but no stored metadata: wp_get_attachment_metadata() returns false.
		$no_meta_guid = 'guid-without-metadata';
		$no_meta_id   = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_mime_type' => 'video/videopress',
				'post_status'    => 'inherit',
				'post_title'     => 'VideoPress video without metadata',
			)
		);
		// Prime the guid->ID lookup cache directly, since the meta_query lookup is not supported by the test DB.
		set_transient( 'videopress_get_post_id_by_guid_' . $no_meta_guid, $no_meta_id, HOUR_IN_SECONDS );

		$this->assertNull( video_image_url_by_guid( $no_meta_guid, 'jpg' ) );

		// Attachment whose metadata exists but lacks a videopress poster.
		$partial_guid = 'guid-with-partial-metadata';
		$partial_id   = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_mime_type' => 'video/videopress',
				'post_status'    => 'inherit',
				'post_title'     => 'VideoPress video with partial metadata',
			)
		);
		wp_update_attachment_metadata( $partial_id, array( 'videopress' => array( 'finished' => false ) ) );
		set_transient( 'videopress_get_post_id_by_guid_' . $partial_guid, $partial_id, HOUR_IN_SECONDS );

		$this->assertNull( video_image_url_by_guid( $partial_guid, 'jpg' ) );
	}

	/**
	 * Test that videopress_update_meta_data returns false without warnings when
	 * the stored videopress metadata has no guid.
	 *
	 * Attachment metadata can contain a `videopress` key without a `guid` (e.g.
	 * a video still being processed). Building the request URL from $info->guid
	 * previously raised an "Undefined property: stdClass::$guid" warning.
	 */
	public function test_videopress_update_meta_data_without_guid_returns_false() {
		$post_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_mime_type' => 'video/videopress',
				'post_title'     => 'Processing video',
			)
		);

		wp_update_attachment_metadata(
			$post_id,
			array(
				'videopress' => array(
					'finished' => false,
				),
			)
		);

		$this->assertFalse( videopress_update_meta_data( $post_id ) );
	}
}
