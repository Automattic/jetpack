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
	 * Set up once before all tests in this class.
	 */
	public static function set_up_before_class() {
		parent::set_up_before_class();

		// Load mock plugin to make Status::is_standalone_plugin_active() return true.
		require_once __DIR__ . '/assets/videopress-mock-plugin.txt';

		// Initialize VideoPress components once for all tests.
		Attachment_Handler::init();
		new WPCOM_REST_API_V2_Attachment_VideoPress_Data();
		do_action( 'rest_api_init' );
	}

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();

		$this->captured_query = null;

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
}
