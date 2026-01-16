<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Tests for the CLI class.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

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
	 * Set up mock video data in the transient cache.
	 *
	 * @param string $guid      The video GUID.
	 * @param object $mock_data The mock video data.
	 */
	public function set_mock_video_transient( $guid, $mock_data ) {
		$cache_key = 'jetpack_videopress_' . $guid;
		set_transient( $cache_key, $mock_data, HOUR_IN_SECONDS );
	}

	/**
	 * Delete mock video data from the transient cache.
	 *
	 * @param string $guid The video GUID.
	 */
	public function delete_mock_video_transient( $guid ) {
		$cache_key = 'jetpack_videopress_' . $guid;
		delete_transient( $cache_key );
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
		$guid      = 'abc12345';
		$mock_data = $this->get_mock_video_data();

		$this->set_mock_video_transient( $guid, $mock_data );

		$cli = new CLI();
		$cli->import( array( $guid ), array() );

		$this->delete_mock_video_transient( $guid );

		// Verify the attachment was created.
		$post_id = videopress_get_post_id_by_guid( $guid );
		$this->assertGreaterThan( 0, $post_id );
	}

	/**
	 * Test import command returns early when video already exists without --force.
	 */
	public function test_import_returns_early_when_video_exists() {
		$guid      = 'abc12345';
		$mock_data = $this->get_mock_video_data();

		$this->set_mock_video_transient( $guid, $mock_data );

		// First import.
		$cli = new CLI();
		$cli->import( array( $guid ), array() );

		$first_post_id = videopress_get_post_id_by_guid( $guid );

		// Second import without --force - should return early.
		$cli->import( array( $guid ), array() );

		$this->delete_mock_video_transient( $guid );

		// Verify the same attachment still exists (wasn't deleted/recreated).
		$second_post_id = videopress_get_post_id_by_guid( $guid );
		$this->assertSame( $first_post_id, $second_post_id );
	}

	/**
	 * Test import command with --force flag deletes and recreates attachment.
	 */
	public function test_import_with_force_recreates_attachment() {
		$guid      = 'abc12345';
		$mock_data = $this->get_mock_video_data();

		$this->set_mock_video_transient( $guid, $mock_data );

		// First import.
		$cli = new CLI();
		$cli->import( array( $guid ), array() );

		$first_post_id = videopress_get_post_id_by_guid( $guid );

		// Second import with --force.
		$cli->import( array( $guid ), array( 'force' => true ) );

		$this->delete_mock_video_transient( $guid );

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
