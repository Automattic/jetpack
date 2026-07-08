<?php
/**
 * Tests for Automattic\Jetpack\VideoPress\Data methods
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WorDBless\BaseTestCase;

/**
 * Class Data_Test
 *
 * Tests that Data::get_video_data() produces the correct WP_Query parameters.
 */
class Data_Test extends BaseTestCase {

	/**
	 * Captured WP_Query instance.
	 *
	 * @var \WP_Query|null
	 */
	private $captured_query;

	/**
	 * VideoPress REST API data instance.
	 *
	 * @var WPCOM_REST_API_V2_Attachment_VideoPress_Data
	 */
	private static $videopress_rest_data;

	/**
	 * Set up once before all tests in this class.
	 */
	public static function set_up_before_class() {
		parent::set_up_before_class();

		// Load mock plugin to make Status::is_standalone_plugin_active() return true.
		require_once __DIR__ . '/assets/videopress-mock-plugin.txt';

		// Initialize VideoPress components once for all tests.
		Attachment_Handler::init();
		self::$videopress_rest_data = new WPCOM_REST_API_V2_Attachment_VideoPress_Data();
	}

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();

		$this->captured_query = null;

		// WorDBless resets hooks between tests, so re-register the
		// rest_attachment_query filter and REST fields each test.
		self::$videopress_rest_data->register_fields();
		self::$videopress_rest_data->add_jetpack_videopress_custom_query_filters();

