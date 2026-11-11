<?php
/**
 * Tests for series playlists.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\VideoPress\Channel;
use Automattic\Jetpack\VideoPress\Channel_Data;
use Automattic\Jetpack\VideoPress\Classification;
use Automattic\Jetpack\VideoPress\Playlist_Index;
use Automattic\Jetpack\VideoPress\Playlist_Manager;
use Automattic\Jetpack\VideoPress\Series_Playlist_Adapter;
use WorDBless\BaseTestCase;
use WP_Error;

/**
 * Test suite for Series_Playlist_Adapter.
 */
class Series_Playlist_Adapter_Test extends BaseTestCase {

	/**
	 * Channel videos by series slug, as the stubbed channel list returns them.
	 *
	 * @var array<string, array[]>
	 */
	private $series_videos = array();

	/**
	 * Register the taxonomies and answer channel lists from $series_videos. WorDBless has no
	 * terms table and no tax queries, and kses would slash block attribute JSON.
	 */
	protected function set_up() {
		Classification::register();
		kses_remove_filters();
		delete_option( Playlist_Index::OPTION_NAME );
		Channel_Data::reset();
		add_filter( 'videopress_channel_videos', array( $this, 'stub_channel_videos' ), 10, 3 );
		$this->series_term( 7, 'town-hall', 'Town Hall', 'Monthly all-hands.' );
	}

	/**
	 * Clean up.
	 */
	protected function tear_down() {
		kses_init_filters();
		delete_option( Playlist_Index::OPTION_NAME );
		remove_all_filters( 'videopress_channel_videos' );
		remove_action( 'shutdown', array( Series_Playlist_Adapter::class, 'refresh_index' ) );
		Channel_Data::reset();
		$this->series_videos = array();
	}

	/**
	 * The channel videos of the selected series.
	 *
	 * @param array|null $videos Short-circuit value.
	 * @param string     $search Search term.
	 * @param array      $terms  Classification selection.
	 * @return array|null
	 */
	public function stub_channel_videos( $videos, $search, $terms ) {
		$slug = $terms[ Classification::SERIES ][0] ?? '';
		return $this->series_videos[ $slug ] ?? array();
	}

	/**
	 * Put a series term in the object cache, where get_term() finds it.
	 *
	 * @param int    $id          Term ID.
	 * @param string $slug        Slug.
	 * @param string $name        Name.
	 * @param string $description Description.
	 */
	private function series_term( $id, $slug, $name, $description = '' ) {
		wp_cache_set(
			$id,
			(object) array(
				'term_id'          => $id,
				'name'             => $name,
				'slug'             => $slug,
				'term_group'       => 0,
				'term_taxonomy_id' => $id,
				'taxonomy'         => Classification::SERIES,
				'description'      => $description,
				'parent'           => 0,
				'count'            => 0,
				'filter'           => 'raw',
			),
			'terms'
		);
	}

	/**
	 * A channel video record.
	 *
	 * @param string $guid GUID.
	 * @return array
	 */
	private function video( $guid ) {
		return array(
			'id'          => 1,
			'guid'        => $guid,
			'durationMs'  => 60000,
			'height'      => 720,
			'publishedAt' => 1700000000,
		);
	}

