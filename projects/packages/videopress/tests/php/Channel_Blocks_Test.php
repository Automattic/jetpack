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
	 * Make this request the video page of a video, optionally within a playlist.
	 *
	 * @param string $guid     The video.
	 * @param string $list_key The playlist, if any.
	 */
	private function view_video( $guid, $list_key = '' ) {
		set_query_var( Channel::QUERY_VAR, 1 );
		set_query_var( Channel::LIST_VAR, $list_key );
		$GLOBALS['post'] = get_post( $this->videos[ $guid ] ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
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
	 * The join date shows in the site's date format, and an unknown date leaves no empty block.
	 */
	public function test_channel_details_joined() {
		update_option( 'date_format', 'F j, Y' );
		$attributes = array( 'items' => array( 'joined' ) );

		add_filter( 'videopress_channel_joined', '__return_zero' );
		$this->assertSame( '', Channel_Blocks::render_channel_details( $attributes ) );

		add_filter( 'videopress_channel_joined', fn() => gmmktime( 12, 0, 0, 3, 5, 2024 ), 20 );
		$this->assertStringContainsString( '<span class="videopress-channel-details__item is-joined">Joined March 5, 2024</span>', Channel_Blocks::render_channel_details( $attributes ) );
		$this->assertStringContainsString( '<dt>Joined</dt><dd>March 5, 2024</dd>', Channel_Blocks::render_channel_details( $attributes + array( 'layout' => 'list' ) ) );
	}

	/**
	 * Each block registers from its block.json in the build, rendered by Channel_Blocks, only where
	 * the channel feature is enabled.
	 */
	public function test_register_registers_the_blocks_where_the_channel_is_enabled() {
		$build    = get_temp_dir() . uniqid( 'videopress-channel-blocks-' );
		$metadata = json_decode( (string) file_get_contents( __DIR__ . '/../../src/client/block-editor/blocks/channel-details/block.json' ), true );
		unset( $metadata['editorScript'] ); // The built script isn't there to register.
		mkdir( $build . '/channel-details', 0777, true );
		file_put_contents( $build . '/channel-details/block.json', wp_json_encode( $metadata, JSON_UNESCAPED_SLASHES ) );

		register_block_type( 'videopress/playlist', array() );
		remove_all_filters( 'videopress_channel_enabled' );
		Channel_Blocks::register( $build );
		$this->assertFalse( \WP_Block_Type_Registry::get_instance()->is_registered( 'videopress/channel-details' ) );

		add_filter( 'videopress_channel_enabled', '__return_true' );
		Channel_Blocks::register( $build );
		unlink( $build . '/channel-details/block.json' );
		rmdir( $build . '/channel-details' );
		rmdir( $build );

		$block = \WP_Block_Type_Registry::get_instance()->get_registered( 'videopress/channel-details' );
		$this->assertInstanceOf( \WP_Block_Type::class, $block );
		$this->assertSame( array( Channel_Blocks::class, 'render_channel_details' ), $block->render_callback );
	}

	/**
	 * On a video page within a playlist: episode number in the playlist, VideoPress
	 * title and description, full view count and the playlist chip.
	 */
	public function test_video_details() {
		$this->assertSame( '', Channel_Blocks::render_video_details( array() ) );

		$this->view_video( 'ccccccc3', 'dungeons' );
		$markup = Channel_Blocks::render_video_details( array() );

		$this->assertStringContainsString( '<span class="videopress-video-details__eyebrow">Episode 2 · Classic dungeons</span>', $markup );
		$this->assertStringContainsString( '<h1 class="videopress-video-details__title">Deadmines episode</h1>', $markup );
		$this->assertStringContainsString( '<div class="videopress-video-details__meta">1,500 views · ', $markup );
		$this->assertStringContainsString( '<p>About Deadmines.</p>', $markup );
		$this->assertStringContainsString(
			'<a class="videopress-video-details__chip" href="' . esc_url( Channel::playlist_url( 'dungeons' ) ) . '">Playlist: Classic dungeons</a>',
			$markup
		);

		// Outside the playlist, the episode number follows upload order.
		$this->view_video( 'aaaaaaa1' );
		$this->assertStringContainsString( '>Episode 1<', Channel_Blocks::render_video_details( array( 'showTitle' => false ) ) );

		// The newest upload, anywhere, with a linked title.
		set_query_var( Channel::QUERY_VAR, 0 );
		$latest = Channel_Blocks::render_video_details( array( 'source' => 'latest' ) );
		$this->assertStringContainsString( '<h2 class="videopress-video-details__title"><a href="' . esc_url( Channel::video_url( $this->videos['ccccccc3'] ) ) . '">Deadmines episode</a></h2>', $latest );
	}

	/**
	 * The queried playlist's cover, meta and actions; Play all opens the first video in the playlist.
	 */
	public function test_playlist_details() {
		$this->assertSame( '', Channel_Blocks::render_playlist_details( array() ) );

		set_query_var( Channel::PLAYLIST_QUERY_VAR, 1 );
		set_query_var( Channel::LIST_VAR, 'dungeons' );
		$markup = Channel_Blocks::render_playlist_details( array() );

		$this->assertStringContainsString( '<img class="videopress-playlist-details__poster" src="https://videos.files.wordpress.com/bbbbbbb2/poster.jpg"', $markup );
		$this->assertStringContainsString( '<span class="videopress-playlist-details__badge">2 videos</span>', $markup );
		$this->assertStringContainsString( '<h1 class="videopress-playlist-details__title">Classic dungeons</h1>', $markup );
		$this->assertStringContainsString( '<div class="videopress-playlist-details__meta">2 videos · Updated ', $markup );
		$this->assertStringContainsString( ' · 20 min</div>', $markup );
		$this->assertStringContainsString( 'videopress-playlist-details__play" href="' . esc_url( Channel::video_url( $this->videos['bbbbbbb2'], 'dungeons' ) ) . '"', $markup );
		$this->assertStringContainsString( 'data-share-url="' . esc_url( Channel::playlist_url( 'dungeons' ) ) . '"', $markup );

		$picked = Channel_Blocks::render_playlist_details(
			array(
				'source'    => 'index',
				'showCover' => false,
			)
		);
		$this->assertStringContainsString( '<h3 class="videopress-playlist-details__title"><a href=', $picked );
		$this->assertStringNotContainsString( '__cover', $picked );
	}

	/**
	 * Previous and next follow the playlist when the page plays from one, else upload order.
	 */
	public function test_episode_navigation() {
		$this->assertSame( '', Channel_Blocks::render_episode_navigation() );

		$this->view_video( 'ccccccc3', 'dungeons' );
		$markup = Channel_Blocks::render_episode_navigation();
		$this->assertStringContainsString( 'is-prev" href="' . esc_url( Channel::video_url( $this->videos['bbbbbbb2'], 'dungeons' ) ) . '"', $markup );
		$this->assertStringContainsString( '<span class="videopress-episode-navigation__title">Goldshire episode</span>', $markup );
		$this->assertStringNotContainsString( 'is-next', $markup );

		$this->view_video( 'aaaaaaa1' );
		$markup = Channel_Blocks::render_episode_navigation();
		$this->assertStringContainsString( 'is-next" href="' . esc_url( Channel::video_url( $this->videos['bbbbbbb2'] ) ) . '"', $markup );
		$this->assertStringNotContainsString( 'is-prev', $markup );
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
