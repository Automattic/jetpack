<?php
/**
 * Tests for Initializer::render_videopress_playlist_block.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\VideoPress\Initializer as VideoPress_Initializer;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use WorDBless\BaseTestCase;

/**
 * Test suite for the VideoPress playlist block server-side rendering.
 *
 * Runs each test in a separate process: rendering enqueues the real
 * Jwt_Token_Bridge, which other tests in this suite replace with alias
 * mocks that require the class to be unloaded.
 *
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class Playlist_Block_Test extends BaseTestCase {

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		parent::tear_down();

		if ( \WP_Block_Type_Registry::get_instance()->is_registered( 'videopress/playlist' ) ) {
			\WP_Block_Type_Registry::get_instance()->unregister( 'videopress/playlist' );
		}
	}

	/**
	 * Write a block.json fixture for registration tests and return its path.
	 *
	 * The build output isn't present when the PHP suite runs in CI, so
	 * registration is exercised against a fixture instead.
	 *
	 * @param array $metadata Metadata to encode.
	 * @return string Path to the fixture file.
	 */
	private function create_metadata_fixture( $metadata ) {
		// register_block_type_from_metadata() requires the file to be named block.json.
		$dir = get_temp_dir() . uniqid( 'playlist-block-', true );
		mkdir( $dir ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_mkdir
		$file = $dir . '/block.json';
		file_put_contents( $file, wp_json_encode( $metadata, JSON_UNESCAPED_SLASHES ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents

		return $file;
	}

	/**
	 * Remove a fixture created by create_metadata_fixture().
	 *
	 * @param string $file Path returned by create_metadata_fixture().
	 */
	private function remove_metadata_fixture( $file ) {
		unlink( $file ); // phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
		rmdir( dirname( $file ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir
	}

	/**
	 * Render the playlist block through do_blocks() so block supports
	 * (wrapper class names) apply like on a real page.
	 *
	 * @param array $attributes Block attributes.
	 * @return string Rendered markup.
	 */
	private function render( $attributes ) {
		if ( ! \WP_Block_Type_Registry::get_instance()->is_registered( 'videopress/playlist' ) ) {
			register_block_type(
				'videopress/playlist',
				array(
					'render_callback' => array( VideoPress_Initializer::class, 'render_videopress_playlist_block' ),
				)
			);
		}

		// Empty attributes encode to `[]`, which the block parser rejects; omit them instead.
		$json = empty( $attributes ) ? '' : wp_json_encode( $attributes, JSON_UNESCAPED_SLASHES ) . ' ';
		return do_blocks( '<!-- wp:videopress/playlist ' . $json . '/-->' );
	}

	/** Tests that the block registers from metadata with the render callback wired. */
	public function test_registration_from_metadata() {
		$fixture = $this->create_metadata_fixture(
			array(
				'name'  => 'videopress/playlist',
				'title' => 'VideoPress Playlist',
			)
		);

		VideoPress_Initializer::register_videopress_playlist_block( $fixture );

		$registry = \WP_Block_Type_Registry::get_instance();
		$this->assertTrue( $registry->is_registered( 'videopress/playlist' ) );
		$this->assertSame(
			array( VideoPress_Initializer::class, 'render_videopress_playlist_block' ),
			$registry->get_registered( 'videopress/playlist' )->render_callback
		);

		// A second call must not fatal on (or duplicate) the existing registration.
		VideoPress_Initializer::register_videopress_playlist_block( $fixture );
		$this->assertTrue( $registry->is_registered( 'videopress/playlist' ) );

		$this->remove_metadata_fixture( $fixture );
	}

	/** Tests that registration is skipped when the metadata file is missing or unusable. */
	public function test_registration_skipped_without_usable_metadata() {
		$registry = \WP_Block_Type_Registry::get_instance();

		VideoPress_Initializer::register_videopress_playlist_block( '/nonexistent/block.json' );
		$this->assertFalse( $registry->is_registered( 'videopress/playlist' ) );

		/*
		 * The no-argument default reads the package build output. Whether or not
		 * a build is present where the suite runs, the call must not error, and
		 * any resulting registration must use the real block name.
		 */
		VideoPress_Initializer::register_videopress_playlist_block();
		if ( $registry->is_registered( 'videopress/playlist' ) ) {
			$registry->unregister( 'videopress/playlist' );
		}

		$nameless = $this->create_metadata_fixture( array( 'title' => 'No name' ) );
		VideoPress_Initializer::register_videopress_playlist_block( $nameless );
		$this->assertFalse( $registry->is_registered( 'videopress/playlist' ) );

		$this->remove_metadata_fixture( $nameless );
	}

	/** Tests that the player and playlist items are rendered. */
	public function test_renders_player_and_items() {
		$html = $this->render(
			array(
				'videos' => array(
					array(
						'guid'  => 'abcd1234',
						'title' => 'First video',
					),
					array( 'guid' => 'efgh5678' ),
				),
			)
		);

		$this->assertStringContainsString( 'wp-block-videopress-playlist', $html );

		// The player starts on the first video, without autoplay.
		$this->assertSame( 1, preg_match( '/<iframe[^>]+src="([^"]+)"/', $html, $matches ) );
		$this->assertStringContainsString( 'videopress.com/embed/abcd1234', $matches[1] );
		$this->assertStringContainsString( 'autoPlay=0', $matches[1] );

		// Each item carries an autoplaying embed URL for the click/advance handlers.
		$this->assertStringContainsString( 'data-guid="abcd1234"', $html );
		$this->assertStringContainsString( 'data-guid="efgh5678"', $html );
		$this->assertSame( 2, substr_count( $html, 'autoPlay=1' ) );

		// Titles fall back to a numbered label.
		$this->assertStringContainsString( 'First video', $html );
		$this->assertStringContainsString( 'Video 2', $html );

		// Sequence defaults: auto-advance on, loop off.
		$this->assertStringContainsString( 'data-auto-advance="1"', $html );
		$this->assertStringContainsString( 'data-loop="0"', $html );
	}

	/** Tests that items carry the placeholders the view script fills with live metadata. */
	public function test_render_includes_metadata_placeholders() {
		$html = $this->render(
			array( 'videos' => array( array( 'guid' => 'abcd1234' ) ) )
		);

		$this->assertStringContainsString( 'videopress-playlist__item-badge', $html );
		$this->assertStringContainsString( 'videopress-playlist__item-duration', $html );
		$this->assertStringContainsString( 'videopress-playlist__item-thumb', $html );
		$this->assertStringContainsString( 'videopress-playlist__header', $html );
	}

	/** Tests that stored metadata renders as initial content. */
	public function test_render_uses_stored_metadata() {
		$html = $this->render(
			array(
				'videos' => array(
					array(
						'guid'       => 'abcd1234',
						'title'      => 'Kiln loading',
						'durationMs' => 724000,
						'height'     => 1080,
						'poster'     => 'https://videos.files.wordpress.com/abcd1234/poster.jpg',
					),
					array(
						'guid'       => 'efgh5678',
						'durationMs' => 3660000,
						'height'     => 2160,
					),
				),
			)
		);

		$this->assertStringContainsString( '12:04', $html );
		$this->assertStringContainsString( '1080p', $html );
		$this->assertStringContainsString( '4K', $html );
		$this->assertStringContainsString( 'poster.jpg', $html );
		$this->assertStringContainsString( 'data-duration-ms="724000"', $html );
		// Header: count and long-form total runtime (724000 + 3660000 ms ≈ 1 hr 13 min).
		$this->assertStringContainsString( '2 videos', $html );
		$this->assertStringContainsString( '1 hr 13 min', $html );
	}

	/** Tests that layout, dark surface, and display toggles map to wrapper classes. */
	public function test_render_layout_and_display_classes() {
		$base = array( 'videos' => array( array( 'guid' => 'abcd1234' ) ) );

		$default_html = $this->render( $base );
		$this->assertStringContainsString( 'videopress-playlist--rail', $default_html );
		$this->assertStringNotContainsString( 'is-dark', $default_html );
		$this->assertStringNotContainsString( 'hide-thumbnails', $default_html );
		$this->assertStringNotContainsString( 'show-position', $default_html );

		$custom_html = $this->render(
			array_merge(
				$base,
				array(
					'layout'           => 'grid',
					'darkSurface'      => true,
					'showThumbnail'    => false,
					'showResolution'   => false,
					'showDuration'     => false,
					'showTitle'        => false,
					'showPosition'     => true,
					'showTotalRuntime' => false,
				)
			)
		);
		$this->assertStringContainsString( 'videopress-playlist--grid', $custom_html );
		$this->assertStringContainsString( 'is-dark', $custom_html );
		$this->assertStringContainsString( 'hide-thumbnails', $custom_html );
		$this->assertStringContainsString( 'hide-resolution', $custom_html );
		$this->assertStringContainsString( 'hide-duration', $custom_html );
		$this->assertStringContainsString( 'hide-titles', $custom_html );
		$this->assertStringContainsString( 'show-position', $custom_html );
		$this->assertStringContainsString( 'hide-runtime', $custom_html );

		// Unknown layout values fall back to the rail layout.
		$fallback_html = $this->render( array_merge( $base, array( 'layout' => 'bogus' ) ) );
		$this->assertStringContainsString( 'videopress-playlist--rail', $fallback_html );
	}

	/** Tests that autoAdvance and loop attributes reach the frontend dataset. */
	public function test_auto_advance_and_loop_attributes() {
		$html = $this->render(
			array(
				'videos'      => array( array( 'guid' => 'abcd1234' ) ),
				'autoAdvance' => false,
				'loop'        => true,
			)
		);

		$this->assertStringContainsString( 'data-auto-advance="0"', $html );
		$this->assertStringContainsString( 'data-loop="1"', $html );
	}

	/** Tests that entries without a valid 8-character GUID are dropped. */
	public function test_invalid_guids_are_dropped() {
		$html = $this->render(
			array(
				'videos' => array(
					array( 'guid' => '"><script>alert(1)</script>' ),
					array( 'guid' => 'short' ),
					'not-an-array-entry',
					array( 'title' => 'No guid at all' ),
					array( 'guid' => 'abcd1234' ),
				),
			)
		);

		$this->assertStringNotContainsString( '<script>alert(1)</script>', $html );
		$this->assertStringNotContainsString( 'short', $html );
		$this->assertSame( 1, substr_count( $html, 'data-src=' ) );
		$this->assertStringContainsString( 'data-guid="abcd1234"', $html );
	}

	/** Tests that video titles are escaped. */
	public function test_titles_are_escaped() {
		$html = $this->render(
			array(
				'videos' => array(
					array(
						'guid'  => 'abcd1234',
						'title' => '<script>alert(1)</script>',
					),
				),
			)
		);

		$this->assertStringNotContainsString( '<script>alert(1)</script>', $html );
		$this->assertStringContainsString( '&lt;script&gt;', $html );
	}

	/** Tests that a playlist without valid videos renders nothing. */
	public function test_empty_playlist_renders_nothing() {
		$this->assertSame( '', trim( $this->render( array( 'videos' => array() ) ) ) );
		$this->assertSame( '', trim( $this->render( array() ) ) );
		$this->assertSame( '', trim( $this->render( array( 'videos' => array( array( 'guid' => 'bad' ) ) ) ) ) );
	}
}