		// Use high priority to capture before other filters might short-circuit.
		add_filter( 'posts_pre_query', array( $this, 'capture_query' ), 10, 2 );
	}

	/**
	 * Clean up after each test.
	 */
	public function tear_down() {
		remove_filter( 'posts_pre_query', array( $this, 'capture_query' ) );
		parent::tear_down();
	}

	/**
	 * Capture WP_Query instance for attachment queries.
	 *
	 * @param array|null $posts Return value to short-circuit.
	 * @param \WP_Query  $query The WP_Query instance.
	 * @return array Empty array to short-circuit the query.
	 */
	public function capture_query( $posts, $query ) {
		if ( $query->get( 'post_type' ) === 'attachment' ) {
			$this->captured_query = $query;
			// Return empty array to short-circuit the actual database query.
			return array();
		}

		return $posts;
	}

	/**
	 * Test that get_video_data for VideoPress videos queries only video/videopress mime type.
	 *
	 * The bug was that using both media_type=video AND mime_type=video/videopress
	 * caused WordPress to include ALL video mime types in the query instead of just video/videopress.
	 */
	public function test_get_video_data_for_videopress_queries_only_videopress_mime_type() {
		// Call get_video_data for VideoPress videos.
		Data::get_video_data();

		$this->assertNotNull( $this->captured_query, 'WP_Query should have been executed' );

		$mime_types = (array) $this->captured_query->query_vars['post_mime_type'];

		$this->assertContains( 'video/videopress', $mime_types, 'Query should include video/videopress mime type' );
		$this->assertCount( 1, $mime_types, 'Query should ONLY include video/videopress, not other video types' );
	}

	/**
	 * Test that get_video_data for local videos queries all video mime types
	 * and uses meta_query to exclude VideoPress videos.
	 */
	public function test_get_video_data_for_local_queries_video_mime_types() {
		// Call get_video_data for local (non-VideoPress) videos.
		Data::get_video_data( false );

		$this->assertNotNull( $this->captured_query, 'WP_Query should have been executed' );

		$mime_types = (array) $this->captured_query->query_vars['post_mime_type'];

		// Local video query uses media_type=video which includes all video mime types.
		$this->assertGreaterThan( 1, count( $mime_types ), 'Local video query should include multiple video mime types' );
		$this->assertContains( 'video/mp4', $mime_types, 'Local video query should include video/mp4' );

		// VideoPress videos are excluded via meta_query (no_videopress parameter).
		$meta_query = $this->captured_query->meta_query;
		$this->assertNotNull( $meta_query, 'meta_query should be set to exclude VideoPress videos' );

		// Check that meta_query excludes posts with videopress_guid.
		$has_videopress_exclusion = false;
		foreach ( $meta_query->queries as $query ) {
			if ( is_array( $query ) && isset( $query['key'] ) && $query['key'] === 'videopress_guid' && $query['compare'] === 'NOT EXISTS' ) {
				$has_videopress_exclusion = true;
				break;
			}
		}
		$this->assertTrue( $has_videopress_exclusion, 'meta_query should exclude posts with videopress_guid' );
	}

	/**
	 * Test that VideoPress query does NOT pass media_type parameter to REST API.
	 *
	 * This is the actual fix validation: ensuring media_type is not sent for VideoPress queries.
	 * When media_type=video is combined with mime_type=video/videopress, WordPress may fall back
	 * to all video types if video/videopress is not in the allowed mime types list.
	 */
	public function test_videopress_query_does_not_include_media_type_parameter() {
		$captured_params = null;

		// Capture the REST API request parameters before WordPress processes them.
		add_filter(
			'rest_pre_dispatch',
			function ( $result, $server, $request ) use ( &$captured_params ) {
				if ( strpos( $request->get_route(), '/wp/v2/media' ) !== false ) {
					$captured_params = $request->get_params();
				}
				return $result;
			},
			10,
			3
		);

		Data::get_video_data();

		$this->assertNotNull( $captured_params, 'REST API request should have been made' );
		$this->assertArrayHasKey( 'mime_type', $captured_params, 'Request should include mime_type parameter' );
		$this->assertEquals( 'video/videopress', $captured_params['mime_type'], 'mime_type should be video/videopress' );
		$this->assertArrayNotHasKey( 'media_type', $captured_params, 'Request should NOT include media_type parameter (this causes the bug)' );
	}

	/**
	 * Invokes the private Data::prepare_videopress_video_data() method.
	 *
	 * @param array|object $video A single video entry from the media REST endpoint.
	 * @return array The formatted video data.
	 */
	private function prepare_videopress_video_data( $video ) {
		$method = new \ReflectionMethod( Data::class, 'prepare_videopress_video_data' );

		// setAccessible() is required to invoke private methods on PHP < 8.1, but
		// is a no-op (and deprecated as of 8.5) on newer versions.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		return $method->invoke( null, $video );
	}

	/**
	 * Returns a video entry as the media REST endpoint shapes it, with the
	 * jetpack_videopress field fully populated.
	 *
	 * @param array $media_details The media_details value to use.
	 * @return array
	 */
	private function videopress_rest_video( $media_details ) {
		return array(
			'id'                      => 123,
			'jetpack_videopress_guid' => 'abcd1234',
			'media_details'           => $media_details,
			'jetpack_videopress'      => array(
				'title'                => 'Test video',
				'description'          => '',
				'caption'              => '',
				'rating'               => 'G',
				'allow_download'       => 0,
				'display_embed'        => 0,
				'privacy_setting'      => 2,
				'needs_playback_token' => false,
				'is_private'           => false,
			),
		);
	}

	/**
	 * Test that prepare_videopress_video_data does not emit warnings when the
	 * media_details is missing the `videopress`, `width` and `height` keys.
	 *
	 * Videos that are still processing (or otherwise have partial metadata) come
	 * back from the media REST endpoint without those keys. The data-shaping map
	 * previously accessed them directly, raising "Undefined array key" and
	 * "Trying to access array offset on null" warnings for every such video.
	 */
	public function test_prepare_videopress_video_data_handles_missing_media_details() {
		// media_details intentionally lacks `videopress`, `width` and `height`.
		$result = $this->prepare_videopress_video_data( $this->videopress_rest_video( array( 'length' => 5 ) ) );

		$this->assertSame( 123, $result['id'] );
		$this->assertNull( $result['url'] );
		$this->assertNull( $result['posterImage'] );
		$this->assertNull( $result['width'] );
		$this->assertNull( $result['height'] );
		$this->assertNull( $result['thumbnail'] );
		$this->assertNull( $result['filename'] );
		$this->assertSame( array( 'src' => null ), $result['poster'] );
	}

	/**
	 * Test that prepare_videopress_video_data maps a fully-populated video.
	 */
	public function test_prepare_videopress_video_data_maps_complete_media_details() {
		$video = $this->videopress_rest_video(
			array(
				'width'      => 1920,
				'height'     => 1080,
				'videopress' => array(
					'original'      => 'https://videos.example.com/original.mp4',
					'poster'        => 'https://videos.example.com/poster.jpg',
					'upload_date'   => '2026-01-01',
					'duration'      => 12345,
					'file_url_base' => array( 'https' => 'https://videos.example.com/' ),
					'finished'      => true,
					'files'         => array( 'dvd' => array( 'original_img' => 'thumb.jpg' ) ),
				),
			)
		);
		$video['jetpack_videopress']['privacy_setting'] = 0;

		$result = $this->prepare_videopress_video_data( $video );

		$this->assertSame( 'https://videos.example.com/original.mp4', $result['url'] );
		$this->assertSame( 'https://videos.example.com/poster.jpg', $result['posterImage'] );
		$this->assertSame( 1920, $result['width'] );
		$this->assertSame( 1080, $result['height'] );
		$this->assertSame( 'original.mp4', $result['filename'] );
		$this->assertSame( 'https://videos.example.com/thumb.jpg', $result['thumbnail'] );
	}

	/**
	 * Test that the thumbnail is null when the DVD image is present but its base
	 * URL is missing, rather than a bare, relative filename.
	 */
	public function test_prepare_videopress_video_data_thumbnail_null_without_base_url() {
		$video = $this->videopress_rest_video(
			array(
				'videopress' => array(
					// original_img is present, but file_url_base is missing.
					'files' => array( 'dvd' => array( 'original_img' => 'thumb.jpg' ) ),
				),
			)
		);
		$video['jetpack_videopress']['privacy_setting'] = 0;

		$result = $this->prepare_videopress_video_data( $video );

		$this->assertNull( $result['thumbnail'] );
	}

	/**
	 * Test that auto-generated subtitles are not disabled by default (subtitles on).
	 */
	public function test_auto_subtitles_disabled_defaults_to_false() {
		delete_option( 'videopress_auto_subtitles_disabled' );

		$this->assertFalse( Data::get_videopress_auto_subtitles_disabled() );
	}

	/**
	 * Test that the stored auto-generated subtitles opt-out option is honored.
	 */
	public function test_auto_subtitles_disabled_reflects_stored_option() {
		update_option( 'videopress_auto_subtitles_disabled', true );

		$this->assertTrue( Data::get_videopress_auto_subtitles_disabled() );
	}

	/**
	 * Test that get_videopress_settings exposes the auto-generated subtitles opt-out value.
	 */
	public function test_get_videopress_settings_includes_auto_subtitles() {
		update_option( 'videopress_auto_subtitles_disabled', true );

		$settings = Data::get_videopress_settings();

		$this->assertArrayHasKey( 'videopress_auto_subtitles_disabled', $settings );
		$this->assertTrue( $settings['videopress_auto_subtitles_disabled'] );
	}
}
