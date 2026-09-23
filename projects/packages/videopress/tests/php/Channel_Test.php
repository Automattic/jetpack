<?php
/**
 * Tests for the VideoPress Channel feature.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\VideoPress\Channel;
use Automattic\Jetpack\VideoPress\Initializer as VideoPress_Initializer;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use WorDBless\BaseTestCase;

/**
 * Test suite for Channel. Separate processes for the same reason as
 * Playlist_Block_Test. The dbless environment answers no WP_Query or term
 * queries, so post-sourced paths get their posts through the source filter.
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
		kses_remove_filters();
		add_filter( 'videopress_channel_enabled', '__return_true' );
		Channel::register();
		// Block types whose context survives WP_Block's uses_context filtering.
		register_block_type( 'test/bound', array( 'uses_context' => array( 'postId' ) ) );
		register_block_type( 'test/query', array( 'uses_context' => array( 'query' ) ) );
		\WP_Block_Supports::$block_to_render = array(
			'blockName' => 'videopress/playlist',
			'attrs'     => array(),
		);
	}

	/**
	 * Undo registration.
	 */
	protected function tear_down() {
		\WP_Block_Supports::$block_to_render = null;
		remove_filter( 'videopress_channel_enabled', '__return_true' );
		remove_all_filters( 'videopress_channel_playlist_source_posts' );
		unregister_taxonomy( Channel::TAXONOMY );
		if ( function_exists( 'unregister_block_bindings_source' ) ) {
			unregister_block_bindings_source( Channel::BINDINGS_SOURCE );
		}
		foreach ( array( 'test/bound', 'test/query', 'videopress/playlists' ) as $name ) {
			if ( \WP_Block_Type_Registry::get_instance()->is_registered( $name ) ) {
				unregister_block_type( $name );
			}
		}
	}

	/**
	 * Create a published video post.
	 *
	 * @param string $title    Title.
	 * @param string $guid     VideoPress GUID.
	 * @param int    $duration Duration in ms on the block.
	 * @param array  $extra    Extra wp_insert_post args.
	 * @return int Post ID.
	 */
	private function video( $title, $guid, $duration = 724000, $extra = array() ) {
		return wp_insert_post(
			array_merge(
				array(
					'post_title'   => $title,
					'post_status'  => 'publish',
					'post_content' => '<!-- wp:videopress/video {"guid":"' . $guid . '","duration":' . $duration . ',"poster":"https://videos.files.wordpress.com/' . $guid . '/poster.jpg"} /-->',
				),
				$extra
			)
		);
	}

	/**
	 * Serve the given posts to post-sourced playlist blocks.
	 *
	 * @param int[] $ids Post IDs.
	 */
	private function source_posts( $ids ) {
		add_filter(
			'videopress_channel_playlist_source_posts',
			function () use ( $ids ) {
				return array_map( 'get_post', $ids );
			}
		);
	}

	/**
	 * A block carrying a postId context.
	 *
	 * @param int $post_id The post.
	 * @return \WP_Block
	 */
	private function bound_block( $post_id ) {
		return new \WP_Block(
			array(
				'blockName' => 'test/bound',
				'attrs'     => array(),
			),
			array( 'postId' => $post_id )
		);
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
	 * Registration adds the taxonomy, the meta and the bindings source.
	 */
	public function test_register() {
		$this->assertTrue( taxonomy_exists( Channel::TAXONOMY ) );
		$this->assertTrue( is_object_in_taxonomy( 'post', Channel::TAXONOMY ) );
		$this->assertTrue( registered_meta_key_exists( 'post', Channel::META_DURATION, 'post' ) );
		$this->assertTrue( registered_meta_key_exists( 'post', Channel::META_VIEWS, 'post' ) );
		if ( function_exists( 'get_block_bindings_source' ) ) {
			$this->assertNotNull( get_block_bindings_source( Channel::BINDINGS_SOURCE ) );
		}
	}

	/**
	 * Saving a post caches the first video block's duration in seconds.
	 */
	public function test_cache_duration_and_guid() {
		$id   = $this->video( 'Into the Deadmines', 'abcDEF12', 4506000 );
		$post = get_post( $id );

		$this->assertSame( 4506, (int) get_post_meta( $id, Channel::META_DURATION, true ) );
		$this->assertSame( 'abcDEF12', Channel::post_guid( $post ) );
		$this->assertSame( 'https://videos.files.wordpress.com/abcDEF12/poster.jpg', Channel::post_poster( $post ) );
		$this->assertSame( '1:15:06', Channel::format_duration( 4506 ) );

		$text = wp_insert_post(
			array(
				'post_title'   => 'Text',
				'post_status'  => 'publish',
				'post_content' => 'Hello',
			)
		);
		$this->assertSame( '', Channel::post_guid( get_post( $text ) ) );
		$this->assertSame( '', get_post_meta( $text, Channel::META_DURATION, true ) );
	}

	/**
	 * Posts without a featured image fall back to the VideoPress poster.
	 */
	public function test_poster_fallback() {
		$id   = $this->video( 'Into the Deadmines', 'abcDEF12' );
		$html = get_the_post_thumbnail( $id );

		$this->assertStringContainsString( 'videopress-channel-poster', $html );
		$this->assertStringContainsString( 'abcDEF12/poster.jpg', $html );
	}

	/**
	 * Count and duration formatting.
	 */
	public function test_formatting() {
		$this->assertSame( '999', Channel::format_count( 999 ) );
		$this->assertSame( '1.2K', Channel::format_count( 1234 ) );
		$this->assertSame( '12K', Channel::format_count( 12480 ) );
		$this->assertSame( '2.1M', Channel::format_count( 2100000 ) );
		$this->assertSame( '', Channel::format_duration( 0 ) );
		$this->assertSame( '0:45', Channel::format_duration( 45 ) );
		$this->assertSame( '12:04', Channel::format_duration( 724 ) );
	}

	/**
	 * Bindings resolve video and channel values from the block's post context.
	 */
	public function test_binding_values() {
		$id = $this->video( 'Into the Deadmines', 'abcDEF12', 754000 );
		update_post_meta( $id, Channel::META_VIEWS, 12480 );
		$block = $this->bound_block( $id );
		$value = function ( $key ) use ( $block ) {
			return Channel::get_binding_value( array( 'key' => $key ), $block, 'content' );
		};

		$this->assertSame( '12:34', $value( 'video.duration' ) );
		$this->assertStringStartsWith( '12K views · ', $value( 'video.stats' ) );
		$this->assertStringStartsWith( '12,480 views · ', $value( 'video.stats_long' ) );
		$this->assertSame( '12K views', $value( 'video.views' ) );
		$this->assertSame( 'https://videos.files.wordpress.com/abcDEF12/poster.jpg', $value( 'video.poster' ) );
		$this->assertSame( get_permalink( $id ), $value( 'video.url' ) );
		$this->assertSame( (string) get_bloginfo( 'name' ), $value( 'channel.name' ) );
		$this->assertMatchesRegularExpression( '/^\d+$/', $value( 'channel.videos' ) );
		$this->assertMatchesRegularExpression( '/^\d+ (video|videos)$/', $value( 'channel.video_count' ) );
		$this->assertMatchesRegularExpression( '/^\d+ (playlist|playlists)$/', $value( 'channel.playlist_count' ) );
		$this->assertSame( '@' . strtok( (string) wp_parse_url( home_url( '/' ), PHP_URL_HOST ), '.' ), $value( 'channel.handle' ) );
		$this->assertSame( home_url( '/' ), $value( 'channel.url' ) );
		$this->assertNull( $value( 'video.nope' ) );
		$this->assertNull( $value( '' ) );
		$this->assertNull( Channel::get_binding_value( array( 'key' => 'video.duration' ), null, 'content' ) );
	}

	/**
	 * Query Loop orderings and URL filters.
	 */
	public function test_query_loop_vars() {
		$block = function ( $query ) {
			return new \WP_Block(
				array(
					'blockName' => 'test/query',
					'attrs'     => array(),
				),
				array( 'query' => $query )
			);
		};

		$this->assertSame( array( 'orderby' => 'date' ), Channel::query_loop_vars( array( 'orderby' => 'date' ), $block( array() ) ) );

		$popular = Channel::query_loop_vars( array(), $block( array( 'videopressOrder' => 'popular' ) ) );
		$this->assertSame( Channel::META_VIEWS, $popular['meta_key'] );
		$this->assertSame( 'meta_value_num', $popular['orderby'] );
		$this->assertSame( 1, $popular['ignore_sticky_posts'] );

		update_option( 'sticky_posts', array( 42 ) );
		$featured = Channel::query_loop_vars( array(), $block( array( 'videopressOrder' => 'featured' ) ) );
		$this->assertSame( array( 42 ), $featured['post__in'] );
		$this->assertSame( 1, $featured['posts_per_page'] );
		delete_option( 'sticky_posts' );

		$none = Channel::query_loop_vars( array(), $block( array( 'videopressOrder' => 'featured-playlist' ) ) );
		$this->assertSame( array( 0 ), $none['post__in'] );

		$_GET     = array(
			'vp_sort' => 'oldest',
			'vp_cat'  => 'raids',
			'vp_dur'  => 'long',
			'vp_s'    => 'dead',
		);
		$filtered = Channel::query_loop_vars( array(), $block( array( 'videopressFilters' => true ) ) );
		$_GET     = array( 'vp_sort' => 'popular' );
		$popular  = Channel::query_loop_vars( array(), $block( array( 'videopressFilters' => true ) ) );
		$_GET     = array();

		$this->assertSame( 'ASC', $filtered['order'] );
		$this->assertSame( 'raids', $filtered['category_name'] );
		$this->assertSame( 'dead', $filtered['s'] );
		$this->assertSame( Channel::META_DURATION, $filtered['meta_query'][0]['key'] );
		$this->assertSame( 2701, $filtered['meta_query'][0]['value'][0] );
		$this->assertSame( 'meta_value_num', $popular['orderby'] );
	}

	/**
	 * Post-sourced playlists render the posts' videos through the player layouts.
	 */
	public function test_playlist_block_latest_source() {
		$first  = $this->video( 'First', 'abcDEF12' );
		$second = $this->video( 'Second', 'ghiJKL34' );
		$text   = wp_insert_post(
			array(
				'post_title'   => 'No video here',
				'post_status'  => 'publish',
				'post_content' => 'plain text',
			)
		);
		$this->source_posts( array( $second, $first, $text ) );

		$markup = VideoPress_Initializer::render_videopress_playlist_block(
			array(
				'source' => 'latest',
				'layout' => 'grid',
			)
		);
		$this->assertStringContainsString( 'is-layout-grid', $markup );
		$this->assertStringContainsString( 'data-guid="ghiJKL34"', $markup );
		$this->assertStringContainsString( 'data-guid="abcDEF12"', $markup );
		$this->assertSame( 2, substr_count( $markup, 'data-guid=' ) );
		$this->assertStringContainsString( 'data-title="Second"', $markup );
		$this->assertStringContainsString( '>First<', $markup );
		$this->assertStringContainsString( '12:04', $markup );

		$limited = VideoPress_Initializer::render_videopress_playlist_block(
			array(
				'source'         => 'latest',
				'limit'          => 1,
				'excludeCurrent' => true,
			),
			'',
			$this->bound_block( $second )
		);
		$this->assertSame( 1, substr_count( $limited, 'data-guid=' ) );
		$this->assertStringContainsString( 'data-guid="abcDEF12"', $limited );

		// Unknown sources and empty results render nothing.
		$this->assertSame( '', VideoPress_Initializer::render_videopress_playlist_block( array( 'source' => 'bogus' ) ) );
		remove_all_filters( 'videopress_channel_playlist_source_posts' );
		$this->assertSame( '', VideoPress_Initializer::render_videopress_playlist_block( array( 'source' => 'latest' ) ) );
	}

	/**
	 * The linked layouts render rows to each post, marking the current one.
	 */
	public function test_playlist_block_queue_layout() {
		$a = $this->video( 'Ep one', 'abcDEF12', 600000 );
		$b = $this->video( 'Ep <two>', 'ghiJKL34', 600000 );
		$this->source_posts( array( $a, $b ) );

		$markup = VideoPress_Initializer::render_videopress_playlist_block(
			array(
				'source' => 'current-playlist',
				'layout' => 'queue',
			),
			'',
			$this->bound_block( $b )
		);

		$this->assertStringContainsString( 'is-layout-queue is-linked', $markup );
		$this->assertStringNotContainsString( '<iframe', $markup );
		$this->assertStringContainsString( 'href="' . esc_url( get_permalink( $a ) ) . '"', $markup );
		$this->assertSame( 1, substr_count( $markup, 'aria-current="page"' ) );
		$this->assertStringContainsString( '>Ep &lt;two&gt;<', $markup );
		$this->assertStringContainsString( '2 / 2 · 20 min', $markup );
		$this->assertStringContainsString( '>10:00<', $markup );
		$this->assertStringContainsString( 'abcDEF12/poster.jpg', $markup );

		$list = VideoPress_Initializer::render_videopress_playlist_block(
			array(
				'source'   => 'latest',
				'layout'   => 'list',
				'showMeta' => false,
			)
		);
		$this->assertStringContainsString( 'is-layout-list', $list );
		$this->assertStringNotContainsString( 'videopress-playlist__list-header', $list );
		$this->assertStringNotContainsString( 'videopress-playlist__entry-meta', $list );
		$this->assertStringNotContainsString( 'is-current', $list );

		// Manual playlists cannot use a linked layout: they fall back to the player.
		$manual = VideoPress_Initializer::render_videopress_playlist_block(
			array(
				'layout' => 'list',
				'videos' => array( array( 'guid' => 'abcDEF12' ) ),
			)
		);
		$this->assertStringContainsString( 'is-layout-side-rail', $manual );
		$this->assertStringContainsString( '<iframe', $manual );
	}

	/**
	 * The Playlists block registers from its metadata and renders the empty state.
	 */
	public function test_playlists_block() {
		$dir = sys_get_temp_dir() . '/vp-playlists-' . uniqid();
		mkdir( $dir ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_mkdir
		file_put_contents( // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
			$dir . '/block.json',
			wp_json_encode(
				array(
					'name'       => 'videopress/playlists',
					'attributes' => array(
						'limit' => array(
							'type'    => 'number',
							'default' => 0,
						),
					),
				),
				JSON_UNESCAPED_SLASHES
			)
		);
		Channel::register_playlists_block( $dir . '/block.json' );
		$this->assertTrue( \WP_Block_Type_Registry::get_instance()->is_registered( 'videopress/playlists' ) );
		$this->assertSame( 'videopress/playlists', \WP_Block_Type_Registry::get_instance()->get_registered( 'videopress/playlists' )->name );

		\WP_Block_Supports::$block_to_render = array(
			'blockName' => 'videopress/playlists',
			'attrs'     => array(),
		);
		$empty                               = Channel::render_playlists_block( array() );
		$this->assertStringContainsString( 'videopress-playlists is-empty', $empty );
		$this->assertStringContainsString( 'No playlists yet', $empty );

		wp_delete_file( $dir . '/block.json' );
		rmdir( $dir ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir
	}
}
