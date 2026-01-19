<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Tests for the CLI class.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Constants;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\BeforeClass;
use PHPUnit\Framework\Attributes\Group;
use WorDBless\BaseTestCase;
use WorDBless\Posts;

/**
 * Tests for the CLI class.
 *
 * @group cli
 */
#[Group( 'cli' )]
class CLI_Test extends BaseTestCase {

	/**
	 * Sets up the test environment before the class tests begin.
	 *
	 * @beforeClass
	 */
	#[BeforeClass]
	public static function set_up_class() {
		if ( ! class_exists( 'WP_CLI' ) ) {
			require_once __DIR__ . '/fixtures/wp-cli-mock.php';
		}
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
	 * Returns mock video data for testing.
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
		delete_transient( 'videopress_get_post_id_by_guid_' . $guid );
	}

	/**
	 * Test import command with missing GUID argument.
	 */
	public function test_import_without_guid_shows_error() {
		$cli = new CLI();

		$exception_thrown = false;
		try {
			$cli->import( array(), array() );
		} catch ( \WP_CLI\ExitException $e ) {
			$exception_thrown = true;
		}

		$this->assertTrue( $exception_thrown, 'Expected WP_CLI::error to throw an exception' );
	}

	/**
	 * Test import command with empty GUID argument.
	 */
	public function test_import_with_empty_guid_shows_error() {
		$cli = new CLI();

		$exception_thrown = false;
		try {
			$cli->import( array( '' ), array() );
		} catch ( \WP_CLI\ExitException $e ) {
			$exception_thrown = true;
		}

		$this->assertTrue( $exception_thrown, 'Expected WP_CLI::error to throw an exception' );
	}

	/**
	 * Test import command with invalid GUID shows error.
	 */
	public function test_import_with_invalid_guid_shows_error() {
		$cli = new CLI();

		$exception_thrown = false;
		try {
			$cli->import( array( 'invalid!guid' ), array() );
		} catch ( \WP_CLI\ExitException $e ) {
			$exception_thrown = true;
		}

		$this->assertTrue( $exception_thrown, 'Expected WP_CLI::error to throw an exception' );
	}

	/**
	 * Test import command creates attachment successfully.
	 */
	public function test_import_creates_attachment() {
		$guid = 'abc12345';
		$this->clear_video_cache( $guid );
		$this->mock_video_data = $this->get_mock_video_data();

		add_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10, 3 );
		$cli = new CLI();

