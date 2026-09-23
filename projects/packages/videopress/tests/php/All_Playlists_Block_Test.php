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
	 * Clean up any block registration and fixture the test created.
	 */
	protected function tear_down() {
		\WP_Block_Supports::$block_to_render = null;
		delete_option( Playlist_Index::OPTION_NAME );

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
	 * Store the given playlists in the index.
	 *
	 * @param array $playlists Records keyed by playlist key.
	 */
	private function seed_index( $playlists ) {
		update_option( Playlist_Index::OPTION_NAME, $playlists, false );
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
	 * Rendering without playlists returns an empty string.
	 */
	public function test_render_returns_empty_without_playlists() {
		$this->assertSame( '', All_Playlists_Block::render( array() ) );

		$this->seed_index( array( 'broken' => 'not a record' ) );
		$this->assertSame( '', All_Playlists_Block::render( array( 'layout' => 'list' ) ) );
	}

	/**
	 * Every indexed playlist is listed with its escaped title, description and count.
	 */
	public function test_render_lists_the_indexed_playlists() {
		$this->seed_index(
			array(
				'summer'  => array(
					'title'       => 'Summer <trip>',
					'description' => 'Beach & sun',
					'videos'      => array( array( 'guid' => 'abcDEF12' ), array( 'guid' => 'ghiJKL34' ) ),
					'post_id'     => 1,
				),
				'no-name' => array(
					'title'       => '',
					'description' => '',
					'videos'      => array(),
					'post_id'     => 2,
				),
			)
		);

		$markup = All_Playlists_Block::render( array( 'layout' => 'grid' ) );

		$this->assertStringContainsString( 'videopress-all-playlists is-layout-grid', $markup );
		$this->assertSame( 2, substr_count( $markup, 'class="videopress-all-playlists__item"' ) );
		$this->assertStringContainsString( 'data-playlist="summer"', $markup );
		$this->assertStringContainsString( 'Summer &lt;trip&gt;', $markup );
		$this->assertStringContainsString( '<p class="videopress-all-playlists__description">Beach &amp; sun</p>', $markup );
		$this->assertStringContainsString( '2 videos', $markup );
		$this->assertStringContainsString( 'Untitled playlist', $markup );
		$this->assertStringContainsString( '0 videos', $markup );
		$this->assertSame( 1, substr_count( $markup, 'videopress-all-playlists__description' ) );
	}

	/**
	 * The list layout is honored and unknown layouts fall back to the grid.
	 */
	public function test_render_applies_the_layout() {
		$this->seed_index(
			array(
				'one' => array(
					'title'       => 'One',
					'description' => '',
					'videos'      => array(),
					'post_id'     => 1,
				),
			)
		);

		$this->assertStringContainsString(
			'is-layout-list',
			All_Playlists_Block::render( array( 'layout' => 'list' ) )
		);
		$this->assertStringContainsString(
			'is-layout-grid',
			All_Playlists_Block::render( array( 'layout' => 'masonry' ) )
		);
	}
}
