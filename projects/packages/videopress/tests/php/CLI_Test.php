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
		require_once __DIR__ . '/fixtures/wp-cli-mock.php';
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

		// Reset captured WP_CLI output between tests.
		\WP_CLI::reset_capture();
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
			'post_id'         => 0,     // Tests opting in to ID preservation set this explicitly.
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
		videopress_clear_post_id_by_guid_cache( $guid );
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
	 * Test batch_import processes a list of GUIDs and reports a summary.
	 */
	public function test_batch_import_from_file() {
		$guid_a = 'aaaaaaaa';
		$guid_b = 'bbbbbbbb';
		$this->clear_video_cache( $guid_a );
		$this->clear_video_cache( $guid_b );

		$file = tempnam( sys_get_temp_dir(), 'guids' );
		file_put_contents( $file, "$guid_a\n# comment\n\n$guid_b\n" );

		$this->mock_video_data = $this->get_mock_video_data();
		$mock                  = function ( $preempt, $args, $url ) {
			if ( strpos( $url, 'videos/' ) === false ) {
				return $preempt;
			}
			$guid = preg_match( '#videos/([a-z0-9]+)#i', $url, $m ) ? $m[1] : 'aaaaaaaa';
			return array(
				'response' => array( 'code' => 200 ),
				'body'     => wp_json_encode( $this->get_mock_video_data( array( 'guid' => $guid ) ), JSON_HEX_TAG | JSON_HEX_AMP ),
			);
		};

		add_filter( 'pre_http_request', $mock, 10, 3 );
		( new CLI() )->batch_import( array( $file ), array() );
		remove_filter( 'pre_http_request', $mock, 10 );
		unlink( $file );

		$summary = implode( "\n", \WP_CLI::$captured['log'] );
		$this->assertStringContainsString( '2 total', $summary );
		$this->assertStringContainsString( '2 imported', $summary );
		$this->assertStringContainsString( '0 failed', $summary );
	}

	/**
	 * Test batch_import surfaces invalid GUIDs as failures and exits non-zero.
	 */
	public function test_batch_import_marks_invalid_guids_as_failed() {
		$file = tempnam( sys_get_temp_dir(), 'guids' );
		file_put_contents( $file, "not a guid\n" );

		$exception_thrown = false;
		try {
			( new CLI() )->batch_import( array( $file ), array() );
		} catch ( \WP_CLI\ExitException $e ) {
			$exception_thrown = true;
		}
		unlink( $file );

		$this->assertTrue( $exception_thrown, 'Batch with failures should exit via WP_CLI::error.' );
		$summary = implode( "\n", \WP_CLI::$captured['log'] );
		$this->assertStringContainsString( '1 failed', $summary );
	}

	/**
	 * Test batch_import writes an audit log when --audit-log is provided.
	 */
	public function test_batch_import_writes_audit_log() {
		$guid = 'aaaaaaaa';
		$this->clear_video_cache( $guid );

		$guids_file = tempnam( sys_get_temp_dir(), 'guids' );
		$audit_path = tempnam( sys_get_temp_dir(), 'audit' );
		file_put_contents( $guids_file, "$guid\n" );

		$this->mock_video_data = $this->get_mock_video_data();
		add_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10, 3 );
		( new CLI() )->batch_import(
			array( $guids_file ),
			array( 'audit-log' => $audit_path )
		);
		remove_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10 );
		unlink( $guids_file );

		$this->assertFileExists( $audit_path );
		$payload = json_decode( file_get_contents( $audit_path ), true );
		unlink( $audit_path );

		$this->assertSame( 1, $payload['run']['total'] );
		$this->assertFalse( $payload['run']['dry_run'] );
		$this->assertArrayHasKey( $guid, $payload['imported'] );
		$this->assertSame( array(), $payload['failed'] );
	}

	/**
	 * Test batch_import --dry-run does not mutate state.
	 */
	public function test_batch_import_dry_run_skips_writes() {
		$guid = 'aaaaaaaa';
		$this->clear_video_cache( $guid );

		$file = tempnam( sys_get_temp_dir(), 'guids' );
		file_put_contents( $file, "$guid\n" );

		$this->mock_video_data = $this->get_mock_video_data( array( 'post_id' => 90220 ) );

		$captured_data = null;
		$capture       = function ( $data ) use ( &$captured_data ) {
			$captured_data = $data;
			return $data;
		};

		add_filter( 'wp_insert_attachment_data', $capture, 5 );
		add_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10, 3 );
		( new CLI() )->batch_import( array( $file ), array( 'dry-run' => true ) );
		remove_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10 );
		remove_filter( 'wp_insert_attachment_data', $capture, 5 );
		unlink( $file );

		$this->assertNull( $captured_data, 'Dry run should not invoke wp_insert_attachment.' );
	}

	/**
	 * Test --dry-run reports the would-preserve ID without mutating state.
	 */
	public function test_import_dry_run_reports_preserved_id() {
		$guid = 'abc12345';
		$this->clear_video_cache( $guid );
		$this->mock_video_data = $this->get_mock_video_data( array( 'post_id' => 90217 ) );

		$captured_data = null;
		$capture       = function ( $data ) use ( &$captured_data ) {
			$captured_data = $data;
			return $data;
		};

		add_filter( 'wp_insert_attachment_data', $capture, 5 );
		add_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10, 3 );
		( new CLI() )->import( array( $guid ), array( 'dry-run' => true ) );
		remove_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10 );
		remove_filter( 'wp_insert_attachment_data', $capture, 5 );

		$this->assertNull( $captured_data, 'Dry run should not invoke wp_insert_attachment.' );

		$logs = implode( "\n", \WP_CLI::$captured['log'] );
		$this->assertStringContainsString( '90217', $logs );
		$this->assertStringContainsString( '[dry-run]', $logs );
	}

	/**
	 * Test --dry-run reports a collision without raising it as a failure-causing error.
	 */
	public function test_import_dry_run_reports_collision_as_error() {
		$guid             = 'abc12345';
		$original_post_id = 90218;
		$this->clear_video_cache( $guid );

		// Squat on the original ID with an unrelated post.
		Posts::init()->posts[ $original_post_id ] = (object) array(
			'ID'             => $original_post_id,
			'post_type'      => 'page',
			'post_status'    => 'publish',
			'post_title'     => 'Squatter',
			'post_mime_type' => '',
		);
		wp_cache_add( $original_post_id, Posts::init()->posts[ $original_post_id ], 'posts' );

		$this->mock_video_data = $this->get_mock_video_data( array( 'post_id' => $original_post_id ) );

		add_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10, 3 );
		$exception_thrown = false;
		try {
			( new CLI() )->import( array( $guid ), array( 'dry-run' => true ) );
		} catch ( \WP_CLI\ExitException $e ) {
			$exception_thrown = true;
			$this->assertStringContainsString( '[dry-run]', $e->getMessage() );
			$this->assertStringContainsString( (string) $original_post_id, $e->getMessage() );
		}
		remove_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10 );

		$this->assertTrue( $exception_thrown, 'Dry-run should surface the collision via WP_CLI::error.' );
	}

	/**
	 * Test import command propagates --no-preserve-id to the helper.
	 */
	public function test_import_no_preserve_id_skips_import_id() {
		$guid = 'abc12345';
		$this->clear_video_cache( $guid );
		$this->mock_video_data = $this->get_mock_video_data( array( 'post_id' => 90215 ) );

		$captured_postarr = null;
		$capture          = function ( $data, $postarr ) use ( &$captured_postarr ) {
			$captured_postarr = $postarr;
			return $data;
		};

		add_filter( 'wp_insert_attachment_data', $capture, 5, 2 );
		add_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10, 3 );
		( new CLI() )->import( array( $guid ), array( 'preserve-id' => false ) );
		remove_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10 );
		remove_filter( 'wp_insert_attachment_data', $capture, 5 );

		$this->assertIsArray( $captured_postarr );
		$this->assertEmpty( $captured_postarr['import_id'] ?? null );
	}

	/**
	 * Test import command propagates --parent-id to the helper.
	 */
	public function test_import_parent_id_flag() {
		$guid = 'abc12345';
		$this->clear_video_cache( $guid );
		$this->mock_video_data = $this->get_mock_video_data();

		$captured_data = null;
		$capture       = function ( $data ) use ( &$captured_data ) {
			$captured_data = $data;
			return $data;
		};

		add_filter( 'wp_insert_attachment_data', $capture, 5 );
		add_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10, 3 );
		( new CLI() )->import( array( $guid ), array( 'parent-id' => 4242 ) );
		remove_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10 );
		remove_filter( 'wp_insert_attachment_data', $capture, 5 );

		$this->assertSame( 4242, (int) ( $captured_data['post_parent'] ?? 0 ) );
	}

	/**
	 * Test import command preserves the original ID by default.
	 */
	public function test_import_preserves_id_by_default() {
		$guid = 'abc12345';
		$this->clear_video_cache( $guid );
		$this->mock_video_data = $this->get_mock_video_data( array( 'post_id' => 90216 ) );

		$captured_postarr = null;
		$capture          = function ( $data, $postarr ) use ( &$captured_postarr ) {
			$captured_postarr = $postarr;
			return $data;
		};

		add_filter( 'wp_insert_attachment_data', $capture, 5, 2 );
		add_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10, 3 );
		( new CLI() )->import( array( $guid ), array() );
		remove_filter( 'pre_http_request', array( $this, 'filter_mock_videopress_api' ), 10 );
		remove_filter( 'wp_insert_attachment_data', $capture, 5 );

		$this->assertSame( 90216, $captured_postarr['import_id'] ?? null );
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
		set_transient( videopress_get_post_id_by_guid_cache_key( $guid ), $existing_post_id, HOUR_IN_SECONDS );

		$cli = new CLI();

		// Should return early without error (just a warning).
		$exception_thrown = false;
		try {
			$cli->import( array( $guid ), array() );
		} catch ( \WP_CLI\ExitException $e ) {
			$exception_thrown = true;
		}

		$this->assertFalse( $exception_thrown, 'Import should return early with warning, not throw error' );

		// Confirm the warning was actually emitted, naming the existing attachment ID.
		$this->assertCount( 1, \WP_CLI::$captured['warning'] );
		$this->assertStringContainsString( (string) $existing_post_id, \WP_CLI::$captured['warning'][0] );
		$this->assertStringContainsString( '--force', \WP_CLI::$captured['warning'][0] );
		$this->assertSame( array(), \WP_CLI::$captured['success'] );

		// Cleanup.
		videopress_clear_post_id_by_guid_cache( $guid );
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
		set_transient( videopress_get_post_id_by_guid_cache_key( $guid ), $existing_post_id, HOUR_IN_SECONDS );

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
		set_transient( videopress_get_post_id_by_guid_cache_key( $guid ), $fake_post_id, HOUR_IN_SECONDS );

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
		videopress_clear_post_id_by_guid_cache( $guid );
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
