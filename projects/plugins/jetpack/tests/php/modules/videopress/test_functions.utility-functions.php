<?php
/**
 * Class WP_Test_Jetpack_VideoPress_Utility_Functions
 *
 * Note that modules/videopress/utility-functions.php is automatically loaded and does not need to be required in this file.
 *
 * @package automattic/jetpack
 */

/**
 * Tests Jetpack_VideoPress_Utility_Functions
 */
class WP_Test_Jetpack_VideoPress_Utility_Functions extends WP_UnitTestCase {

	/**
	 * Tests a helper function to get the post by guid, when there is no post found.
	 *
	 * @covers ::videopress_get_post_by_guid
	 * @since 8.4.0
	 */
	public function test_no_post_found_videopress_get_post_by_guid() {
		$this->assertFalse( videopress_get_post_by_guid( wp_generate_uuid4() ) );
	}

	/**
	 * Gets the test data for test_non_cached_videopress_get_post_by_guid().
	 *
	 * @since 8.4.0
	 *
	 * @return array The test data.
	 */
	public function get_data_test_video_non_cached() {
		return array(
			'external_object_cache_is_enabled'     => array(
				'wp_cache_get',
				true,
				'get_post_by_guid_',
				'videopress',
			),
			'external_object_cache_is_not_enabled' => array(
				'get_transient',
				false,
				'videopress_get_post_id_by_guid_',
			),
		);
	}

	/**
	 * Tests a helper function to get the post by guid, when there's initially no cached value.
	 *
	 * @dataProvider get_data_test_video_non_cached
	 * @covers ::videopress_get_post_by_guid
	 * @since 8.4.0
	 *
	 * @param callable    $callback The callback to get the caching.
	 * @param bool        $should_cache_object Whether the entire WP_Post should be cached, or simply the post ID.
	 * @param string      $cache_key_base The base of the cache key.
	 * @param string|null $cache_group The cache group, if any.
	 */
	public function test_non_cached_videopress_get_post_by_guid( $callback, $should_cache_object, $cache_key_base, $cache_group = null ) {
		$guid          = wp_generate_uuid4();
		$expected_id   = videopress_create_new_media_item( 'Example', $guid );
		$expected_post = get_post( $expected_id );
		$actual_post   = videopress_get_post_by_guid( $guid );

		$this->assertEquals( $expected_post, $actual_post );

		$caching_args = array( $cache_key_base . $guid );
		if ( $cache_group ) {
			$caching_args[] = $cache_group;
		}
		$expected_cached = $should_cache_object ? $expected_post : $expected_id;

		// The function should have cached the value.
		$this->assertEquals(
			$expected_cached,
			call_user_func_array( $callback, $caching_args )
		);
	}

	/**
	 * Gets the test data for test_cached_videopress_get_post_by_guid().
	 *
	 * @since 8.4.0
	 *
	 * @return array The test data.
	 */
	public function get_data_test_video_cached() {
		return array(
			'post_should_be_stored_in_cache'        => array(
				'wp_cache_set',
				true,
				'videopress',
			),
			'post_id_should_be_stored_in_transient' => array(
				'set_transient',
				false,
			),
		);
	}

	/**
	 * Tests a helper function to get the post by guid, when there is a cached value.
	 *
	 * As long as there is a non-expired cache value,
	 * this should return that instead of instantiating WP_Query.
	 *
	 * @dataProvider get_data_test_video_cached
	 * @covers ::videopress_get_post_by_guid
	 * @since 8.4.0
	 *
	 * @param callable    $callback The callback to set the caching.
	 * @param bool        $should_cache_object Whether the entire WP_Post should be cached, or simply the post ID.
	 * @param string|null $cache_group The cache group, if any.
	 */
	public function test_cached_videopress_get_post_by_guid( $callback, $should_cache_object, $cache_group = null ) {
		$guid            = wp_generate_uuid4();
		$attachment_id   = videopress_create_new_media_item( 'Example Title', $guid );
		$attachment_post = get_post( $attachment_id );
		$post_to_cache   = $should_cache_object ? $attachment_post : $attachment_id;
		$caching_args    = array( 'get_post_by_guid_' . $guid, $post_to_cache );

		if ( $cache_group ) {
			$caching_args[] = $cache_group;
		}

		call_user_func_array( $callback, $caching_args );

		// This should always return the WP_Post, even though the post ID is stored in the transient.
		$this->assertEquals(
			$attachment_post,
			videopress_get_post_by_guid( $guid )
		);
	}

	/**
	 * Gets the test data for test_cached_invalid_videopress_get_post_by_guid().
	 *
	 * @since 8.4.0
	 *
	 * @return array The test data.
	 */
	public function get_data_cached_invalid() {
		return array(
			'non_post_object'           => array( new stdClass() ),
			'int_but_not_valid_post_id' => array( PHP_INT_MAX ),
			'null'                      => array( null ),
			'zero'                      => array( 0 ),
		);
	}

	/**
	 * Tests invalid cached values that should be ignored.
	 *
	 * Unless the cached value is a WP_Post,
	 * the tested method should ignore it and query for the post.
	 *
	 * @dataProvider get_data_cached_invalid
	 * @covers ::videopress_get_post_by_guid
	 * @since 8.4.0
	 *
	 * @param mixed $invalid_cached_value A cached value that should be ignored.
	 */
	public function test_cached_invalid_videopress_get_post_by_guid( $invalid_cached_value ) {
		$guid          = wp_generate_uuid4();
		$attachment_id = videopress_create_new_media_item( 'Example Title', $guid );

		wp_cache_set( 'get_post_by_guid_' . $guid, $invalid_cached_value, 'videopress' );

		$this->assertEquals(
			get_post( $attachment_id ),
			videopress_get_post_by_guid( $guid )
		);
	}

	/**
	 * Tests Video Privacy Settings.
	 *
	 * @dataProvider privacy_settings_data_provider
	 *
	 * @covers VIDEOPRESS_PRIVACY::
	 *
	 * @param int $expected The expected privacy constant value.
	 * @param int $actual   The actual privacy constant value.
	 */
	public function test_videopress_privacy_settings_constants( $expected, $actual ) {
		$this->assertEquals( $expected, $actual );
	}

	/**
	 * Provides data for Video Privacy Settings Tests.
	 *
	 * @return array
	 */
	public function privacy_settings_data_provider() {
		return array(
			array( 0, VIDEOPRESS_PRIVACY::IS_PUBLIC ),
			array( 1, VIDEOPRESS_PRIVACY::IS_PRIVATE ),
			array( 2, VIDEOPRESS_PRIVACY::SITE_DEFAULT ),
		);
	}
	/**
	 * Tests a helper function to get the post id by guid.
	 *
	 * @covers ::videopress_get_post_id_by_guid
	 * @since 8.4.0
	 */
	public function test_non_cached_videopress_get_post_id_by_guid() {
		$guid           = wp_generate_uuid4();
		$expected_id    = videopress_create_new_media_item( 'Example', $guid );
		$actual_post_id = videopress_get_post_id_by_guid( $guid );

		$this->assertEquals( $expected_id, $actual_post_id );

		// The function should have cached the value.
		$this->assertEquals(
			$expected_id,
			get_transient( 'videopress_get_post_id_by_guid_' . $guid )
		);
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

		$this->assertStringContainsString( $contains, $filtered );
	}

}
