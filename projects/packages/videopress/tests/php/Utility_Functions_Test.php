<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Tests for functions defined in utility-functions.php.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Connection\Tokens;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\BeforeClass;
use WorDBless\BaseTestCase;
use WorDBless\Posts;
use WP_Error;

/**
 * Tests for functions defined in utility-functions.php.
 */
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
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();

		// Simulate a connected site so Client::wpcom_json_api_request_as_blog() proceeds to HTTP request.
		( new Tokens() )->update_blog_token( 'test.test' );
		Jetpack_Options::update_option( 'id', 12345 );
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
	}

	/**
	 * Returns mock video data for testing create_local_media_library_for_videopress_guid.
	 *
	 * @param array $overrides Optional overrides for the mock data.
	 * @return object Mock video data object.
	 */
	public function get_mock_video_data( $overrides = array() ) {
		$defaults = array(
			'guid'            => 'abc12345',
			'blog_id'         => 12345, // Must match Jetpack_Options 'id' set in set_up().
			'title'           => 'Test Video Title',
			'description'     => 'Test video description',
			'upload_date'     => '2024-01-15 10:30:00',
			'width'           => 1920,
			'height'          => 1080,
			'original'        => 'https://videos.files.wordpress.com/abc12345/test.mp4',
			'rating'          => 'G',
			'allow_download'  => true,
			'display_embed'   => true,
			'privacy_setting' => 0,
			// Nested objects like the real API returns from json_decode().
			'files'           => (object) array(
				'dvd' => (object) array(
					'original_img' => 'test-thumbnail.jpg',
				),
			),
			'file_url_base'   => (object) array(
				'https' => 'https://videos.files.wordpress.com/abc12345/',
			),
		);

		return (object) array_merge( $defaults, $overrides );
	}

	/**
	 * Mock video data for the current test.
	 *
	 * @var object|null
	 */
	protected $mock_video_data = null;

	/**
	 * Filter callback to mock the VideoPress API response.
	 *
	 * @param false|array|\WP_Error $preempt A preemptive return value.
	 * @param array                 $args    Request arguments.
	 * @param string                $url     The request URL.
	 * @return array|false Mock response or false to proceed with the request.
	 */
	public function filter_mock_videopress_api( $preempt, $args, $url ) {
		// Only intercept VideoPress API calls.
		if ( strpos( $url, 'videos/' ) === false ) {
			return $preempt;
		}

		if ( null === $this->mock_video_data ) {
			return $preempt;
		}

		return array(
			'response' => array( 'code' => 200 ),
			'body'     => wp_json_encode( $this->mock_video_data, JSON_HEX_TAG | JSON_HEX_AMP ),
		);
	}

	/**
	 * Clear the VideoPress transient cache for a GUID.
	 *
	 * @param string $guid The video GUID.
	 */
	public function clear_video_cache( $guid ) {
		delete_transient( 'jetpack_videopress_' . $guid );
	}

	/**
	 * Whether a poster download was attempted.
	 *
	 * @var bool
	 */
	protected $poster_download_attempted = false;

	/**
	 * Filter callback to track poster download attempts.
	 *
	 * @param mixed  $response    The response to filter.
	 * @param array  $parsed_args Request arguments.
	 * @param string $url         The request URL.
	 * @return mixed The unmodified response.
	 */
	public function filter_track_poster_download( $response, $parsed_args, $url ) {
		if ( strpos( $url, 'poster.jpg' ) !== false ) {
			$this->poster_download_attempted = true;
		}
		return $response;
	}

	/**
	 * Filter callback to return WP_Error for invalid GUID.
	 *
	 * @return WP_Error Error object.
	 */
	public function filter_return_wp_error() {
		return new WP_Error( 'bad-guid-format', 'Invalid Video GUID!' );
	}

	/**
	 * Test video_get_info_by_blogpostid when $post_id is invalid.
	 */
	public function test_video_get_info_by_blogpostid_invalid_post_id() {
		$blog_id = 1;
		$post_id = -1;

		$video_info = video_get_info_by_blogpostid( $blog_id, $post_id );

		// Check that the returned object has default values.
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

		// Check that the returned object has basic post data but no VideoPress specific data.
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

		// Create a VideoPress post.
		$post_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_mime_type' => 'video/videopress',
				'post_title'     => 'Test video',
				'post_content'   => 'Test description',
				'post_excerpt'   => 'Test caption',
			)
		);

		// Add GUID meta.
		add_post_meta( $post_id, 'videopress_guid', $guid );

		$finish_time = time();

		// Add attachment metadata.
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

		// Check VideoPress data.
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
	 * Test create_local_media_library_for_videopress_guid sets post fields correctly.
	 */
	public function test_create_local_media_library_sets_post_fields() {
		$guid = 'abc12345';
		$this->clear_video_cache( $guid );
		$this->mock_video_data = $this->get_mock_video_data();

		add_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10, 3 );
		$attachment_id = create_local_media_library_for_videopress_guid( $guid );
		remove_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10 );

		$this->assertIsInt( $attachment_id );

		$post = get_post( $attachment_id );

		$this->assertSame( 'Test Video Title', $post->post_title );
		$this->assertSame( 'Test video description', $post->post_content );
		$this->assertSame( 'video/videopress', $post->post_mime_type );
		$this->assertSame( 'https://videopress.com/v/abc12345', $post->guid );
		$this->assertSame( '2024-01-15 10:30:00', $post->post_date );
	}

	/**
	 * Test create_local_media_library_for_videopress_guid sets post meta correctly.
	 */
	public function test_create_local_media_library_sets_post_meta() {
		$guid = 'abc12345';
		$this->clear_video_cache( $guid );
		$this->mock_video_data = $this->get_mock_video_data();

		add_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10, 3 );
		$attachment_id = create_local_media_library_for_videopress_guid( $guid );
		remove_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10 );

		$this->assertSame( $guid, get_post_meta( $attachment_id, 'videopress_guid', true ) );
		$this->assertSame( 'complete', get_post_meta( $attachment_id, 'videopress_status', true ) );
	}

	/**
	 * Test create_local_media_library_for_videopress_guid sets attachment metadata correctly.
	 */
	public function test_create_local_media_library_sets_attachment_metadata() {
		$guid = 'abc12345';
		$this->clear_video_cache( $guid );
		$this->mock_video_data = $this->get_mock_video_data();

		add_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10, 3 );
		$attachment_id = create_local_media_library_for_videopress_guid( $guid );
		remove_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10 );

		$metadata = wp_get_attachment_metadata( $attachment_id );

		$this->assertSame( 1920, $metadata['width'] );
		$this->assertSame( 1080, $metadata['height'] );
		$this->assertArrayHasKey( 'videopress', $metadata );
		$this->assertSame( 'abc12345', $metadata['videopress']['guid'] );
		$this->assertSame( 'Test Video Title', $metadata['videopress']['title'] );
		$this->assertArrayHasKey( 'original', $metadata );
		$this->assertSame( 'https://videos.files.wordpress.com/abc12345/test.mp4', $metadata['original']['url'] );

		// Verify nested structures are stored as arrays, not stdClass objects.
		// This is required for compatibility with Automattic\Jetpack\VideoPress\Data which uses array access.
		$this->assertIsArray( $metadata['videopress']['files'] );
		$this->assertIsArray( $metadata['videopress']['files']['dvd'] );
		$this->assertSame( 'test-thumbnail.jpg', $metadata['videopress']['files']['dvd']['original_img'] );
	}

	/**
	 * Test create_local_media_library_for_videopress_guid attempts to download poster when provided.
	 *
	 * Note: Full end-to-end poster download testing requires integration tests
	 * because download_url() streams directly to a temp file, bypassing the
	 * pre_http_request filter body. This test verifies the download is attempted.
	 */
	public function test_create_local_media_library_with_poster() {
		$guid = 'abc12345';
		$this->clear_video_cache( $guid );
		$this->mock_video_data           = $this->get_mock_video_data(
			array(
				'poster' => 'https://videos.files.wordpress.com/abc12345/poster.jpg',
			)
		);
		$this->poster_download_attempted = false;

		add_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10, 3 );
		add_filter( 'pre_http_request', array( $this, 'filter_track_poster_download' ), 10, 3 );
		$attachment_id = create_local_media_library_for_videopress_guid( $guid );
		remove_filter( 'pre_http_request', array( $this, 'filter_track_poster_download' ), 10 );
		remove_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10 );

		// Verify the video attachment was created.
		$this->assertIsInt( $attachment_id );
		$this->assertGreaterThan( 0, $attachment_id );

		// Verify poster download was attempted.
		$this->assertTrue( $this->poster_download_attempted, 'Poster download should be attempted when poster URL is provided' );
	}

	/**
	 * Test create_local_media_library_for_videopress_guid without poster.
	 */
	public function test_create_local_media_library_without_poster() {
		$guid = 'abc12345';
		$this->clear_video_cache( $guid );
		$this->mock_video_data = $this->get_mock_video_data(); // No poster in defaults.

		add_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10, 3 );
		$attachment_id = create_local_media_library_for_videopress_guid( $guid );
		remove_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10 );

		$thumbnail_id = get_post_meta( $attachment_id, '_thumbnail_id', true );

		$this->assertEmpty( $thumbnail_id );
	}

	/**
	 * Test create_local_media_library_for_videopress_guid with invalid GUID returns WP_Error.
	 */
	public function test_create_local_media_library_with_invalid_guid() {
		$result = create_local_media_library_for_videopress_guid( 'invalid!guid' );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'bad-guid-format', $result->get_error_code() );
	}

	/**
	 * Test create_local_media_library_for_videopress_guid without Jetpack connection returns WP_Error.
	 */
	public function test_create_local_media_library_without_connection() {
		$guid = 'abc12345';
		$this->clear_video_cache( $guid );

		// Clear the connection to simulate an unconnected site.
		Jetpack_Options::delete_option( 'id' );

		$this->mock_video_data = $this->get_mock_video_data();

		add_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10, 3 );
		$result = create_local_media_library_for_videopress_guid( $guid );
		remove_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10 );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'not_connected', $result->get_error_code() );
	}

	/**
	 * Test create_local_media_library_for_videopress_guid with video from different blog returns WP_Error.
	 */
	public function test_create_local_media_library_with_wrong_blog() {
		$guid = 'abc12345';
		$this->clear_video_cache( $guid );

		// Set a different blog_id than the one configured in set_up() (12345).
		$this->mock_video_data = $this->get_mock_video_data( array( 'blog_id' => 99999 ) );

		add_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10, 3 );
		$result = create_local_media_library_for_videopress_guid( $guid );
		remove_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10 );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'wrong_blog', $result->get_error_code() );
	}

	/**
	 * Test create_local_media_library_for_videopress_guid with parent_id sets post_parent.
	 */
	public function test_create_local_media_library_with_parent_id() {
		$guid = 'abc12345';
		$this->clear_video_cache( $guid );
		$this->mock_video_data = $this->get_mock_video_data();

		// Create a parent post.
		$parent_id = wp_insert_post(
			array(
				'post_type'   => 'post',
				'post_title'  => 'Parent Post',
				'post_status' => 'publish',
			)
		);

		add_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10, 3 );
		$attachment_id = create_local_media_library_for_videopress_guid( $guid, $parent_id );
		remove_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10 );

		$post = get_post( $attachment_id );

		$this->assertSame( $parent_id, $post->post_parent );
	}

	/**
	 * Filter callback to mock the unauthenticated VideoPress API response.
	 * Only intercepts requests to the public API endpoint (v1.1).
	 *
	 * @param false|array|\WP_Error $preempt A preemptive return value.
	 * @param array                 $args    Request arguments.
	 * @param string                $url     The request URL.
	 * @return array|false Mock response or false to proceed with the request.
	 */
	public function filter_mock_unauthenticated_api( $preempt, $args, $url ) {
		// Only intercept the public API (v1.1) endpoint, not the authenticated one.
		if ( strpos( $url, 'rest/v1.1/videos/' ) === false ) {
			return $preempt;
		}

		if ( null === $this->mock_video_data ) {
			return $preempt;
		}

		return array(
			'response' => array( 'code' => 200 ),
			'body'     => wp_json_encode( $this->mock_video_data, JSON_HEX_TAG | JSON_HEX_AMP ),
		);
	}

	/**
	 * Test videopress_get_video_details falls back to unauthenticated API for unconnected sites.
	 */
	public function test_get_video_details_fallback_for_unconnected_sites() {
		$guid = 'abc12345';
		$this->clear_video_cache( $guid );

		// Clear the connection to simulate an unconnected site.
		Jetpack_Options::delete_option( 'blog_token' );
		Jetpack_Options::delete_option( 'id' );

		$this->mock_video_data = $this->get_mock_video_data();

		add_filter( 'pre_http_request', array( $this, 'filter_mock_unauthenticated_api' ), 10, 3 );
		$result = videopress_get_video_details( $guid );
		remove_filter( 'pre_http_request', array( $this, 'filter_mock_unauthenticated_api' ), 10 );

		// Verify the fallback returned valid data.
		$this->assertNotInstanceOf( WP_Error::class, $result );
		$this->assertSame( $guid, $result->guid );
		$this->assertSame( 'Test Video Title', $result->title );
	}
}
