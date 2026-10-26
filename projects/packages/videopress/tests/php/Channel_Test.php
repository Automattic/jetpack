<?php
/**
 * Tests for the VideoPress Channel feature.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\VideoPress\Channel;
use Automattic\Jetpack\VideoPress\Channel_Data;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use WorDBless\BaseTestCase;

/**
 * Test suite for Channel. Separate processes for the same reason as
 * Playlist_Block_Test. The dbless environment answers no WP_Query, so the
 * GUID lookup and the video details are served from their transients.
 *
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class Channel_Test extends BaseTestCase {

	/**
	 * Enable the feature and register it, as `init` would on a channel theme.
	 */
	protected function set_up() {
		require_once __DIR__ . '/../../src/utility-functions.php';
		add_filter( 'videopress_channel_enabled', '__return_true' );
		Channel::register();
	}

	/**
	 * Undo registration.
	 */
	protected function tear_down() {
		remove_filter( 'videopress_channel_enabled', '__return_true' );
		$_GET = array();
		unset( $GLOBALS['post'] );
		delete_option( 'videopress_playlist_index' );
		foreach ( array( Channel::QUERY_VAR, Channel::PLAYLIST_QUERY_VAR, Channel::LIST_VAR ) as $var ) {
			set_query_var( $var, '' );
		}
	}

	/**
	 * Index two playlists held by published posts, the second updated last.
	 *
	 * @return array{mc: int, road: int} Source post IDs.
	 */
	private function index_playlists() {
		$mc   = wp_insert_post(
			array(
				'post_title'        => 'Molten Core',
				'post_status'       => 'publish',
				'post_modified_gmt' => '2026-01-01 00:00:00',
			)
		);
		$road = wp_insert_post(
			array(
				'post_type'         => 'page',
				'post_title'        => 'Road',
				'post_status'       => 'publish',
				'post_modified_gmt' => '2026-02-01 00:00:00',
			)
		);
		update_option(
			'videopress_playlist_index',
			array(
				'mc'   => array(
					'title'       => 'Molten Core progression',
					'description' => 'Attunement to Ragnaros.',
					'videos'      => array(
						array(
							'guid'       => 'abcDEF12',
							'durationMs' => 1000,
						),
						array( 'guid' => 'ghiJKL34' ),
					),
					'post_id'     => $mc,
				),
				'road' => array(
					'title'       => 'The road to 60',
					'description' => '',
					'videos'      => array( array( 'guid' => 'ghiJKL34' ) ),
					'post_id'     => $road,
				),
			)
		);
		// wp_insert_post() stamps the modified date itself.
		foreach ( array(
			$mc   => '2026-01-01 00:00:00',
			$road => '2026-02-01 00:00:00',
		) as $id => $date ) {
			$post                    = get_post( $id );
			$post->post_modified_gmt = $date;
			wp_cache_replace( $id, $post, 'posts' );
		}
		return array(
			'mc'   => $mc,
			'road' => $road,
		);
	}

	/**
	 * Create a VideoPress attachment whose GUID lookup and VideoPress metadata
	 * are pre-cached, as they would be after one API round trip.
	 *
	 * @param string $guid  VideoPress GUID.
	 * @param string $title Title.
	 * @return int Attachment ID.
	 */
	private function video( $guid, $title = 'A video' ) {
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
				'guid'   => $guid,
				'title'  => $title . ' ( VideoPress )',
				'poster' => 'https://videos.files.wordpress.com/' . $guid . '/poster.jpg',
			),
			HOUR_IN_SECONDS
		);
		return $id;
	}

	/**
	 * The feature stays off without theme support or the filter.
	 */
	public function test_disabled_by_default() {
		remove_filter( 'videopress_channel_enabled', '__return_true' );
		$this->assertFalse( Channel::is_enabled() );
		add_filter( 'videopress_channel_enabled', '__return_true' );
		$this->assertTrue( Channel::is_enabled() );
	}

	/**
	 * Registration adds the query vars and the hooks; nothing is stored on the blog.
	 */
	public function test_register() {
		$this->assertContains( 'v', Channel::query_vars( array() ) );
		$this->assertNotFalse( has_action( 'parse_request', array( Channel::class, 'route_video_page' ) ) );
		$this->assertNotFalse( has_filter( 'render_block_data', array( Channel::class, 'queried_video_block' ) ) );
		$this->assertFalse( registered_meta_key_exists( 'post', 'videopress_duration', 'attachment' ) );
	}

	/**
	 * GUIDs and attachments map both ways, and only VideoPress attachments count.
	 */
	public function test_guid_and_url() {
		$id = $this->video( 'abcDEF12', 'Into the Deadmines' );

		$this->assertSame( 'abcDEF12', Channel::guid( $id ) );
		$this->assertSame( $id, Channel::attachment_id( 'abcDEF12' ) );
		$this->assertSame( 0, Channel::attachment_id( 'nope' ) );
		$this->assertSame( add_query_arg( 'v', 'abcDEF12', user_trailingslashit( home_url( '/videopress' ) ) ), Channel::video_url( $id ) );

		$text = wp_insert_post(
			array(
				'post_title'  => 'Text',
				'post_status' => 'publish',
			)
		);
		$this->assertSame( '', Channel::guid( $text ) );
		$this->assertSame( '', Channel::video_url( $text ) );
	}

	/**
	 * WordPress.com Simple keeps the uploaded file's attachment ( video/mp4 ) and
	 * maps GUIDs in the platform's videos table: a video/mp4 attachment with a
	 * GUID is a video, and a GUID resolves through video_get_info_by_guid().
	 */
	public function test_wpcom_videos_table_fallback() {
		$id                                    = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'post_mime_type' => 'video/mp4',
				'post_title'     => 'Uploaded on Simple',
			)
		);
		$GLOBALS['vp_channel_test_video_info'] = (object) array(
			'guid'    => 'wpcomGU1',
			'blog_id' => get_current_blog_id(),
			'post_id' => $id,
		);
		update_post_meta( $id, 'videopress_guid', 'wpcomGU1' );
		require_once __DIR__ . '/stubs/wpcom-video-lookups.php';

		$this->assertSame( 'wpcomGU1', Channel::guid( $id ) );
		$this->assertSame( $id, Channel::attachment_id( 'wpcomGU1' ) );
		$this->assertSame( add_query_arg( 'v', 'wpcomGU1', user_trailingslashit( home_url( '/videopress' ) ) ), Channel::video_url( $id ) );
		$GLOBALS['post'] = get_post( $id ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$block           = Channel::queried_video_block(
			array(
				'blockName' => 'videopress/video',
				'attrs'     => array( 'useQueriedVideo' => true ),
			)
		);
		$this->assertSame( 'wpcomGU1', $block['attrs']['guid'] );
		$this->assertSame( $id, $block['attrs']['id'] );
	}

	/**
	 * Attachment links and player-less playlist entries point to the video page.
	 */
	public function test_links() {
		$id = $this->video( 'abcDEF12' );

		$this->assertSame( add_query_arg( 'v', 'abcDEF12', user_trailingslashit( home_url( '/videopress' ) ) ), Channel::attachment_link( 'https://example.com/?attachment_id=' . $id, $id ) );
		$this->assertSame( 'https://x.test/keep', Channel::attachment_link( 'https://x.test/keep', 999999 ) );
		$this->assertSame( add_query_arg( 'v', 'abcDEF12', user_trailingslashit( home_url( '/videopress' ) ) ), Channel::playlist_entry_url( 'https://videopress.com/v/abcDEF12', 'abcDEF12' ) );
		$this->assertSame( 'https://videopress.com/v/zzzzzzzz', Channel::playlist_entry_url( 'https://videopress.com/v/zzzzzzzz', 'zzzzzzzz' ) );
	}

	/**
	 * `/videopress?v=<guid>` routes to the attachment; unknown GUIDs 404.
	 */
	public function test_video_page_routing() {
		$id = $this->video( 'abcDEF12' );

		$wp          = new \WP();
		$wp->request = 'videopress';
		$_GET['v']   = 'abcDEF12';
		Channel::route_video_page( $wp );
		$this->assertSame( $id, $wp->query_vars['attachment_id'] );
		$this->assertSame( 1, $wp->query_vars[ Channel::QUERY_VAR ] );

		$wp          = new \WP();
		$wp->request = 'videopress';
		$_GET['v']   = 'nope';
		Channel::route_video_page( $wp );
		$this->assertSame( array( 'error' => '404' ), $wp->query_vars );

		$wp             = new \WP();
		$wp->request    = 'about';
		$wp->query_vars = array( 'pagename' => 'about' );
		Channel::route_video_page( $wp );
		$this->assertSame( array( 'pagename' => 'about' ), $wp->query_vars );

		set_query_var( Channel::QUERY_VAR, 1 );
		$this->assertSame( array( 'videopress-video.php', 'attachment.php' ), Channel::template_hierarchy( array( 'attachment.php' ) ) );
		set_query_var( Channel::QUERY_VAR, 0 );
		$this->assertSame( array( 'attachment.php' ), Channel::template_hierarchy( array( 'attachment.php' ) ) );
	}

	/**
	 * A video block with useQueriedVideo plays the current video, with its
	 * title and poster from VideoPress.
	 */
	public function test_queried_video_block() {
		$id              = $this->video( 'abcDEF12', 'Into the Deadmines' );
		$GLOBALS['post'] = get_post( $id ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited

		$block = Channel::queried_video_block(
			array(
				'blockName' => 'videopress/video',
				'attrs'     => array( 'useQueriedVideo' => true ),
			)
		);
		$this->assertSame( 'abcDEF12', $block['attrs']['guid'] );
		$this->assertSame( $id, $block['attrs']['id'] );
		$this->assertSame( 'Into the Deadmines ( VideoPress )', $block['attrs']['title'] );
		$this->assertSame( 'https://videos.files.wordpress.com/abcDEF12/poster.jpg', $block['attrs']['poster'] );
		$this->assertSame( '', get_post_meta( $id, 'videopress_duration', true ) );

		$fixed = array(
			'blockName' => 'videopress/video',
			'attrs'     => array( 'guid' => 'ghiJKL34' ),
		);
		$this->assertSame( $fixed, Channel::queried_video_block( $fixed ) );

		$GLOBALS['post'] = get_post(
			wp_insert_post(
				array(
					'post_title'  => 'Text',
					'post_status' => 'publish',
				)
			)
		); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$none            = Channel::queried_video_block(
			array(
				'blockName' => 'videopress/video',
				'attrs'     => array( 'useQueriedVideo' => true ),
			)
		);
		$this->assertSame( '', $none['attrs']['guid'] );
	}

	/**
	 * `/videopress?list=<key>` routes to the post holding the playlist and the
	 * playlist template; `?v=…&list=…` keeps the playlist context; unknown keys 404.
	 */
	public function test_playlist_page_routing() {
		$posts = $this->index_playlists();
		$this->video( 'abcDEF12' );

		$wp                        = new \WP();
		$wp->request               = 'videopress';
		$_GET[ Channel::LIST_VAR ] = 'road';
		Channel::route_video_page( $wp );
		$this->assertSame(
			array(
				'p'                         => $posts['road'],
				'post_type'                 => 'page',
				Channel::PLAYLIST_QUERY_VAR => 1,
				Channel::LIST_VAR           => 'road',
			),
			$wp->query_vars
		);

		$wp                        = new \WP();
		$wp->request               = 'videopress';
		$_GET[ Channel::LIST_VAR ] = 'nope';
		Channel::route_video_page( $wp );
		$this->assertSame( array( 'error' => '404' ), $wp->query_vars );

		$wp          = new \WP();
		$wp->request = 'videopress';
		$_GET        = array(
			'v'               => 'abcDEF12',
			Channel::LIST_VAR => 'mc',
		);
		Channel::route_video_page( $wp );
		$this->assertSame( 'mc', $wp->query_vars[ Channel::LIST_VAR ] );
		$this->assertSame( 1, $wp->query_vars[ Channel::QUERY_VAR ] );

		set_query_var( Channel::PLAYLIST_QUERY_VAR, 1 );
		$this->assertSame( array( 'videopress-playlist.php', 'page.php' ), Channel::playlist_template_hierarchy( array( 'page.php' ) ) );
		set_query_var( Channel::PLAYLIST_QUERY_VAR, 0 );
		$this->assertSame( array( 'single.php' ), Channel::playlist_template_hierarchy( array( 'single.php' ) ) );
	}

	/**
	 * A playlist block with a `source` shows the queried or an indexed playlist
	 * ( the most recently updated by default ), and nothing when there is none.
	 */
	public function test_playlist_source_block() {
		$this->index_playlists();
		$block = function ( $attrs ) {
			return Channel::playlist_source_block(
				array(
					'blockName' => 'videopress/playlist',
					'attrs'     => $attrs,
				)
			)['attrs'];
		};

		$own = array(
			'videos' => array( array( 'guid' => 'zzzzzzzz' ) ),
		);
		$this->assertSame( $own, $block( $own ) );

		$latest = $block( array( 'source' => 'index' ) );
		$this->assertSame( 'road', $latest['videopressListKey'] );
		$this->assertSame( 'The road to 60', $latest['playlistTitle'] );

		$picked = $block(
			array(
				'source'           => 'index',
				'sourcePlaylistId' => 'mc',
			)
		);
		$this->assertSame( array( 'abcDEF12', 'ghiJKL34' ), array_column( $picked['videos'], 'guid' ) );
		$this->assertSame( 'Attunement to Ragnaros.', $picked['playlistDescription'] );

		// A playlist that is gone shows nothing; other blocks are left alone.
		$missing = $block(
			array(
				'source'           => 'index',
				'sourcePlaylistId' => 'nope',
				'videos'           => array( array( 'guid' => 'zzzzzzzz' ) ),
			)
		);
		$this->assertSame( array(), $missing['videos'] );
		$paragraph = array(
			'blockName' => 'core/paragraph',
			'attrs'     => array( 'source' => 'index' ),
		);
		$this->assertSame( $paragraph, Channel::playlist_source_block( $paragraph ) );

		// Outside a channel page the URL's playlist is ignored.
		set_query_var( Channel::LIST_VAR, 'mc' );
		$this->assertSame( array(), $block( array( 'source' => 'queried' ) )['videos'] );
		set_query_var( Channel::PLAYLIST_QUERY_VAR, 1 );
		$this->assertSame( 'mc', $block( array( 'source' => 'queried' ) )['videopressListKey'] );
	}

	/**
	 * With `showMeta`, a sourced playlist's entries carry their plays and upload
	 * time; entries without a local attachment get zeros.
	 */
	public function test_playlist_source_block_entry_meta() {
		$this->index_playlists();
		$id = $this->video( 'abcDEF12' );
		Channel_Data::reset();
		add_filter(
			'videopress_channel_video_views',
			function () use ( $id ) {
				return array( $id => 42 );
			}
		);
		$videos = function ( $attrs ) {
			return Channel::playlist_source_block(
				array(
					'blockName' => 'videopress/playlist',
					'attrs'     => $attrs + array(
						'source'           => 'index',
						'sourcePlaylistId' => 'mc',
					),
				)
			)['attrs']['videos'];
		};

		$with_meta = $videos( array( 'showMeta' => true ) );
		$this->assertSame( 42, $with_meta[0]['views'] );
		$this->assertSame( strtotime( get_post( $id )->post_date_gmt . ' UTC' ), $with_meta[0]['publishedAt'] );
		$this->assertSame( 1000, $with_meta[0]['durationMs'] );
		$this->assertSame( 0, $with_meta[1]['views'] );
		$this->assertSame( 0, $with_meta[1]['publishedAt'] );

		$this->assertArrayNotHasKey( 'views', $videos( array() )[0] );
	}

	/**
	 * Playlist records: only published playlists are listed, and lookups of
	 * unknown keys or sources come back empty.
	 */
	public function test_playlist_records() {
		$posts = $this->index_playlists();
		$draft = wp_insert_post(
			array(
				'post_title'  => 'Draft',
				'post_status' => 'draft',
			)
		);

		$index           = get_option( 'videopress_playlist_index' );
		$index['draft']  = array(
			'title'   => 'Not yet',
			'post_id' => $draft,
		);
		$index['broken'] = 'nope';
		update_option( 'videopress_playlist_index', $index );

		$this->assertSame( array( 'road', 'mc' ), array_column( Channel::playlists(), 'key' ) );
		$this->assertSame(
			array(
				'key'         => 'draft',
				'title'       => 'Not yet',
				'description' => '',
				'videos'      => array(),
				'post_id'     => $draft,
			),
			Channel::playlist_record( 'draft' )
		);
		$mc = Channel::playlist_record( 'mc' );
		$this->assertNotNull( $mc );
		$this->assertSame( $posts['mc'], $mc['post_id'] );
		$this->assertNull( Channel::playlist_record( '' ) );
		$this->assertNull( Channel::playlist_record( 'broken' ) );
		$this->assertNull( Channel::source_playlist( 'own', 'mc' ) );
		$this->assertNull( Channel::source_playlist( 'index', 'nope' ) );

		delete_option( 'videopress_playlist_index' );
		$this->assertNull( Channel::source_playlist( 'index' ) );
	}

	/**
	 * Video URLs carry the playlist context, and playlist lookups find the playlists holding a video.
	 */
	public function test_playlist_urls_and_membership() {
		$this->index_playlists();
		$id   = $this->video( 'ghiJKL34' );
		$base = user_trailingslashit( home_url( '/videopress' ) );

		$this->assertSame( $base . '?v=ghiJKL34&list=mc', Channel::video_url( $id, 'mc' ) );
		$this->assertSame( $base . '?list=road', Channel::playlist_url( 'road' ) );
		$this->assertSame( array( 'road', 'mc' ), array_column( Channel::playlists_with_video( 'ghiJKL34' ), 'key' ) );
		$this->assertTrue( Channel::is_site_url( $base ) );
		$this->assertFalse( Channel::is_site_url( 'https://videopress.com/v/ghiJKL34' ) );
	}
}