		$exception_message = null;
		try {
			$cli->import( array( $guid ), array() );
		} catch ( \WP_CLI\ExitException $e ) {
			$exception_message = $e->getMessage();
		}
		remove_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10 );

		$this->assertNull( $exception_message, 'Import should succeed but got error: ' . $exception_message );
	}

	/**
	 * Test import command returns early when video already exists without --force.
	 *
	 * Uses transient to simulate existing post lookup, bypassing WP_Query
	 * which doesn't work in WorDBless dbless mode.
	 */
	public function test_import_returns_early_when_video_exists() {
		$guid             = 'abc12345';
		$existing_post_id = 999;

		// Simulate an existing attachment by setting the transient.
		// videopress_get_post_id_by_guid() checks this transient first.
		set_transient( 'videopress_get_post_id_by_guid_' . $guid, $existing_post_id, HOUR_IN_SECONDS );

		$cli = new CLI();

		// Should return early without error (just a warning).
		$exception_thrown = false;
		try {
			$cli->import( array( $guid ), array() );
		} catch ( \WP_CLI\ExitException $e ) {
			$exception_thrown = true;
		}

		$this->assertFalse( $exception_thrown, 'Import should return early with warning, not throw error' );

		// Cleanup.
		delete_transient( 'videopress_get_post_id_by_guid_' . $guid );
	}

	/**
	 * Test import command with --force deletes existing attachment and recreates.
	 */
	public function test_import_with_force_deletes_existing() {
		$guid = 'abc12345';

		// Create a real attachment to delete.
		$existing_post_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_mime_type' => 'video/videopress',
				'post_title'     => 'Existing Video',
				'post_status'    => 'inherit',
			)
		);
		update_post_meta( $existing_post_id, 'videopress_guid', $guid );

		// Set transient so videopress_get_post_id_by_guid() finds it.
		set_transient( 'videopress_get_post_id_by_guid_' . $guid, $existing_post_id, HOUR_IN_SECONDS );

		$this->mock_video_data = $this->get_mock_video_data();
		add_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10, 3 );

		$cli = new CLI();

		$exception_message = null;
		try {
			$cli->import( array( $guid ), array( 'force' => true ) );
		} catch ( \WP_CLI\ExitException $e ) {
			$exception_message = $e->getMessage();
		}
		remove_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ) );

		// Should succeed (old post deleted, new one created).
		$this->assertNull( $exception_message, 'Import with --force should succeed but got error: ' . $exception_message );

		// Verify the old attachment was deleted.
		$this->assertNull( get_post( $existing_post_id ), 'Old attachment should have been deleted' );
	}

	/**
	 * Test import command with --force fails when deletion fails.
	 *
	 * This covers the error path when wp_delete_attachment() returns false.
	 */
	public function test_import_with_force_fails_when_delete_fails() {
		$guid = 'abc12345';

		// Set transient pointing to a non-existent post ID.
		// wp_delete_attachment() will return null/false for non-existent posts.
		$fake_post_id = 999999;
		set_transient( 'videopress_get_post_id_by_guid_' . $guid, $fake_post_id, HOUR_IN_SECONDS );

		$cli = new CLI();

		$exception_thrown = false;
		try {
			$cli->import( array( $guid ), array( 'force' => true ) );
		} catch ( \WP_CLI\ExitException $e ) {
			$exception_thrown = true;
			$this->assertStringContainsString( (string) $fake_post_id, $e->getMessage() );
		}

		$this->assertTrue( $exception_thrown, 'Expected error when deletion fails' );

		// Cleanup.
		delete_transient( 'videopress_get_post_id_by_guid_' . $guid );
	}

	/**
	 * Test import command shows error when API returns error.
	 */
	public function test_import_with_api_error_shows_error() {
		$guid = 'abc12345';
		$this->clear_video_cache( $guid );

		// Mock API to return an error response.
		$mock_api_error = static function ( $preempt, $args, $url ) {
			if ( strpos( $url, 'videos/' ) === false ) {
				return $preempt;
			}

			return array(
				'response' => array( 'code' => 404 ),
				'body'     => wp_json_encode( array( 'error' => 'Video not found' ), JSON_HEX_TAG | JSON_HEX_AMP ),
			);
		};

		add_filter( 'pre_http_request', $mock_api_error, 10, 3 );

		$cli = new CLI();

		$exception_thrown = false;
		try {
			$cli->import( array( $guid ), array() );
		} catch ( \WP_CLI\ExitException $e ) {
			$exception_thrown = true;
		}

		remove_filter( 'pre_http_request', $mock_api_error, 10 );

		$this->assertTrue( $exception_thrown, 'Expected error when API returns error' );
	}

	/**
	 * Test import command shows error when video belongs to different site.
	 */
	public function test_import_with_different_blog_id_shows_error() {
		$guid = 'abc12345';
		$this->clear_video_cache( $guid );

		// Mock video from a different blog_id.
		$this->mock_video_data = $this->get_mock_video_data( array( 'blog_id' => 99999 ) );

		add_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10, 3 );

		$cli = new CLI();

		$exception_thrown  = false;
		$exception_message = '';
		try {
			$cli->import( array( $guid ), array() );
		} catch ( \WP_CLI\ExitException $e ) {
			$exception_thrown  = true;
			$exception_message = $e->getMessage();
		}

		remove_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10 );

		$this->assertTrue( $exception_thrown, 'Expected error when video belongs to different site' );
		$this->assertStringContainsString( 'different site', $exception_message );
	}
}
