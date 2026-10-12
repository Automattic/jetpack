<?php
/**
 * Tests for the VideoPress Channel blocks.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\VideoPress\Channel;
use Automattic\Jetpack\VideoPress\Channel_Blocks;
use Automattic\Jetpack\VideoPress\Channel_Data;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use WorDBless\BaseTestCase;

/**
 * Test suite for Channel_Blocks. Separate processes for the same reason as Channel_Test.
 *
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class Channel_Blocks_Test extends BaseTestCase {

	/**
	 * Attachment IDs by GUID, oldest first.
	 *
	 * @var array<string, int>
	 */
	private $videos = array();

	/**
	 * Three videos and one playlist holding the last two, on a channel site.
	 */
	protected function set_up() {
		require_once __DIR__ . '/../../src/utility-functions.php';
		add_filter( 'videopress_channel_enabled', '__return_true' );
		Channel::register();
		\WP_Block_Supports::$block_to_render = array(
			'blockName' => 'videopress/channel-details',
			'attrs'     => array(),
		);

		foreach ( array(
			'aaaaaaa1' => 'Northshire',
			'bbbbbbb2' => 'Goldshire',
			'ccccccc3' => 'Deadmines',
		) as $guid => $title ) {
			$id = wp_insert_post(
				array(
					'post_type'      => 'attachment',
					'post_status'    => 'inherit',
					'post_mime_type' => Channel::MIME_TYPE,
					'post_title'     => $title,
				)
			);
			update_post_meta( $id, 'videopress_guid', $guid );
			set_transient( 'videopress_get_post_id_by_guid_' . $guid, $id, HOUR_IN_SECONDS );
			set_transient(
				'jetpack_videopress_' . $guid,
				(object) array(
					'guid'        => $guid,
					'title'       => $title . ' episode',
					'description' => 'About ' . $title . '.',
					'poster'      => 'https://videos.files.wordpress.com/' . $guid . '/poster.jpg',
				),
				HOUR_IN_SECONDS
			);
			$this->videos[ $guid ] = $id;
		}

		$records = array();
		foreach ( array_reverse( $this->videos, true ) as $guid => $id ) {
			$records[] = array(
				'id'          => $id,
				'guid'        => $guid,
				'durationMs'  => 600000,
				'height'      => 1080,
				'publishedAt' => time() - $id,
			);
		}
		add_filter(
			'videopress_channel_videos',
			function () use ( $records ) {
				return $records;
			}
		);
		add_filter(
			'videopress_channel_video_views',
			function () {
				return array( $this->videos['ccccccc3'] => 1500 );
			}
		);

		$source = wp_insert_post(
			array(
				'post_title'  => 'Dungeons',
				'post_status' => 'publish',
			)
		);
		update_option(
			'videopress_playlist_index',
			array(
				'dungeons' => array(
					'title'       => 'Classic dungeons',
					'description' => 'Full clears.',
					'videos'      => array(
						array(
							'guid'       => 'bbbbbbb2',
							'durationMs' => 600000,
						),
						array(
							'guid'       => 'ccccccc3',
							'durationMs' => 600000,
						),
					),
					'post_id'     => $source,
				),
			)
		);
	}

	/**
	 * Reset globals.
	 */
	protected function tear_down() {
		\WP_Block_Supports::$block_to_render = null;
		unset( $GLOBALS['post'] );
		Channel_Data::reset();
	}

	/**
	 * The playlist source and the editor data are only wired up where the Video Playlist block is.
	 */
	public function test_register_requires_the_playlist_block() {
		Channel_Blocks::register();
		$this->assertFalse( has_action( 'enqueue_block_editor_assets', array( Channel_Blocks::class, 'enqueue_editor_data' ) ) );
		$this->assertFalse( has_filter( 'render_block_data', array( Channel::class, 'playlist_source_block' ) ) );

		register_block_type( 'videopress/playlist', array() );
		Channel_Blocks::register();
		$this->assertSame( 10, has_action( 'enqueue_block_editor_assets', array( Channel_Blocks::class, 'enqueue_editor_data' ) ) );
		$this->assertSame( 10, has_filter( 'render_block_data', array( Channel::class, 'playlist_source_block' ) ) );

		// Without an editor script there is nothing to attach the data to.
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'channel-author',
					'user_pass'  => 'password',
					'role'       => 'author',
				)
			)
		);
		Channel_Blocks::enqueue_editor_data();
		$this->assertStringNotContainsString( 'videopressChannelEditor', wp_json_encode( wp_scripts()->registered, JSON_UNESCAPED_SLASHES ) );
		unregister_block_type( 'videopress/playlist' );
	}

	/**
	 * A Video Playlist block showing a playlist from the site renders that playlist's videos on any
	 * theme, not only a channel theme.
	 */
	public function test_source_playlist_renders_without_a_channel_theme() {
		// Undo what set_up() hooked as a channel site.
		remove_all_filters( 'videopress_channel_enabled' );
		remove_filter( 'render_block_data', array( Channel::class, 'playlist_source_block' ) );
		$this->assertFalse( Channel::is_enabled() );
		register_block_type(
			'videopress/playlist',
			array(
				'render_callback' => function ( $attributes ) {
					return implode( ',', array_column( $attributes['videos'] ?? array(), 'guid' ) );
				},
			)
		);
		Channel_Blocks::register();

		$this->assertSame( 'bbbbbbb2,ccccccc3', do_blocks( '<!-- wp:videopress/playlist {"source":"index","sourcePlaylistId":"dungeons"} /-->' ) );
		$this->assertSame( 'bbbbbbb2,ccccccc3', do_blocks( '<!-- wp:videopress/playlist {"source":"index"} /-->' ) );
		$this->assertSame( 'aaaaaaa1', do_blocks( '<!-- wp:videopress/playlist {"videos":[{"guid":"aaaaaaa1"}]} /-->' ) );
		unregister_block_type( 'videopress/playlist' );
	}

	/**
	 * Inline and list layouts, skipping items whose value is unknown.
	 */
	public function test_channel_details() {
		add_filter( 'videopress_channel_handle', fn() => '@jtf' );
		add_filter( 'videopress_channel_subscriber_count', fn() => 48210 );

		$inline = Channel_Blocks::render_channel_details( array() );
		$this->assertStringContainsString( 'videopress-channel-details is-layout-inline"', $inline );
		$this->assertStringContainsString(
			'<span class="videopress-channel-details__item is-handle">@jtf</span><span class="videopress-channel-details__item is-subscribers">48K subscribers</span><span class="videopress-channel-details__item is-videos">3 videos</span><span class="videopress-channel-details__item is-playlists">1 playlist</span>',
			$inline
		);

		add_filter( 'videopress_channel_subscriber_count', '__return_null', 20 );
		$list = Channel_Blocks::render_channel_details(
			array(
				'items'  => array( 'subscribers', 'views', 'bogus' ),
				'layout' => 'list',
			)
		);
		$this->assertStringStartsWith( '<dl ', $list );
		$this->assertStringContainsString( '<div class="videopress-channel-details__item is-views"><dt>Total views</dt><dd>1.5K</dd></div>', $list );
		$this->assertStringNotContainsString( 'is-subscribers', $list );
		$this->assertStringNotContainsString( 'bogus', $list );
	}

	/**
	 * The editor gets the playlists ( key, title and videos ) for the pickers and the canvas
	 * previews, before the playlist block's script.
	 */
	public function test_editor_data_lists_the_playlists() {
		wp_register_script( 'videopress-playlist-editor-test', 'https://example.org/editor.js', array(), '1', true );
		register_block_type( 'videopress/playlist', array( 'editor_script_handles' => array( 'videopress-playlist-editor-test' ) ) );

		Channel_Blocks::enqueue_editor_data();
		$this->assertFalse( wp_scripts()->get_data( 'videopress-playlist-editor-test', 'before' ), 'Only for people who can edit posts.' );

		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'channel-editor',
					'user_pass'  => 'password',
					'role'       => 'editor',
				)
			)
		);
		Channel_Blocks::enqueue_editor_data();
		$this->assertContains(
			'window.videopressChannelEditor = {"playlists":[{"key":"dungeons","title":"Classic dungeons","videos":[{"guid":"bbbbbbb2","durationMs":600000,"height":0},{"guid":"ccccccc3","durationMs":600000,"height":0}]}]};',
			(array) wp_scripts()->get_data( 'videopress-playlist-editor-test', 'before' )
		);
	}
}
