<?php
/**
 * Tests for the Video Playlist block registration and render callback.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\VideoPress\Initializer as VideoPress_Initializer;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use WorDBless\BaseTestCase;

/**
 * Test suite for Initializer::register_videopress_playlist_block and
 * Initializer::render_videopress_playlist_block.
 *
 * Runs in separate processes because rendering loads Jwt_Token_Bridge, which
 * other suites (Uploader_Test) replace with a Mockery alias mock that requires
 * the real class to not be loaded yet.
 *
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class Playlist_Block_Test extends BaseTestCase {

	/**
	 * Directory holding the block.json fixture written for registration tests.
	 *
	 * @var string|null
	 */
	private $fixture_dir = null;

	/**
	 * Give render calls a block context, as do_blocks() would.
	 */
	protected function set_up() {
		\WP_Block_Supports::$block_to_render = array(
			'blockName' => 'videopress/playlist',
			'attrs'     => array(),
		);
	}

	/**
	 * Clean up any block registration and fixture the test created.
	 */
	protected function tear_down() {
		\WP_Block_Supports::$block_to_render = null;

		$registry = \WP_Block_Type_Registry::get_instance();
		if ( $registry->is_registered( 'videopress/playlist' ) ) {
			unregister_block_type( 'videopress/playlist' );
		}

		if ( $this->fixture_dir && file_exists( $this->fixture_dir . '/block.json' ) ) {
			wp_delete_file( $this->fixture_dir . '/block.json' );
			rmdir( $this->fixture_dir ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir
			$this->fixture_dir = null;
		}
	}

	/**
	 * Build block attributes with the given overrides applied.
	 *
	 * @param array $overrides Attribute overrides.
	 *
	 * @return array Attributes.
	 */
	private function attributes( $overrides = array() ) {
		return array_merge(
			array(
				'videos' => array(
					array(
						'guid'       => 'abcDEF12',
						'title'      => 'Kiln loading, start to finish',
						'durationMs' => 724000,
						'height'     => 1080,
						'poster'     => 'https://example.com/poster.jpg',
					),
					array(
						'guid'       => 'ghiJKL34',
						'title'      => 'Wedging clay by hand',
						'durationMs' => 401000,
						'height'     => 2160,
						'poster'     => '',
					),
				),
			),
			$overrides
		);
	}

	/**
	 * Rendering without playable entries returns an empty string.
	 */
	public function test_render_returns_empty_without_videos() {
		$this->assertSame( '', VideoPress_Initializer::render_videopress_playlist_block( array() ) );
		$this->assertSame(
			'',
			VideoPress_Initializer::render_videopress_playlist_block( array( 'videos' => array() ) )
		);
		$this->assertSame(
			'',
			VideoPress_Initializer::render_videopress_playlist_block( array( 'videos' => 'nope' ) )
		);
	}

	/**
	 * Entries without a valid 8-character alphanumeric GUID are dropped.
	 */
	public function test_render_drops_invalid_guids() {
		$attributes = array(
			'videos' => array(
				array( 'guid' => 'has spaces' ),
				array( 'guid' => '"><script>' ),
				array( 'guid' => 'short' ),
				array( 'title' => 'No GUID at all' ),
			),
		);

		$this->assertSame( '', VideoPress_Initializer::render_videopress_playlist_block( $attributes ) );

		$attributes['videos'][] = array( 'guid' => 'abcDEF12' );
		$markup                 = VideoPress_Initializer::render_videopress_playlist_block( $attributes );

		$this->assertStringContainsString( 'data-guid="abcDEF12"', $markup );
		$this->assertSame( 1, substr_count( $markup, 'data-guid=' ) );
		$this->assertStringContainsString( '1 video<', $markup );
	}

	/**
	 * The happy path renders the player, the entry list and the metadata.
	 */
	public function test_render_outputs_player_and_entries() {
		$markup = VideoPress_Initializer::render_videopress_playlist_block( $this->attributes() );

		// Player: first entry loaded without autoplay.
		$this->assertStringContainsString( 'videopress.com/embed/abcDEF12', $markup );
		$this->assertStringContainsString( 'autoPlay=0', $markup );

		// Entries carry the data the view script needs.
		$this->assertStringContainsString( 'data-guid="abcDEF12"', $markup );
		$this->assertStringContainsString( 'data-guid="ghiJKL34"', $markup );
		$this->assertStringContainsString( 'autoPlay=1', $markup );
		$this->assertStringContainsString( 'data-position="2 of 2"', $markup );

		// First entry is marked current.
		$this->assertStringContainsString( 'videopress-playlist__select is-current', $markup );
		$this->assertStringContainsString( 'aria-current="true"', $markup );

		// Header and metadata.
		$this->assertStringContainsString( '2 videos', $markup );
		$this->assertStringContainsString( '19 min', $markup );
		$this->assertStringContainsString( '1080p', $markup );
		$this->assertStringContainsString( '4K', $markup );
		$this->assertStringContainsString( '12:04', $markup );
		$this->assertStringContainsString( 'https://example.com/poster.jpg', $markup );
	}

	/**
	 * Attribute-controlled text is escaped.
	 */
	public function test_render_escapes_titles() {
		$attributes = array(
			'videos' => array(
				array(
					'guid'  => 'abcDEF12',
					'title' => '<script>alert(1)</script>',
				),
			),
		);

		$markup = VideoPress_Initializer::render_videopress_playlist_block( $attributes );

		$this->assertStringNotContainsString( '<script>alert(1)</script>', $markup );
		$this->assertStringContainsString( '&lt;script&gt;', $markup );
	}

	/**
	 * Poster URLs that aren't URLs don't survive escaping into an img tag.
	 */
	public function test_render_escapes_poster_url() {
		$attributes = array(
			'videos' => array(
				array(
					'guid'   => 'abcDEF12',
					// phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript
					'poster' => '"><script src="https://evil.example/x.js"></script>',
				),
			),
		);

		$markup = VideoPress_Initializer::render_videopress_playlist_block( $attributes );

		$this->assertStringNotContainsString( '<script', $markup );
		$this->assertStringNotContainsString( 'evil.example', $markup );
	}

	/**
	 * Layout and dark-surface options map to wrapper classes.
	 */
	public function test_render_layout_and_dark_classes() {
		$default = VideoPress_Initializer::render_videopress_playlist_block( $this->attributes() );
		$this->assertStringContainsString( 'is-layout-side-rail', $default );
		$this->assertStringNotContainsString( 'is-dark', $default );

		$grid_dark = VideoPress_Initializer::render_videopress_playlist_block(
			$this->attributes(
				array(
					'layout'     => 'grid',
					'darkPlayer' => true,
				)
			)
		);
		$this->assertStringContainsString( 'is-layout-grid', $grid_dark );
		$this->assertStringContainsString( 'is-dark', $grid_dark );

		$bogus = VideoPress_Initializer::render_videopress_playlist_block(
			$this->attributes( array( 'layout' => 'sideways' ) )
		);
		$this->assertStringContainsString( 'is-layout-side-rail', $bogus );
	}

	/**
	 * Display toggles map to hide-* classes and the position-number markup.
	 */
	public function test_render_display_toggles() {
		$defaults = VideoPress_Initializer::render_videopress_playlist_block( $this->attributes() );
		$this->assertStringNotContainsString( 'hide-thumbnails', $defaults );
		$this->assertStringNotContainsString( 'videopress-playlist__entry-number', $defaults );

		$markup = VideoPress_Initializer::render_videopress_playlist_block(
			$this->attributes(
				array(
					'showThumbnail'      => false,
					'showTitle'          => false,
					'showResolution'     => false,
					'showDuration'       => false,
					'showTotalRuntime'   => false,
					'showPositionNumber' => true,
				)
			)
		);

		$this->assertStringContainsString( 'hide-thumbnails', $markup );
		$this->assertStringContainsString( 'hide-titles', $markup );
		$this->assertStringContainsString( 'hide-resolutions', $markup );
		$this->assertStringContainsString( 'hide-durations', $markup );
		$this->assertStringContainsString( 'hide-runtime', $markup );
		$this->assertStringContainsString( '<span class="videopress-playlist__entry-number">01</span>', $markup );
	}

	/**
	 * The autoplay-next flag is exposed to the view script as a data attribute.
	 */
	public function test_render_autoplay_next_flag() {
		$off = VideoPress_Initializer::render_videopress_playlist_block( $this->attributes() );
		$this->assertStringContainsString( 'data-autoplay-next="0"', $off );

		$on = VideoPress_Initializer::render_videopress_playlist_block(
			$this->attributes( array( 'autoplayNext' => true ) )
		);
		$this->assertStringContainsString( 'data-autoplay-next="1"', $on );
	}

	/**
	 * Registration reads the metadata file and registers the block once.
	 */
	public function test_register_videopress_playlist_block() {
		// register_block_type() only accepts metadata files named block.json.
		$this->fixture_dir = get_temp_dir() . 'playlist-block-' . wp_generate_password( 8, false );
		mkdir( $this->fixture_dir ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_mkdir
		file_put_contents( // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
			$this->fixture_dir . '/block.json',
			wp_json_encode(
				array(
					'apiVersion' => 3,
					'name'       => 'videopress/playlist',
					'title'      => 'Video Playlist',
				),
				JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
			)
		);

		VideoPress_Initializer::register_videopress_playlist_block( $this->fixture_dir . '/block.json' );

		$registry = \WP_Block_Type_Registry::get_instance();
		$this->assertTrue( $registry->is_registered( 'videopress/playlist' ) );

		$block_type = $registry->get_registered( 'videopress/playlist' );
		$this->assertSame(
			array( VideoPress_Initializer::class, 'render_videopress_playlist_block' ),
			$block_type->render_callback
		);

		// A second call must not fatal on the already-registered block.
		VideoPress_Initializer::register_videopress_playlist_block( $this->fixture_dir . '/block.json' );
		$this->assertTrue( $registry->is_registered( 'videopress/playlist' ) );
	}

	/**
	 * Registration bails quietly when the metadata file is missing.
	 */
	public function test_register_without_metadata_file_is_a_noop() {
		VideoPress_Initializer::register_videopress_playlist_block( '/nonexistent/block.json' );

		$this->assertFalse(
			\WP_Block_Type_Registry::get_instance()->is_registered( 'videopress/playlist' )
		);
	}

	/**
	 * Hour-long playlists format both timecodes and the long runtime with hours.
	 */
	public function test_render_formats_hour_long_durations() {
		$markup = VideoPress_Initializer::render_videopress_playlist_block(
			array(
				'videos' => array(
					array(
						'guid'       => 'abcDEF12',
						'title'      => 'Full workshop recording',
						'durationMs' => 4384000, // 1:13:04.
					),
				),
			)
		);

		$this->assertStringContainsString( '1:13:04', $markup );
		$this->assertStringContainsString( '1 hr 13 min', $markup );

		$markup = VideoPress_Initializer::render_videopress_playlist_block(
			array(
				'videos' => array(
					array(
						'guid'       => 'abcDEF12',
						'title'      => 'Two hours of throwing',
						'durationMs' => 7200000, // 2:00:00.
					),
				),
			)
		);

		$this->assertStringContainsString( '2:00:00', $markup );
		$this->assertStringContainsString( '2 hr', $markup );
	}

	/**
	 * Without an argument, registration reads the package build output.
	 */
	public function test_register_defaults_to_build_metadata() {
		VideoPress_Initializer::register_videopress_playlist_block();

		$initializer_dir = dirname( ( new \ReflectionClass( VideoPress_Initializer::class ) )->getFileName() );
		$build_metadata  = $initializer_dir . '/../build/block-editor/blocks/playlist/block.json';

		// Registered exactly when the package build output exists.
		$this->assertSame(
			file_exists( $build_metadata ),
			\WP_Block_Type_Registry::get_instance()->is_registered( 'videopress/playlist' )
		);
	}

	/**
	 * Metadata without a block name is not registered.
	 */
	public function test_register_skips_metadata_without_name() {
		$this->fixture_dir = get_temp_dir() . 'playlist-block-' . wp_generate_password( 8, false );
		mkdir( $this->fixture_dir ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_mkdir
		file_put_contents( // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
			$this->fixture_dir . '/block.json',
			'{}'
		);

		VideoPress_Initializer::register_videopress_playlist_block( $this->fixture_dir . '/block.json' );

		$this->assertFalse(
			\WP_Block_Type_Registry::get_instance()->is_registered( 'videopress/playlist' )
		);
	}

	/**
	 * With the Jetpack plugin active but the VideoPress module off (and no
	 * standalone plugin), the block is not registered at all.
	 *
	 * Runs in this test's separate process, so the fake Jetpack class doesn't leak.
	 */
	public function test_register_skips_when_videopress_module_is_inactive() {
		class_alias( \stdClass::class, 'Jetpack' );

		$this->fixture_dir = get_temp_dir() . 'playlist-block-' . wp_generate_password( 8, false );
		mkdir( $this->fixture_dir ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_mkdir
		file_put_contents( // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
			$this->fixture_dir . '/block.json',
			wp_json_encode(
				array(
					'apiVersion' => 3,
					'name'       => 'videopress/playlist',
					'title'      => 'Video Playlist',
				),
				JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
			)
		);

		VideoPress_Initializer::register_videopress_playlist_block( $this->fixture_dir . '/block.json' );

		$this->assertFalse(
			\WP_Block_Type_Registry::get_instance()->is_registered( 'videopress/playlist' )
		);
	}
}
