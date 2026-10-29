<?php
/**
 * Tests for the VideoPress playlist block email renderer.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

require_once __DIR__ . '/mocks/class-mock-woocommerce-table-wrapper-helper.php';
require_once __DIR__ . '/mocks/class-mock-woocommerce-video-renderer.php';
require_once __DIR__ . '/../../src/utility-functions.php';

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Tests for the VideoPress playlist block email renderer.
 *
 * @covers \Automattic\Jetpack\VideoPress\Playlist_Block_Email_Renderer
 */
#[CoversClass( Playlist_Block_Email_Renderer::class )]
class Playlist_Block_Email_Renderer_Test extends BaseTestCase {

	/**
	 * Post the playlist is published in.
	 *
	 * @var int
	 */
	private $post_id = 0;

	/**
	 * Publish a post to hold the playlist, and keep the tests off the network.
	 */
	protected function set_up() {
		$this->post_id   = wp_insert_post(
			array(
				'post_title'  => 'Playlist post',
				'post_status' => 'publish',
			)
		);
		$GLOBALS['post'] = get_post( $this->post_id );

		add_filter( 'pre_http_request', array( $this, 'block_http' ) );
	}

	/**
	 * Clean up the post, the stubbed video sources and the HTTP block.
	 */
	protected function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'block_http' ) );
		remove_all_filters( 'rest_pre_dispatch' );
		remove_all_filters( 'videopress_channel_videos' );
		remove_all_filters( 'videopress_channel_video_views' );
		Channel_Data::reset();
		wp_delete_post( $this->post_id, true );
		unset( $GLOBALS['post'] );
	}

	/**
	 * Fail every outgoing request, as an unreachable VideoPress API would.
	 *
	 * @return \WP_Error
	 */
	public function block_http() {
		return new \WP_Error( 'http_blocked', 'No network in tests.' );
	}

	/**
	 * Cache the public API answer videopress_get_video_details() reads for a GUID.
	 *
	 * @param string      $guid   Video GUID.
	 * @param string      $title  Video title.
	 * @param string|null $poster Poster URL, or null for a private video the API refuses.
	 */
	private function cache_video_details( $guid, $title, $poster ) {
		$data = null === $poster
			? (object) array(
				'error'   => 'unauthorized',
				'message' => 'Private video.',
			)
			: (object) array(
				'title'  => $title,
				'poster' => $poster,
			);
		set_transient( 'jetpack_videopress_' . $guid, $data, HOUR_IN_SECONDS );
	}

	/**
	 * A playlist block with one entry per GUID, each cached as a public video.
	 *
	 * @param int   $count Number of videos.
	 * @param array $attrs Extra block attributes.
	 *
	 * @return array Parsed block.
	 */
	private function playlist_block( $count, $attrs = array() ) {
		$videos = array();
		for ( $i = 1; $i <= $count; $i++ ) {
			$guid     = sprintf( 'vidGui%02d', $i );
			$videos[] = array(
				'guid'       => $guid,
				'durationMs' => 180000,
				'height'     => 1080,
			);
			$this->cache_video_details( $guid, "Title $i", "https://videos.files.wordpress.com/$guid/poster.jpg" );
		}

		return array(
			'blockName' => 'videopress/playlist',
			'attrs'     => array_merge( array( 'videos' => $videos ), $attrs ),
		);
	}

	/**
	 * A rendering context with the default 600px email layout.
	 *
	 * @return object
	 */
	private function context() {
		return new class() {
			/**
			 * Get layout width.
			 *
			 * @return string
			 */
			public function get_layout_width_without_padding() {
				return '600px';
			}
		};
	}

	public function test_first_video_renders_as_poster_linking_to_the_post() {
		$result = Playlist_Block_Email_Renderer::render( '', $this->playlist_block( 3 ), $this->context() );

		$this->assertStringContainsString( 'data-poster="https://videos.files.wordpress.com/vidGui01/poster.jpg"', $result );
		$this->assertStringContainsString( '<a href="' . get_permalink( $this->post_id ) . '">Play</a>', $result );
	}

	public function test_other_videos_render_as_linked_thumbnails_with_titles() {
		$result = Playlist_Block_Email_Renderer::render( '', $this->playlist_block( 3 ), $this->context() );

		foreach ( array( 2, 3 ) as $i ) {
			$this->assertStringContainsString( "src=\"https://videos.files.wordpress.com/vidGui0$i/poster.jpg\"", $result );
			$this->assertStringContainsString( "Title $i", $result );
		}
		$this->assertSame( 1, substr_count( $result, 'vidGui01/poster.jpg' ), 'The first video should not repeat in the grid.' );
		$this->assertSame( 0, preg_match( '#href="(?!' . preg_quote( get_permalink( $this->post_id ), '#' ) . ')#', $result ), 'Every link should open the post.' );
	}

	/**
	 * Title attributes, and whether the email shows the title heading.
	 *
	 * @return array
	 */
	public static function heading_provider() {
		return array(
			'title shown'  => array( array( 'playlistTitle' => 'My <series>' ), true ),
			'title hidden' => array(
				array(
					'playlistTitle'     => 'My <series>',
					'showPlaylistTitle' => false,
				),
				false,
			),
			'no title'     => array( array( 'playlistTitle' => '  ' ), false ),
		);
	}

	/**
	 * @dataProvider heading_provider
	 *
	 * @param array $attrs     Block attributes.
	 * @param bool  $has_title Whether the heading is expected.
	 */
	#[\PHPUnit\Framework\Attributes\DataProvider( 'heading_provider' )]
	public function test_heading_follows_the_playlist_title( $attrs, $has_title ) {
		$result = Playlist_Block_Email_Renderer::render( '', $this->playlist_block( 3, $attrs ), $this->context() );

		if ( $has_title ) {
			$this->assertStringContainsString( '>My &lt;series&gt;</h2>', $result );
		} else {
			$this->assertStringNotContainsString( '<h2', $result );
		}
	}

	public function test_single_video_has_no_grid() {
		$result = Playlist_Block_Email_Renderer::render( '', $this->playlist_block( 1 ), $this->context() );

		$this->assertStringContainsString( 'vidGui01/poster.jpg', $result );
		$this->assertStringNotContainsString( '<img', $result );
	}

	/**
	 * Block email_attrs, and the thumbnail width a third of that width gives.
	 *
	 * @return array
	 */
	public static function grid_width_provider() {
		return array(
			'full email width'  => array( array(), 192 ),
			'half-width column' => array( array( 'width' => '300px' ), 92 ),
		);
	}

	/**
	 * @dataProvider grid_width_provider
	 *
	 * @param array $email_attrs Email editor attributes of the block.
	 * @param int   $width       Expected thumbnail width attribute.
	 */
	#[\PHPUnit\Framework\Attributes\DataProvider( 'grid_width_provider' )]
	public function test_grid_thumbnails_are_sized_for_the_block_width( $email_attrs, $width ) {
		$block                = $this->playlist_block( 3 );
		$block['email_attrs'] = $email_attrs;

		$result = Playlist_Block_Email_Renderer::render( '', $block, $this->context() );

		$this->assertSame( 2, substr_count( $result, "width=\"$width\"" ) );
	}

	public function test_long_playlists_cap_the_grid_and_link_to_the_rest() {
		$result = Playlist_Block_Email_Renderer::render( '', $this->playlist_block( 10 ), $this->context() );

		$this->assertStringContainsString( 'vidGui07/poster.jpg', $result );
		$this->assertStringNotContainsString( 'vidGui08/poster.jpg', $result );
		$this->assertStringContainsString( '+ 3 more videos', $result );
	}

	public function test_no_more_link_when_every_video_fits() {
		$result = Playlist_Block_Email_Renderer::render( '', $this->playlist_block( 7 ), $this->context() );

		$this->assertStringContainsString( 'vidGui07/poster.jpg', $result );
		$this->assertStringNotContainsString( 'more video', $result );
	}

	/**
	 * Lookups for a private video: refused outright, or answered with an is_private flag.
	 *
	 * @return array
	 */
	public static function private_video_details_provider() {
		return array(
			'refused'            => array(
				(object) array(
					'error'   => 'unauthorized',
					'message' => 'Private video.',
				),
			),
			'flagged as private' => array(
				(object) array(
					'title'      => 'Secret title',
					'poster'     => 'https://videos.files.wordpress.com/vidGui02/poster.jpg',
					'is_private' => true,
				),
			),
		);
	}

	/**
	 * @dataProvider private_video_details_provider
	 *
	 * @param object $details What videopress_get_video_details() returns for the private video.
	 */
	#[\PHPUnit\Framework\Attributes\DataProvider( 'private_video_details_provider' )]
	public function test_private_video_shows_its_position_as_a_text_link( $details ) {
		$block = $this->playlist_block( 3 );
		set_transient( 'jetpack_videopress_vidGui02', $details, HOUR_IN_SECONDS );

		$result = Playlist_Block_Email_Renderer::render( '', $block, $this->context() );

		$this->assertStringNotContainsString( 'vidGui02/poster.jpg', $result );
		$this->assertStringNotContainsString( 'Secret title', $result );
		$this->assertStringContainsString( 'Video 2', $result );
	}

	public function test_first_video_without_a_poster_falls_back_to_a_link() {
		$block = $this->playlist_block( 2 );
		$this->cache_video_details( 'vidGui01', '', null );

		$result = Playlist_Block_Email_Renderer::render( '', $block, $this->context() );

		$this->assertStringNotContainsString( 'email-video', $result );
		$this->assertStringContainsString( 'Visit the post to watch the video', $result );
		$this->assertStringContainsString( 'vidGui02/poster.jpg', $result );
	}

	/**
	 * Unusable input, or no post to send readers to.
	 *
	 * @return array
	 */
	public static function nothing_to_render_provider() {
		return array(
			'no attributes'   => array( array( 'blockName' => 'videopress/playlist' ), true ),
			'no videos'       => array(
				array(
					'blockName' => 'videopress/playlist',
					'attrs'     => array( 'videos' => array() ),
				),
				true,
			),
			'no post to link' => array( null, false ),
		);
	}

	/**
	 * @dataProvider nothing_to_render_provider
	 *
	 * @param array|null $block    Parsed block, or null for a valid three-video playlist.
	 * @param bool       $has_post Whether the playlist is in a post.
	 */
	#[\PHPUnit\Framework\Attributes\DataProvider( 'nothing_to_render_provider' )]
	public function test_renders_nothing_without_videos_or_a_post( $block, $has_post ) {
		$block ??= $this->playlist_block( 3 );
		if ( ! $has_post ) {
			unset( $GLOBALS['post'] );
		}

		$this->assertSame( '', Playlist_Block_Email_Renderer::render( '<figure>front end</figure>', $block, $this->context() ) );
	}

	public function test_latest_videos_playlist_renders_the_newest_videos() {
		$this->cache_video_details( 'newVid01', 'Newest', 'https://videos.files.wordpress.com/newVid01/poster.jpg' );
		$this->cache_video_details( 'newVid02', 'Second newest', 'https://videos.files.wordpress.com/newVid02/poster.jpg' );
		add_filter(
			'rest_pre_dispatch',
			function ( $result, $server, $request ) {
				if ( '/wp/v2/media' !== $request->get_route() ) {
					return $result;
				}
				return new \WP_REST_Response(
					array_slice(
						array(
							array(
								'id'                      => 1,
								'jetpack_videopress_guid' => 'newVid01',
								'media_details'           => array( 'height' => 720 ),
							),
							array(
								'id'                      => 2,
								'jetpack_videopress_guid' => 'newVid02',
								'media_details'           => array( 'height' => 720 ),
							),
							array(
								'id'                      => 3,
								'jetpack_videopress_guid' => 'newVid03',
								'media_details'           => array( 'height' => 720 ),
							),
						),
						0,
						(int) $request->get_param( 'per_page' )
					)
				);
			},
			10,
			3
		);

		$result = Playlist_Block_Email_Renderer::render_latest_videos(
			'',
			array(
				'blockName' => 'videopress/latest-videos-playlist',
				'attrs'     => array( 'count' => 2 ),
			),
			$this->context()
		);

		$this->assertStringContainsString( 'data-poster="https://videos.files.wordpress.com/newVid01/poster.jpg"', $result );
		$this->assertStringContainsString( 'newVid02/poster.jpg', $result );
		$this->assertStringNotContainsString( 'newVid03', $result );
	}

	/**
	 * Latest Videos Playlist orders other than newest, and the video each puts first.
	 *
	 * @return array
	 */
	public static function latest_videos_order_provider() {
		return array(
			'popular' => array( 'popular', 'sortVid2' ),
			'oldest'  => array( 'oldest', 'sortVid3' ),
		);
	}

	/**
	 * @dataProvider latest_videos_order_provider
	 *
	 * @param string $order Block orderBy attribute.
	 * @param string $first GUID the front end shows first for that order.
	 */
	#[\PHPUnit\Framework\Attributes\DataProvider( 'latest_videos_order_provider' )]
	public function test_latest_videos_playlist_keeps_the_block_order( $order, $first ) {
		$records = array();
		foreach ( array( 'sortVid1', 'sortVid2', 'sortVid3' ) as $i => $guid ) {
			$records[] = array(
				'id'          => $i + 1,
				'guid'        => $guid,
				'durationMs'  => 60000,
				'height'      => 720,
				'publishedAt' => time() - $i,
			);
			$this->cache_video_details( $guid, $guid, "https://videos.files.wordpress.com/$guid/poster.jpg" );
		}
		Channel_Data::reset();
		add_filter(
			'videopress_channel_videos',
			function () use ( $records ) {
				return $records;
			}
		);
		add_filter(
			'videopress_channel_video_views',
			function () {
				return array( 2 => 500 );
			}
		);

		$result = Playlist_Block_Email_Renderer::render_latest_videos(
			'',
			array(
				'blockName' => 'videopress/latest-videos-playlist',
				'attrs'     => array(
					'count'   => 2,
					'orderBy' => $order,
				),
			),
			$this->context()
		);

		$this->assertStringContainsString( "data-poster=\"https://videos.files.wordpress.com/$first/poster.jpg\"", $result );
	}
}
