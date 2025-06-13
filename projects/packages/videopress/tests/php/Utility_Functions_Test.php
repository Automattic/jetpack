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
}