	/**
	 * Publish a post holding Video Playlist blocks and index it.
	 *
	 * @param array[] $blocks Attributes of each block.
	 * @return int Post ID.
	 */
	private function publish( array $blocks ) {
		$content = '';
		foreach ( $blocks as $attrs ) {
			$content .= '<!-- wp:videopress/playlist ' . wp_json_encode( $attrs, JSON_UNESCAPED_SLASHES ) . ' /-->';
		}
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Series',
				'post_content' => $content,
				'post_status'  => 'publish',
			)
		);
		Playlist_Index::index_post( $post_id );
		return $post_id;
	}

	public function test_index_stores_a_series_block_as_a_series_record() {
		$this->series_videos['town-hall'] = array( $this->video( 'aaaaaaa1' ), $this->video( 'aaaaaaa2' ) );

		$post_id = $this->publish(
			array(
				array(
					'playlistId'     => 'th',
					'source'         => 'series',
					'sourceSeriesId' => 7,
				),
				array(
					'playlistId' => 'mine',
					'videos'     => array( array( 'guid' => 'bbbbbbb1' ) ),
				),
				array(
					'source'           => 'index',
					'sourcePlaylistId' => 'mine',
				),
			)
		);
		$index   = Playlist_Index::get_playlists();

		$this->assertSame( array( 'th', 'mine' ), array_keys( $index ), 'Series playlists are indexed; blocks showing another playlist are not.' );
		$this->assertSame(
			array(
				'type'        => 'series',
				'series'      => 7,
				'title'       => 'Town Hall',
				'description' => 'Monthly all-hands.',
				'videos'      => array(
					array(
						'guid'       => 'aaaaaaa1',
						'durationMs' => 60000,
						'height'     => 720,
					),
					array(
						'guid'       => 'aaaaaaa2',
						'durationMs' => 60000,
						'height'     => 720,
					),
				),
				'post_id'     => $post_id,
			),
			$index['th']
		);
		$this->assertArrayNotHasKey( 'type', $index['mine'] );
	}

	public function test_series_playlists_render_the_current_videos() {
		$this->series_videos['town-hall'] = array( $this->video( 'aaaaaaa1' ) );
		$block                            = array(
			'playlistId'     => 'th',
			'playlistTitle'  => 'All hands',
			'source'         => 'series',
			'sourceSeriesId' => 7,
		);
		$this->publish( array( $block ) );

		$this->series_videos['town-hall'] = array( $this->video( 'aaaaaaa2' ), $this->video( 'aaaaaaa1' ) );
		Channel_Data::reset();

		$record = Channel::playlist_record( 'th' );
		$this->assertIsArray( $record );
		$this->assertSame( array( 'aaaaaaa2', 'aaaaaaa1' ), array_column( $record['videos'], 'guid' ) );
		$this->assertSame( 'series', $record['type'] );
		$this->assertSame( 7, $record['series'] );

		$rendered = Channel::playlist_source_block(
			array(
				'blockName' => Playlist_Index::BLOCK_NAME,
				'attrs'     => $block,
			)
		);
		$this->assertSame( array( 'aaaaaaa2', 'aaaaaaa1' ), array_column( $rendered['attrs']['videos'], 'guid' ) );
		$this->assertSame( 'All hands', $rendered['attrs']['playlistTitle'], 'The block’s own title wins over the series name.' );
		$this->assertSame( 'th', $rendered['attrs']['videopressListKey'] );
	}

	public function test_a_missing_series_renders_no_videos() {
		$rendered = Channel::playlist_source_block(
			array(
				'blockName' => Playlist_Index::BLOCK_NAME,
				'attrs'     => array(
					'source'         => 'series',
					'sourceSeriesId' => 999,
					'videos'         => array( array( 'guid' => 'aaaaaaa1' ) ),
				),
			)
		);

		$this->assertSame( array(), $rendered['attrs']['videos'] );
	}

	public function test_series_changes_refresh_the_index_once_per_request() {
		$this->series_videos['town-hall'] = array( $this->video( 'aaaaaaa1' ) );
		$this->publish(
			array(
				array(
					'playlistId'     => 'th',
					'source'         => 'series',
					'sourceSeriesId' => 7,
				),
			)
		);

		Series_Playlist_Adapter::object_terms_changed( 1, array(), array( 3 ), Classification::TOPIC, false, array() );
		Series_Playlist_Adapter::object_terms_changed( 1, array(), array( 7 ), Classification::SERIES, false, array( 7 ) );
		$this->assertFalse( has_action( 'shutdown', array( Series_Playlist_Adapter::class, 'refresh_index' ) ), 'Other taxonomies and unchanged series leave the index alone.' );

		Series_Playlist_Adapter::object_terms_changed( 2, array(), array( 7 ), Classification::SERIES, false, array() );
		Series_Playlist_Adapter::term_relationships_deleted( 3, array( 7 ), Classification::SERIES );
		$this->assertSame( 10, has_action( 'shutdown', array( Series_Playlist_Adapter::class, 'refresh_index' ) ) );

		$this->series_videos['town-hall'][] = $this->video( 'aaaaaaa2' );
		Series_Playlist_Adapter::refresh_index();

		$this->assertSame( array( 'aaaaaaa1', 'aaaaaaa2' ), array_column( Playlist_Index::get_playlists()['th']['videos'], 'guid' ) );
		$this->assertFalse( has_action( 'shutdown', array( Series_Playlist_Adapter::class, 'refresh_index' ) ) );
	}

	public function test_the_dashboard_lists_series_playlists_and_keeps_their_videos_read_only() {
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'admin',
					'user_pass'  => 'pass',
					'role'       => 'administrator',
				)
			)
		);
		$this->series_videos['town-hall'] = array( $this->video( 'aaaaaaa1' ) );
		$this->publish(
			array(
				array(
					'playlistId'     => 'th',
					'source'         => 'series',
					'sourceSeriesId' => 7,
				),
			)
		);

		$item = Playlist_Manager::prepare_item( Playlist_Manager::find_record( 'th' ) );
		$this->assertSame( 'series', $item['type'] );
		$this->assertSame( 7, $item['series'] );
		$this->assertSame( 1, $item['videoCount'] );

		$result = Playlist_Manager::update( 'th', array( 'videos' => array() ) );
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'videopress_playlist_series_videos', $result->get_error_code() );
	}
}
