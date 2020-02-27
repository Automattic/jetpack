<?php
/**
 * Class WP_Test_Jetpack_VideoPress_Utility_Functions
 *
 * Note that modules/videopress/utility-functions.php is automatically loaded and does not need to be required in this file.
 *
 * @package Jetpack
 */

/**
 * Tests Jetpack_VideoPress_Utility_Functions
 */
class WP_Test_Jetpack_VideoPress_Utility_Functions extends WP_UnitTestCase {

	/**
	 * Tests a helper function to get the post by guid, when there is no post found.
	 *
	 * @covers ::video_get_post_by_guid
	 * @since 8.4.0
	 */
	public function test_no_post_found_video_get_post_by_guid() {
		$this->assertFalse( video_get_post_by_guid( wp_generate_uuid4() ) );
	}

	/**
	 * Tests a helper function to get the post by guid, when there's no cached value.
	 *
	 * @covers ::video_get_post_by_guid
	 * @since 8.4.0
	 */
	public function test_non_cached_video_get_post_by_guid() {
		$guid        = wp_generate_uuid4();
		$expected_id = self::factory()->attachment->create_upload_object( DIR_TESTDATA . '/images/test-image.jpg', 0 );
		wp_insert_attachment(
			array(
				'ID'             => $expected_id,
				'post_mime_type' => 'video/videopress',
			)
		);
		add_post_meta( $expected_id, 'videopress_guid', $guid );

		$actual_post = video_get_post_by_guid( $guid );
		$this->assertEquals( $expected_id, $actual_post->ID );
	}

	/**
	 * Tests a helper function to get the post by guid, when there is a cached value.
	 *
	 * As long as there is a non-expired cache value,
	 * this should return that instead of instantiating WP_Query.
	 *
	 * @covers ::video_get_post_by_guid
	 * @since 8.4.0
	 */
	public function test_cached_video_get_post_by_guid() {
		$attachment_id = self::factory()->attachment->create_upload_object( DIR_TESTDATA . '/images/test-image.jpg', 0 );
		wp_insert_attachment(
			array(
				'ID'             => $attachment_id,
				'post_mime_type' => 'video/videopress',
			)
		);
		add_post_meta( $attachment_id, 'videopress_guid', wp_generate_uuid4() );

		$cached_guid    = wp_generate_uuid4();
		$cached_post_id = $this->factory()->post->create();
		wp_cache_set( 'video_get_post_by_guid_' . $cached_guid, $cached_post_id, 'videopress' );

		$actual_post = video_get_post_by_guid( $cached_guid );
		$this->assertEquals( $cached_post_id, $actual_post->ID );
	}

	/**
	 * Tests the VideoPress Flash to oEmbedable URL filter.
	 *
	 * @author kraftbj
	 * @covers ::jetpack_videopress_flash_embed_filter
	 * @since 8.1.0
	 */
	public function test_jetpack_videopress_flash_embed_filter_flash() {
		$content  = '<p><embed src="http://v.wordpress.com/YtfS78jH" type="application/x-shockwave-flash" width="600" height="338"></embed></p>';
		$contains = 'https://videopress.com/v/YtfS78jH';

		$filtered = jetpack_videopress_flash_embed_filter( $content );

		$this->assertContains( $contains, $filtered );
	}

}
