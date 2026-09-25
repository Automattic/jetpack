<?php
/**
 * Tests for the All Playlists block registration and render callback.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\VideoPress\All_Playlists_Block;
use Automattic\Jetpack\VideoPress\Initializer as VideoPress_Initializer;
use Automattic\Jetpack\VideoPress\Playlist_Index;
use WorDBless\BaseTestCase;

/**
 * Test suite for All_Playlists_Block.
 */
class All_Playlists_Block_Test extends BaseTestCase {

	/**
	 * Directories holding the block.json fixtures written for registration tests.
	 *
	 * @var string[]
	 */
	private $fixture_dirs = array();

	/**
	 * Give render calls a block context, as do_blocks() would.
	 */
	protected function set_up() {
		\WP_Block_Supports::$block_to_render = array(
			'blockName' => All_Playlists_Block::BLOCK_NAME,
			'attrs'     => array(),
		);
		delete_option( Playlist_Index::OPTION_NAME );
	}

	/**
	 * Clean up any block registration, request state and fixture the test created.
	 */
	protected function tear_down() {
		\WP_Block_Supports::$block_to_render = null;
		delete_option( Playlist_Index::OPTION_NAME );
		unset( $_GET[ All_Playlists_Block::PAGE_QUERY_ARG ] );

		$registry = \WP_Block_Type_Registry::get_instance();
		foreach ( array( All_Playlists_Block::BLOCK_NAME, Playlist_Index::BLOCK_NAME ) as $name ) {
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
	 * Write a minimal block.json fixture for the given block name.
	 *
	 * @param string $name Block name.
	 *
	 * @return string Path to the fixture.
	 */
	private function write_fixture( $name ) {
		// register_block_type() only accepts metadata files named block.json.
		$dir = get_temp_dir() . 'all-playlists-block-' . wp_generate_password( 8, false );
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
	 * Create a published post to be a playlist's source.
	 *
	 * @param string $date Publish date, Y-m-d H:i:s.
	 *
	 * @return int Post id.
	 */
	private function create_post( $date = '2026-01-01 10:00:00' ) {
		return wp_insert_post(
			array(
				'post_title'    => 'Source',
				'post_content'  => 'Content',
				'post_status'   => 'publish',
				'post_date'     => $date,
				'post_date_gmt' => $date,
			)
		);
	}

	/**
	 * Build an index record.
	 *
	 * @param string $title   Playlist title.
	 * @param int    $post_id Source post id.
	 * @param int    $videos  Number of videos, each 10 minutes long.
	 * @param string $description Playlist description.
	 *
	 * @return array Record.
	 */
	private function record( $title, $post_id, $videos = 1, $description = '' ) {
		$entries = array();
		for ( $i = 0; $i < $videos; $i++ ) {
			$entries[] = array(
				'guid'       => 'guid' . str_pad( (string) $i, 4, '0', STR_PAD_LEFT ),
				'durationMs' => 600000,
				'height'     => 1080,
			);
		}

		return array(
			'title'       => $title,
			'description' => $description,
			'videos'      => $entries,
			'post_id'     => $post_id,
		);
	}

	/**
	 * Store the given playlists in the index.
	 *
	 * @param array $playlists Records keyed by playlist key.
	 */
	private function seed_index( $playlists ) {
		update_option( Playlist_Index::OPTION_NAME, $playlists, false );
	}

	/**
	 * Titles in the order the markup lists them.
	 *
	 * @param string $markup Rendered block.
	 *
	 * @return string[]
	 */
	private function titles_in( $markup ) {
		preg_match_all( '/videopress-all-playlists__title"><a [^>]*>([^<]*)<\/a>/', $markup, $matches );

		return $matches[1];
	}

	/**
	 * The block is not registered until the playlist block it lists is.
	 */
	public function test_register_requires_the_playlist_block() {
		All_Playlists_Block::register( $this->write_fixture( All_Playlists_Block::BLOCK_NAME ) );

		$this->assertFalse(
			\WP_Block_Type_Registry::get_instance()->is_registered( All_Playlists_Block::BLOCK_NAME )
		);
	}

	/**
	 * With the playlist block registered, the block registers with its render callback.
	 */
	public function test_register_registers_the_block() {
		register_block_type( $this->write_fixture( Playlist_Index::BLOCK_NAME ) );

		VideoPress_Initializer::register_videopress_all_playlists_block(
			$this->write_fixture( All_Playlists_Block::BLOCK_NAME )
		);

		$block_type = \WP_Block_Type_Registry::get_instance()->get_registered( All_Playlists_Block::BLOCK_NAME );
		$this->assertNotNull( $block_type );
		$this->assertSame( array( All_Playlists_Block::class, 'render' ), $block_type->render_callback );
	}

	/**
	 * Attributes are normalized: unknown values fall back, numbers are clamped.
	 */
	public function test_settings_normalizes_attributes() {
		$this->assertSame(
			array(
				'layout'             => 'gallery',
				'columns'            => 3,
				'per_page'           => 6,
				'order_by'           => 'newest',
				'show_description'   => true,
				'show_video_count'   => true,
				'show_total_runtime' => false,
				'pagination'         => 'numbered',
			),
			All_Playlists_Block::settings( 'nope' )
		);

		$settings = All_Playlists_Block::settings(
			array(
				'layout'           => 'list',
				'columns'          => 99,
				'perPage'          => 0,
				'orderBy'          => 'random',
				'showDescription'  => false,
				'showTotalRuntime' => 1,
				'pagination'       => 'load-more',
			)
		);
		$this->assertSame( 'list', $settings['layout'] );
		$this->assertSame( All_Playlists_Block::MAX_COLUMNS, $settings['columns'] );
		$this->assertSame( All_Playlists_Block::MIN_PER_PAGE, $settings['per_page'] );
		$this->assertSame( 'newest', $settings['order_by'] );
		$this->assertFalse( $settings['show_description'] );
		$this->assertTrue( $settings['show_total_runtime'] );
		$this->assertSame( 'load-more', $settings['pagination'] );
	}

	/**
	 * Rendering without playlists returns an empty string.
	 */
	public function test_render_returns_empty_without_playlists() {
		$this->assertSame( '', All_Playlists_Block::render( array() ) );

		$this->seed_index( array( 'broken' => 'not a record' ) );
		$this->assertSame( '', All_Playlists_Block::render( array( 'layout' => 'list' ) ) );
	}

	/**
	 * Every indexed playlist becomes a card linking to its post, with the
	 * escaped title and description, the badge and the index totals.
	 */
	public function test_render_lists_the_indexed_playlists() {
		$post_id = $this->create_post();
		$this->seed_index(
			array(
				'summer'  => $this->record( 'Summer <trip>', $post_id, 2, 'Beach & sun' ),
				'no-name' => array(
					'title'       => '',
					'description' => '',
					'videos'      => array(),
					'post_id'     => 999999,
				),
			)
		);

		$markup = All_Playlists_Block::render( array( 'columns' => 4 ) );

		$this->assertStringContainsString( 'videopress-all-playlists is-layout-gallery is-pagination-numbered', $markup );
		$this->assertStringContainsString( '--vpap-columns:4"', $markup );
		$this->assertStringContainsString( 'data-playlist-total="2"', $markup );
		$this->assertStringContainsString( 'data-video-total="2"', $markup );
		$this->assertStringContainsString( '<div class="videopress-all-playlists__header"><h2 class="videopress-all-playlists__heading">Playlists</h2>', $markup );
		$this->assertStringContainsString( '<span class="videopress-all-playlists__summary">2 playlists</span>', $markup );
		$this->assertSame( 2, substr_count( $markup, 'class="videopress-all-playlists__item ' ) );

		// The playlist with a source post links to it and loads its first video's poster.
		$this->assertStringContainsString( 'data-playlist="summer"', $markup );
		$this->assertStringContainsString( 'href="' . esc_url( get_permalink( $post_id ) ) . '"', $markup );
		$this->assertStringContainsString( 'data-guid="guid0000"', $markup );
		$this->assertStringContainsString( 'is-poster-loading', $markup );
		$this->assertStringContainsString( 'Summer &lt;trip&gt;', $markup );
		$this->assertStringContainsString( '<p class="videopress-all-playlists__description">Beach &amp; sun</p>', $markup );
		$this->assertStringContainsString( '2 videos</span>', $markup );
		$this->assertStringContainsString( 'View full playlist →', $markup );
		$this->assertStringContainsString( 'No poster available', $markup );
		$this->assertStringContainsString( 'First video is private or was deleted.', $markup );

		// The playlist whose post is gone has no link, no poster to load and a fallback title.
		$this->assertStringContainsString( 'is-poster-missing', $markup );
		$this->assertStringContainsString( '<h3 class="videopress-all-playlists__title">Untitled playlist</h3>', $markup );
		$this->assertStringContainsString( '0 videos</span>', $markup );
		$this->assertSame( 1, substr_count( $markup, 'videopress-all-playlists__link' ) );

		// Runtime is off by default; no pagination for a single page.
		$this->assertStringNotContainsString( 'videopress-all-playlists__runtime', $markup );
		$this->assertStringNotContainsString( 'videopress-all-playlists__pagination', $markup );
		$this->assertStringNotContainsString( 'videopress-all-playlists__load-more', $markup );
	}

	/**
	 * The saved heading block takes the fallback heading's place in the header.
	 */
	public function test_render_uses_the_saved_heading_block() {
		$this->seed_index( array( 'one' => $this->record( 'One', $this->create_post() ) ) );
		$heading = '<h3 class="wp-block-heading has-vivid-red-color has-text-color">My <em>videos</em></h3>';

		$markup = All_Playlists_Block::render( array(), "\n" . $heading . "\n" );

		$this->assertStringContainsString( '<div class="videopress-all-playlists__header">' . $heading . '<span class="videopress-all-playlists__summary">', $markup );
		$this->assertStringNotContainsString( 'videopress-all-playlists__heading', $markup );
	}

	/**
	 * Typography and color set on the block reach the wrapper as variables the
	 * stylesheet applies to the headings; unsafe values are dropped.
	 */
	public function test_render_forwards_block_styles_to_the_headings() {
		$this->seed_index( array( 'one' => $this->record( 'One', $this->create_post() ) ) );

		$markup = All_Playlists_Block::render(
			array(
				'fontFamily' => 'heading',
				'fontSize'   => 'large',
				'style'      => array(
					'typography' => array(
						'fontStyle'  => 'italic',
						'fontWeight' => '700; color: red',
						'lineHeight' => 1.4,
					),
					'color'      => array( 'text' => 'var:preset|color|primary' ),
				),
			)
		);

		foreach ( array( 'font-family', 'font-size', 'font-style', 'line-height', 'color' ) as $property ) {
			$this->assertStringContainsString( 'has-vpap-' . $property, $markup );
		}
		$this->assertStringNotContainsString( 'has-vpap-font-weight', $markup );
		$this->assertStringContainsString( '--vpap-font-family:var(--wp--preset--font-family--heading);', $markup );
		$this->assertStringContainsString( '--vpap-font-size:var(--wp--preset--font-size--large);', $markup );
		$this->assertStringContainsString( '--vpap-font-style:italic;', $markup );
		$this->assertStringContainsString( '--vpap-line-height:1.4;', $markup );
		$this->assertStringContainsString( '--vpap-color:var(--wp--preset--color--primary)', $markup );
		$this->assertStringNotContainsString( 'color: red', $markup );

		$plain = All_Playlists_Block::render( array() );
		$this->assertStringNotContainsString( 'has-vpap-', $plain );
		$this->assertStringNotContainsString( '--vpap-font', $plain );
	}

	/**
	 * Description and badge can be hidden, and the total runtime shown.
	 */
	public function test_render_honors_the_per_card_toggles() {
		$this->seed_index( array( 'one' => $this->record( 'One', $this->create_post(), 7, 'Text' ) ) );

		$markup = All_Playlists_Block::render(
			array(
				'showDescription'  => false,
				'showVideoCount'   => false,
				'showTotalRuntime' => true,
			)
		);

		$this->assertStringNotContainsString( 'videopress-all-playlists__description', $markup );
		$this->assertStringNotContainsString( 'videopress-all-playlists__badge', $markup );
		$this->assertStringContainsString( '<span class="videopress-all-playlists__runtime">1 hr 10 min</span>', $markup );
	}

	/**
	 * Playlists are ordered by their post's date, or by title.
	 */
	public function test_render_orders_playlists() {
		$this->seed_index(
			array(
				'b' => $this->record( 'Bravo', $this->create_post( '2026-02-01 10:00:00' ) ),
				'c' => $this->record( 'charlie', $this->create_post( '2026-03-01 10:00:00' ) ),
				'a' => $this->record( 'Alpha', $this->create_post( '2026-01-01 10:00:00' ) ),
				'z' => $this->record( 'Zulu', 999999 ),
			)
		);

		$this->assertSame(
			array( 'charlie', 'Bravo', 'Alpha' ),
			$this->titles_in( All_Playlists_Block::render( array() ) )
		);
		$this->assertSame(
			array( 'Alpha', 'Bravo', 'charlie' ),
			$this->titles_in( All_Playlists_Block::render( array( 'orderBy' => 'oldest' ) ) )
		);
		$this->assertSame(
			array( 'Alpha', 'Bravo', 'charlie' ),
			$this->titles_in( All_Playlists_Block::render( array( 'orderBy' => 'title' ) ) )
		);
		// The playlist without a post is listed last either way.
		foreach ( array( 'newest', 'oldest' ) as $order ) {
			$markup = All_Playlists_Block::render( array( 'orderBy' => $order ) );
			$this->assertGreaterThan( strrpos( $markup, 'charlie' ), strpos( $markup, 'Zulu' ) );
		}
	}

	/**
	 * Numbered pagination renders one page of cards plus the page links, and
	 * follows the page query argument.
	 */
	public function test_render_numbered_pagination() {
		$this->seed_index(
			array(
				'a' => $this->record( 'Alpha', $this->create_post( '2026-03-01 10:00:00' ) ),
				'b' => $this->record( 'Bravo', $this->create_post( '2026-02-01 10:00:00' ) ),
				'c' => $this->record( 'Charlie', $this->create_post( '2026-01-01 10:00:00' ) ),
			)
		);

		$markup = All_Playlists_Block::render( array( 'perPage' => 2 ) );

		$this->assertSame( array( 'Alpha', 'Bravo' ), $this->titles_in( $markup ) );
		$this->assertStringContainsString( '<nav class="videopress-all-playlists__pagination"', $markup );
		$this->assertStringContainsString( 'is-current" aria-current="page">1</span>', $markup );
		$this->assertStringContainsString( 'playlists-page=2">2</a>', $markup );
		$this->assertStringContainsString( 'videopress-all-playlists__page--prev is-disabled', $markup );
		$this->assertStringContainsString( 'playlists-page=2">Next →</a>', $markup );
		$this->assertStringNotContainsString( ' hidden>', $markup );

		$_GET[ All_Playlists_Block::PAGE_QUERY_ARG ] = '2';
		$markup                                      = All_Playlists_Block::render( array( 'perPage' => 2 ) );

		$this->assertSame( array( 'Charlie' ), $this->titles_in( $markup ) );
		$this->assertStringContainsString( 'is-current" aria-current="page">2</span>', $markup );
		$this->assertStringContainsString( 'videopress-all-playlists__page--next is-disabled', $markup );
		$this->assertStringContainsString( 'videopress-all-playlists__page--prev" href=', $markup );

		// A page past the end shows the last page.
		$_GET[ All_Playlists_Block::PAGE_QUERY_ARG ] = '9';
		$this->assertSame( array( 'Charlie' ), $this->titles_in( All_Playlists_Block::render( array( 'perPage' => 2 ) ) ) );
	}

	/**
	 * "Load more" pagination renders every card, hides the later pages and
	 * offers the button the view script drives.
	 */
	public function test_render_load_more_pagination() {
		$this->seed_index(
			array(
				'a' => $this->record( 'Alpha', $this->create_post( '2026-03-01 10:00:00' ) ),
				'b' => $this->record( 'Bravo', $this->create_post( '2026-02-01 10:00:00' ) ),
				'c' => $this->record( 'Charlie', $this->create_post( '2026-01-01 10:00:00' ) ),
			)
		);

		$markup = All_Playlists_Block::render(
			array(
				'layout'     => 'list',
				'perPage'    => 2,
				'pagination' => 'load-more',
			)
		);

		$this->assertSame( array( 'Alpha', 'Bravo', 'Charlie' ), $this->titles_in( $markup ) );
		$this->assertStringContainsString( 'is-layout-list is-pagination-load-more', $markup );
		$this->assertStringContainsString( 'data-per-page="2"', $markup );
		$this->assertStringContainsString( 'data-summary="Showing %1$s of %2$s"', $markup );
		$this->assertStringContainsString( '<span class="videopress-all-playlists__summary">Showing 2 of 3</span>', $markup );
		$this->assertStringContainsString( 'data-page="1">', $markup );
		$this->assertStringContainsString( 'data-page="2" hidden>', $markup );
		$this->assertSame( 1, substr_count( $markup, ' hidden>' ) );
		$this->assertStringContainsString( 'data-label="Load %s more">Load 1 more</button>', $markup );
		$this->assertStringNotContainsString( 'videopress-all-playlists__pagination', $markup );
	}
}
