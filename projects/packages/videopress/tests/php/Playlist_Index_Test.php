<?php
/**
 * Tests for the site-wide playlist index.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\VideoPress\Playlist_Index;
use WorDBless\BaseTestCase;

/**
 * Test suite for Playlist_Index.
 */
class Playlist_Index_Test extends BaseTestCase {

	/**
	 * Posts standing in for the posts table during a full build, see stub_post_query().
	 *
	 * @var \WP_Post[]
	 */
	private $scan_posts = array();

	/**
	 * Start every test without an index. The test environment's kses pass
	 * slashes block attribute JSON on insert, so it is switched off.
	 */
	protected function set_up() {
		delete_option( Playlist_Index::OPTION_NAME );
		delete_option( Playlist_Index::VERSION_OPTION_NAME );
		kses_remove_filters();
	}

	/**
	 * Clean up options, cron and query stubs.
	 */
	protected function tear_down() {
		kses_init_filters();
		delete_option( Playlist_Index::OPTION_NAME );
		delete_option( Playlist_Index::VERSION_OPTION_NAME );
		wp_clear_scheduled_hook( Playlist_Index::BUILD_HOOK );
		remove_filter( 'posts_pre_query', array( $this, 'stub_post_query' ) );
		$this->scan_posts = array();
	}

