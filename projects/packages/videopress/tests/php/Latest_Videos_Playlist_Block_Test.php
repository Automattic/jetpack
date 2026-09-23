<?php
/**
 * Tests for the Latest Videos Playlist block registration and render callback.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\VideoPress\Data;
use Automattic\Jetpack\VideoPress\Initializer as VideoPress_Initializer;
use Automattic\Jetpack\VideoPress\WPCOM_REST_API_V2_Attachment_VideoPress_Data;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use WorDBless\BaseTestCase;

/**
 * Test suite for Initializer::register_videopress_latest_videos_playlist_block,
 * Initializer::render_videopress_latest_videos_playlist_block and
 * Data::get_latest_videopress_playlist_entries.
 *
 * Runs in separate processes for the same reason as Playlist_Block_Test:
 * rendering loads Jwt_Token_Bridge, which other suites alias-mock.
 *
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class Latest_Videos_Playlist_Block_Test extends BaseTestCase {

	/**
	 * Directories holding the block.json fixtures written for registration tests.
	 *
	 * @var string[]
	 */
	private $fixture_dirs = array();

	/**
	 * Attachments standing in for the media library, see stub_media_query().
	 *
	 * @var \WP_Post[]
	 */
	private $attachments = array();

	/**
	 * The attachment WP_Query the media endpoint last ran.
	 *
	 * @var \WP_Query|null
	 */
	private $captured_query = null;

	/**
	 * Give render calls a block context, as do_blocks() would, and stand in
	 * for the posts table.
	 */
	protected function set_up() {
		\WP_Block_Supports::$block_to_render = array(
			'blockName' => 'videopress/latest-videos-playlist',
			'attrs'     => array(),
		);

		add_filter( 'posts_pre_query', array( $this, 'stub_media_query' ), 10, 2 );

		// The package's REST query filter, which Initializer::init() would hook up. Its
		// response field needs the Jetpack plugin's wp_startswith(), so leave that out.
		$rest_data = new WPCOM_REST_API_V2_Attachment_VideoPress_Data();
		remove_action( 'rest_api_init', array( $rest_data, 'register_fields' ) );
		remove_action( 'restapi_theme_init', array( $rest_data, 'register_fields' ), 20 );
		$rest_data->add_jetpack_videopress_custom_query_filters();
	}

	/**
	 * Clean up any block registration and fixture the test created.
	 */
	protected function tear_down() {
		\WP_Block_Supports::$block_to_render = null;
		remove_filter( 'posts_pre_query', array( $this, 'stub_media_query' ) );
		$this->attachments    = array();
		$this->captured_query = null;

		$registry = \WP_Block_Type_Registry::get_instance();
		foreach ( array( 'videopress/latest-videos-playlist', 'videopress/playlist' ) as $name ) {
			if ( $registry->is_registered( $name ) ) {
				unregister_block_type( $name );
			}
		}

		foreach ( $this->fixture_dirs as $dir ) {
			wp_delete_file( $dir . '/block.json' );
			rmdir( $dir ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir
		}
		$this->fixture_dirs = array();
	}

	/**
	 * Answer attachment queries from the attachments created by the test.
	 *
	 * WorDBless keeps posts in the object cache only, so WP_Query finds
	 * nothing on its own. This applies the mime filter, ordering and limit the
	 * media endpoint asks for.
	 *
	 * @param array|null $posts Return value to short-circuit with.
	 * @param \WP_Query  $query The query.
	 *
	 * @return array|null
	 */
	public function stub_media_query( $posts, $query ) {
		if ( 'attachment' !== $query->get( 'post_type' ) ) {
			return $posts;
		}

		$this->captured_query = $query;

		// A string before WordPress 6.9, a list from then on.
		$mimes = array_filter( (array) $query->get( 'post_mime_type' ) );
		$found = array_values(
			array_filter(
				$this->attachments,
				function ( $post ) use ( $mimes ) {
					return ! $mimes || in_array( $post->post_mime_type, $mimes, true );
				}
			)
		);
		usort(
			$found,
			function ( $a, $b ) {
				return strcmp( $b->post_date, $a->post_date );
			}
		);

		$limit = (int) $query->get( 'posts_per_page' );

		return $limit > 0 ? array_slice( $found, 0, $limit ) : $found;
	}

	/**
	 * Write a minimal block.json fixture for the given block name.
	 *
	 * @param string $name Block name.
	 *
	 * @return string Path to the fixture.
	 */
	private function write_fixture( $name ) {
		// register_block_type() only accepts metadata files named block.json.
		$dir = get_temp_dir() . 'latest-videos-playlist-block-' . wp_generate_password( 8, false );
		mkdir( $dir ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_mkdir
		file_put_contents( // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
			$dir . '/block.json',
			wp_json_encode(
				array(
					'apiVersion' => 3,
					'name'       => $name,
					'title'      => $name,
				),
				JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
			)
		);
		$this->fixture_dirs[] = $dir;

		return $dir . '/block.json';
	}

	/**
	 * Create an attachment the stubbed media query will list.
	 *
	 * @param string      $mime     Mime type.
	 * @param string      $date     Post date.
	 * @param string|null $guid     VideoPress GUID meta, null for none.
	 * @param int         $duration Duration in milliseconds.
	 * @param int         $height   Height in pixels.
	 *
	 * @return int Attachment ID.
	 */
	private function create_attachment( $mime, $date, $guid = null, $duration = 0, $height = 0 ) {
		$attachment_id = wp_insert_attachment(
			array(
				'post_title'     => 'Video ' . $guid,
				'post_mime_type' => $mime,
				'post_status'    => 'inherit',
				'post_date'      => $date,
				'post_date_gmt'  => $date,
			)
		);
		if ( null !== $guid ) {
			update_post_meta( $attachment_id, 'videopress_guid', $guid );
		}
		if ( $duration || $height ) {
			wp_update_attachment_metadata(
				$attachment_id,
				array(
					'width'      => (int) round( $height * 16 / 9 ),
					'height'     => $height,
					'videopress' => array(
						'guid'     => $guid,
						'duration' => $duration,
						'height'   => $height,
					),
				)
			);
		}
		$this->attachments[] = get_post( $attachment_id );

		return $attachment_id;
	}

	/**
	 * Create a VideoPress attachment.
	 *
	 * @param string $guid     Video GUID.
	 * @param string $date     Post date.
	 * @param int    $duration Duration in milliseconds.
	 * @param int    $height   Height in pixels.
	 *
	 * @return int Attachment ID.
	 */
	private function create_video( $guid, $date, $duration = 0, $height = 0 ) {
		return $this->create_attachment( 'video/videopress', $date, $guid, $duration, $height );
	}

	/**
	 * The newest VideoPress videos come back first, capped at the count, with
	 * only the numeric metadata; other attachments are ignored.
	 */
	public function test_latest_entries_are_newest_first_and_capped() {
		$this->create_video( 'oldest01', '2024-01-01 10:00:00', 60000, 720 );
		$this->create_video( 'middle02', '2024-02-01 10:00:00', 120000, 1080 );
		$this->create_video( 'newest03', '2024-03-01 10:00:00', 180000, 2160 );
		$this->create_attachment( 'video/mp4', '2024-04-01 10:00:00' );

		$this->assertSame(
			array(
				array(
					'guid'       => 'newest03',
					'durationMs' => 180000,
					'height'     => 2160,
				),
				array(
					'guid'       => 'middle02',
					'durationMs' => 120000,
					'height'     => 1080,
				),
			),
			Data::get_latest_videopress_playlist_entries( 2 )
		);

		// The media endpoint was asked for VideoPress videos, newest first.
		$this->assertSame( array( 'video/videopress' ), (array) $this->captured_query->get( 'post_mime_type' ) );
		$this->assertSame( 'date', $this->captured_query->get( 'orderby' ) );
		$this->assertSame( 'DESC', $this->captured_query->get( 'order' ) );
		$this->assertSame( 2, $this->captured_query->get( 'posts_per_page' ) );

		$this->assertCount( 3, Data::get_latest_videopress_playlist_entries( 10 ) );
	}

	/**
	 * Attachments flagged as VideoPress without a usable GUID are skipped, and
	 * missing metadata leaves the numeric fields at zero.
	 */
	public function test_latest_entries_skip_attachments_without_a_guid() {
		$this->create_video( 'goodguid', '2024-01-01 10:00:00' );
		$this->create_attachment( 'video/videopress', '2024-02-01 10:00:00', 'not a guid' );
		$this->create_attachment( 'video/videopress', '2024-03-01 10:00:00' );

		$this->assertSame(
			array(
				array(
					'guid'       => 'goodguid',
					'durationMs' => 0,
					'height'     => 0,
				),
			),
			Data::get_latest_videopress_playlist_entries( 5 )
		);
	}

	/**
	 * Rendering delegates to the playlist renderer with the newest videos.
	 */
	public function test_render_outputs_the_latest_videos_as_a_playlist() {
		$this->create_video( 'oldest01', '2024-01-01 10:00:00', 60000, 720 );
		$this->create_video( 'newest02', '2024-02-01 10:00:00', 120000, 1080 );

		// Registered, so the wrapper carries the block class the view script looks for.
		VideoPress_Initializer::register_videopress_playlist_block( $this->write_fixture( 'videopress/playlist' ) );
		VideoPress_Initializer::register_videopress_latest_videos_playlist_block( $this->write_fixture( 'videopress/latest-videos-playlist' ) );

		$markup = VideoPress_Initializer::render_videopress_latest_videos_playlist_block(
			array(
				'count'  => 5,
				'layout' => 'grid',
			)
		);

		$this->assertStringContainsString( 'wp-block-videopress-latest-videos-playlist', $markup );
		$this->assertStringContainsString( 'videopress-playlist is-layout-grid', $markup );
		$this->assertStringContainsString( 'data-guid="newest02"', $markup );
		$this->assertStringContainsString( 'data-guid="oldest01"', $markup );
		$this->assertStringContainsString( '2 videos', $markup );
		$this->assertStringContainsString( '1080p', $markup );
		$this->assertStringContainsString( '3 min', $markup );

		// The newest video is the one loaded in the player.
		$this->assertLessThan(
			strpos( $markup, 'data-guid="oldest01"' ),
			strpos( $markup, 'data-guid="newest02"' )
		);
	}

	/**
	 * The count attribute caps the entries and is clamped to the supported range.
	 */
	public function test_render_honors_and_clamps_the_count() {
		foreach ( range( 1, 3 ) as $i ) {
			$this->create_video( 'video00' . $i, '2024-0' . $i . '-01 10:00:00' );
		}

		$one = VideoPress_Initializer::render_videopress_latest_videos_playlist_block( array( 'count' => 1 ) );
		$this->assertSame( 1, substr_count( $one, 'data-guid=' ) );
		$this->assertStringContainsString( 'data-guid="video003"', $one );

		$clamped = VideoPress_Initializer::render_videopress_latest_videos_playlist_block( array( 'count' => 0 ) );
		$this->assertSame( 1, substr_count( $clamped, 'data-guid=' ) );

		$default = VideoPress_Initializer::render_videopress_latest_videos_playlist_block( array( 'count' => 'lots' ) );
		$this->assertSame( 3, substr_count( $default, 'data-guid=' ) );
		$this->assertSame(
			VideoPress_Initializer::LATEST_VIDEOS_PLAYLIST_DEFAULT_COUNT,
			$this->captured_query->get( 'posts_per_page' )
		);

		VideoPress_Initializer::render_videopress_latest_videos_playlist_block( array( 'count' => 999 ) );
		$this->assertSame(
			VideoPress_Initializer::LATEST_VIDEOS_PLAYLIST_MAX_COUNT,
			$this->captured_query->get( 'posts_per_page' )
		);
	}

	/**
	 * Any stored videos attribute is ignored: the entries always come from the library.
	 */
	public function test_render_ignores_a_stored_videos_attribute() {
		$this->create_video( 'library1', '2024-01-01 10:00:00' );

		$markup = VideoPress_Initializer::render_videopress_latest_videos_playlist_block(
			array(
				'videos' => array( array( 'guid' => 'injected' ) ),
			)
		);

		$this->assertStringContainsString( 'data-guid="library1"', $markup );
		$this->assertStringNotContainsString( 'injected', $markup );
	}

	/**
	 * Without VideoPress videos the block renders nothing.
	 */
	public function test_render_returns_empty_without_videos() {
		$this->create_attachment( 'video/mp4', '2024-04-01 10:00:00' );

		$this->assertSame( '', VideoPress_Initializer::render_videopress_latest_videos_playlist_block( array() ) );
	}

	/**
	 * Registration reads the metadata file and registers the block once, after the playlist block.
	 */
	public function test_register_videopress_latest_videos_playlist_block() {
		$registry = \WP_Block_Type_Registry::get_instance();
		$fixture  = $this->write_fixture( 'videopress/latest-videos-playlist' );

		// It borrows the playlist block's assets, so it waits for that block.
		VideoPress_Initializer::register_videopress_latest_videos_playlist_block( $fixture );
		$this->assertFalse( $registry->is_registered( 'videopress/latest-videos-playlist' ) );

		VideoPress_Initializer::register_videopress_playlist_block( $this->write_fixture( 'videopress/playlist' ) );
		VideoPress_Initializer::register_videopress_latest_videos_playlist_block( $fixture );
		$this->assertTrue( $registry->is_registered( 'videopress/latest-videos-playlist' ) );

		$block_type = $registry->get_registered( 'videopress/latest-videos-playlist' );
		$this->assertSame(
			array( VideoPress_Initializer::class, 'render_videopress_latest_videos_playlist_block' ),
			$block_type->render_callback
		);

		// A second call must not fatal on the already-registered block.
		VideoPress_Initializer::register_videopress_latest_videos_playlist_block( $fixture );
		$this->assertTrue( $registry->is_registered( 'videopress/latest-videos-playlist' ) );
	}

	/**
	 * Registration bails quietly when the metadata file is missing.
	 */
	public function test_register_without_metadata_file_is_a_noop() {
		VideoPress_Initializer::register_videopress_playlist_block( $this->write_fixture( 'videopress/playlist' ) );
		VideoPress_Initializer::register_videopress_latest_videos_playlist_block( '/nonexistent/block.json' );

		$this->assertFalse(
			\WP_Block_Type_Registry::get_instance()->is_registered( 'videopress/latest-videos-playlist' )
		);
	}

	/**
	 * Without an argument, registration reads the package build output, whose
	 * metadata reuses the playlist block's registered assets by handle.
	 */
	public function test_register_defaults_to_build_metadata() {
		VideoPress_Initializer::register_videopress_playlist_block();
		VideoPress_Initializer::register_videopress_latest_videos_playlist_block();

		$initializer_dir = dirname( ( new \ReflectionClass( VideoPress_Initializer::class ) )->getFileName() );
		$build_metadata  = $initializer_dir . '/../build/block-editor/blocks/latest-videos-playlist/block.json';

		$registry = \WP_Block_Type_Registry::get_instance();

		// Registered exactly when the package build output exists.
		$this->assertSame( file_exists( $build_metadata ), $registry->is_registered( 'videopress/latest-videos-playlist' ) );

		if ( ! file_exists( $build_metadata ) ) {
			return;
		}

		$block_type = $registry->get_registered( 'videopress/latest-videos-playlist' );
		$this->assertSame( array( 'videopress-playlist-view-script' ), $block_type->view_script_handles );
		$this->assertSame( array( 'videopress-playlist-view-style' ), $block_type->view_style_handles );
		$this->assertSame(
			$registry->get_registered( 'videopress/playlist' )->editor_style_handles,
			$block_type->editor_style_handles
		);
	}
}
