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
 * These tests require WP-CLI to be available.
 *
 * @group cli
 */
#[Group( 'cli' )]
class CLI_Test extends BaseTestCase {

	/**
	 * Whether WP-CLI is available.
	 *
	 * @var bool
	 */
	protected static $wp_cli_available = false;

	/**
	 * Sets up the test environment before the class tests begin.
	 *
	 * @beforeClass
	 */
	#[BeforeClass]
	public static function set_up_class() {
		require_once __DIR__ . '/../../src/utility-functions.php';

		// Check if WP_CLI is available.
		self::$wp_cli_available = class_exists( 'WP_CLI' ) && class_exists( 'WP_CLI_Command' );

		if ( self::$wp_cli_available ) {
			require_once __DIR__ . '/../../src/class-cli.php';
		}

		Posts::init();
	}

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();

		if ( ! self::$wp_cli_available ) {
			$this->markTestSkipped( 'WP-CLI is not available.' );
		}

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
	 * Test import command creates attachment successfully.
	 */
	public function test_import_creates_attachment() {
		$guid = 'abc12345';
		$this->clear_video_cache( $guid );
		$this->mock_video_data = $this->get_mock_video_data();

		add_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10, 3 );
		$cli = new CLI();
		$cli->import( array( $guid ), array() );
		remove_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10 );

		// Verify the attachment was created.
		$post_id = videopress_get_post_id_by_guid( $guid );
		$this->assertGreaterThan( 0, $post_id );
	}

	/**
	 * Test import command returns early when video already exists without --force.
	 */
	public function test_import_returns_early_when_video_exists() {
		$guid = 'abc12345';
		$this->clear_video_cache( $guid );
		$this->mock_video_data = $this->get_mock_video_data();

		add_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10, 3 );

		// First import.
		$cli = new CLI();
		$cli->import( array( $guid ), array() );

		$first_post_id = videopress_get_post_id_by_guid( $guid );

		// Second import without --force - should return early.
		$cli->import( array( $guid ), array() );

		remove_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10 );

		// Verify the same attachment still exists (wasn't deleted/recreated).
		$second_post_id = videopress_get_post_id_by_guid( $guid );
		$this->assertSame( $first_post_id, $second_post_id );
	}

	/**
	 * Test import command with --force flag deletes and recreates attachment.
	 */
	public function test_import_with_force_recreates_attachment() {
		$guid = 'abc12345';
		$this->clear_video_cache( $guid );
		$this->mock_video_data = $this->get_mock_video_data();

		add_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10, 3 );

		// First import.
		$cli = new CLI();
		$cli->import( array( $guid ), array() );

		$first_post_id = videopress_get_post_id_by_guid( $guid );

		// Second import with --force.
		$cli->import( array( $guid ), array( 'force' => true ) );

		remove_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10 );

		$second_post_id = videopress_get_post_id_by_guid( $guid );

		// Verify the old attachment was deleted and a new one was created.
		$this->assertNotEquals( $first_post_id, $second_post_id );
		$this->assertNull( get_post( $first_post_id ) );
		$this->assertNotNull( get_post( $second_post_id ) );
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
}