	/**
	 * Serialize a Video Playlist block.
	 *
	 * @param array $attrs Block attributes.
	 *
	 * @return string Block markup.
	 */
	private function playlist_block( $attrs ) {
		return '<!-- wp:videopress/playlist ' . wp_json_encode( $attrs, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . ' /-->';
	}

	/**
	 * Create a post holding the given content.
	 *
	 * @param string $content Post content.
	 * @param array  $args    Extra wp_insert_post() args.
	 *
	 * @return \WP_Post
	 */
	private function create_post( $content, $args = array() ) {
		$post_id = wp_insert_post(
			array_merge(
				array(
					'post_title'   => 'Playlists',
					'post_content' => $content,
					'post_status'  => 'publish',
					'post_type'    => 'post',
				),
				$args
			)
		);

		return get_post( $post_id );
	}

	/**
	 * Answer post queries from the posts the test lined up for the scan.
	 *
	 * WorDBless keeps posts in the object cache only, so WP_Query finds nothing
	 * on its own; the LIKE clause the build adds is emulated with has_block().
	 *
	 * @param array|null $posts Return value to short-circuit with.
	 * @param \WP_Query  $query The query.
	 *
	 * @return array|null
	 */
	public function stub_post_query( $posts, $query ) {
		$found = array_values(
			array_filter(
				$this->scan_posts,
				function ( $post ) {
					return has_block( Playlist_Index::BLOCK_NAME, $post );
				}
			)
		);

		$limit  = (int) $query->get( 'posts_per_page' );
		$offset = ( max( 1, (int) $query->get( 'paged' ) ) - 1 ) * $limit;

		return array_slice( $found, $offset, $limit );
	}

	/**
	 * Records carry the key, title, description, videos and source post.
	 */
	public function test_extract_records_reads_the_block_attributes() {
		$post = $this->create_post(
			$this->playlist_block(
				array(
					'playlistId'          => 'abc-123',
					'playlistTitle'       => ' Summer <b>trip</b> ',
					'playlistDescription' => "Line one\n<script>alert(1)</script>",
					'videos'              => array(
						array(
							'guid'       => 'abcDEF12',
							'durationMs' => 1000,
							'height'     => 720,
						),
						array( 'guid' => 'not a guid' ),
					),
				)
			)
		);

		$records = Playlist_Index::extract_records( $post );

		$this->assertSame( array( 'abc-123' ), array_keys( $records ) );
		$this->assertSame( 'Summer trip', $records['abc-123']['title'] );
		$this->assertSame( 'Line one', $records['abc-123']['description'] );
		$this->assertSame(
			array(
				array(
					'guid'       => 'abcDEF12',
					'durationMs' => 1000,
					'height'     => 720,
				),
			),
			$records['abc-123']['videos']
		);
		$this->assertSame( $post->ID, $records['abc-123']['post_id'] );
	}

	/**
	 * Blocks saved before the playlistId attribute existed are keyed by post and
	 * ordinal, and nested blocks are found.
	 */
	public function test_extract_records_falls_back_to_positional_keys() {
		$post = $this->create_post(
			$this->playlist_block( array( 'playlistTitle' => 'First' ) ) .
			'<!-- wp:group --><div class="wp-block-group">' .
			$this->playlist_block( array( 'playlistTitle' => 'Second' ) ) .
			'</div><!-- /wp:group -->'
		);

		$records = Playlist_Index::extract_records( $post );

		$this->assertSame( array( $post->ID . '-1', $post->ID . '-2' ), array_keys( $records ) );
		$this->assertSame( 'First', $records[ $post->ID . '-1' ]['title'] );
		$this->assertSame( 'Second', $records[ $post->ID . '-2' ]['title'] );
		$this->assertSame( '', $records[ $post->ID . '-1' ]['description'] );
		$this->assertSame( array(), $records[ $post->ID . '-1' ]['videos'] );
	}

	/**
	 * A Latest Videos Playlist block, and the Video Playlist block it wraps as
	 * its canvas, are not independent playlists and stay out of the index.
	 */
	public function test_extract_records_skips_dynamic_playlists() {
		$post = $this->create_post(
			'<!-- wp:videopress/latest-videos-playlist {"count":3} -->' .
			$this->playlist_block( array( 'playlistId' => 'inner' ) ) .
			'<!-- /wp:videopress/latest-videos-playlist -->' .
			$this->playlist_block(
				array(
					'playlistId'    => 'standalone',
					'playlistTitle' => 'Mine',
				)
			)
		);

		$records = Playlist_Index::extract_records( $post );

		$this->assertSame( array( 'standalone' ), array_keys( $records ) );
		$this->assertSame( 'Mine', $records['standalone']['title'] );
	}

	/**
	 * Content without the block yields nothing.
	 */
	public function test_extract_records_ignores_other_content() {
		$post = $this->create_post( '<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->' );

		$this->assertSame( array(), Playlist_Index::extract_records( $post ) );
	}

	/**
	 * Saving a post adds its playlists, and saving it again replaces them.
	 */
	public function test_index_post_adds_and_replaces_records() {
		$post = $this->create_post( $this->playlist_block( array( 'playlistId' => 'one' ) ) );

		Playlist_Index::index_post( $post->ID, $post );
		$this->assertSame( array( 'one' ), array_keys( Playlist_Index::get_playlists() ) );

		$post->post_content = $this->playlist_block(
			array(
				'playlistId'    => 'two',
				'playlistTitle' => 'Renamed',
			)
		);
		Playlist_Index::index_post( $post->ID, $post );

		$playlists = Playlist_Index::get_playlists();
		$this->assertSame( array( 'two' ), array_keys( $playlists ) );
		$this->assertSame( 'Renamed', $playlists['two']['title'] );
	}

	/**
	 * A post that is no longer public drops out of the index, and so does a deleted one.
	 */
	public function test_index_post_drops_unpublished_and_deleted_posts() {
		$post  = $this->create_post( $this->playlist_block( array( 'playlistId' => 'one' ) ) );
		$other = $this->create_post( $this->playlist_block( array( 'playlistId' => 'two' ) ) );

		Playlist_Index::index_post( $post->ID, $post );
		Playlist_Index::index_post( $other->ID, $other );
		$this->assertSame( array( 'one', 'two' ), array_keys( Playlist_Index::get_playlists() ) );

		$post->post_status = 'draft';
		Playlist_Index::index_post( $post->ID, $post );
		$this->assertSame( array( 'two' ), array_keys( Playlist_Index::get_playlists() ) );

		Playlist_Index::remove_post( $other->ID );
		$this->assertSame( array(), Playlist_Index::get_playlists() );
	}

	/**
	 * Revisions and non-public post types never reach the index.
	 */
	public function test_index_post_skips_revisions_and_private_post_types() {
		$post     = $this->create_post( $this->playlist_block( array( 'playlistId' => 'one' ) ) );
		$revision = $this->create_post(
			$this->playlist_block( array( 'playlistId' => 'rev' ) ),
			array(
				'post_type'   => 'revision',
				'post_parent' => $post->ID,
				'post_status' => 'inherit',
			)
		);
		$pattern  = $this->create_post(
			$this->playlist_block( array( 'playlistId' => 'pattern' ) ),
			array( 'post_type' => 'wp_block' )
		);

		Playlist_Index::index_post( $revision->ID, $revision );
		Playlist_Index::index_post( $pattern->ID, $pattern );

		$this->assertSame( array(), Playlist_Index::get_playlists() );
	}

	/**
	 * The same playlist id in two posts keeps both playlists listed.
	 */
	public function test_index_post_keeps_copied_playlists_apart() {
		$post  = $this->create_post( $this->playlist_block( array( 'playlistId' => 'shared' ) ) );
		$other = $this->create_post( $this->playlist_block( array( 'playlistId' => 'shared' ) ) );

		Playlist_Index::index_post( $post->ID, $post );
		Playlist_Index::index_post( $other->ID, $other );

		$this->assertSame(
			array( 'shared', 'shared-' . $other->ID ),
			array_keys( Playlist_Index::get_playlists() )
		);
	}

	/**
	 * The full build scans published content in batches and stamps the schema version.
	 */
	public function test_build_indexes_all_published_playlists() {
		add_filter( 'posts_pre_query', array( $this, 'stub_post_query' ), 10, 2 );

		// More posts than one scan batch, one of them without a playlist.
		for ( $i = 1; $i <= Playlist_Index::SCAN_BATCH_SIZE + 1; $i++ ) {
			$this->scan_posts[] = $this->create_post(
				$this->playlist_block(
					array(
						'playlistId'    => 'playlist-' . $i,
						'playlistTitle' => 'Playlist ' . $i,
					)
				)
			);
		}
		$this->scan_posts[] = $this->create_post( '<!-- wp:paragraph --><p>No playlist</p><!-- /wp:paragraph -->' );

		// A stale record from a post that no longer exists is dropped by the rebuild.
		update_option( Playlist_Index::OPTION_NAME, array( 'stale' => array( 'post_id' => 999999 ) ), false );

		Playlist_Index::build();

		$playlists = Playlist_Index::get_playlists();
		$this->assertCount( Playlist_Index::SCAN_BATCH_SIZE + 1, $playlists );
		$this->assertArrayNotHasKey( 'stale', $playlists );
		$this->assertSame( 'Playlist 1', $playlists['playlist-1']['title'] );
		$this->assertSame( Playlist_Index::INDEX_VERSION, (int) get_option( Playlist_Index::VERSION_OPTION_NAME ) );
	}

	/**
	 * The initial scan is scheduled once, and only until the site is indexed.
	 */
	public function test_maybe_schedule_build_schedules_the_scan_once() {
		Playlist_Index::maybe_schedule_build();
		$scheduled = wp_next_scheduled( Playlist_Index::BUILD_HOOK );
		$this->assertNotFalse( $scheduled );

		// A second call must not queue a second scan.
		Playlist_Index::maybe_schedule_build();
		$this->assertSame( $scheduled, wp_next_scheduled( Playlist_Index::BUILD_HOOK ) );
		$this->assertCount( 1, _get_cron_array() );

		wp_clear_scheduled_hook( Playlist_Index::BUILD_HOOK );
		update_option( Playlist_Index::VERSION_OPTION_NAME, Playlist_Index::INDEX_VERSION );

		Playlist_Index::maybe_schedule_build();

		$this->assertFalse( wp_next_scheduled( Playlist_Index::BUILD_HOOK ) );
	}

	/**
	 * The hooks cover the post lifecycle and the scan.
	 */
	public function test_init_hooks() {
		Playlist_Index::init();

		$this->assertSame( 10, has_action( 'wp_after_insert_post', array( Playlist_Index::class, 'index_post' ) ) );
		$this->assertSame( 10, has_action( 'deleted_post', array( Playlist_Index::class, 'remove_post' ) ) );
		$this->assertSame( 10, has_action( 'admin_init', array( Playlist_Index::class, 'maybe_schedule_build' ) ) );
		$this->assertSame( 10, has_action( Playlist_Index::BUILD_HOOK, array( Playlist_Index::class, 'build' ) ) );

		remove_action( 'wp_after_insert_post', array( Playlist_Index::class, 'index_post' ) );
		remove_action( 'deleted_post', array( Playlist_Index::class, 'remove_post' ) );
		remove_action( 'admin_init', array( Playlist_Index::class, 'maybe_schedule_build' ) );
		remove_action( Playlist_Index::BUILD_HOOK, array( Playlist_Index::class, 'build' ) );
	}
}
