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
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();

		if ( ! \WP_Block_Type_Registry::get_instance()->is_registered( 'videopress/playlist' ) ) {
			register_block_type(
				'videopress/playlist',
				array(
					'render_callback' => array( VideoPress_Initializer::class, 'render_videopress_playlist_block' ),
				)
			);
		}
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		parent::tear_down();

		\WP_Block_Type_Registry::get_instance()->unregister( 'videopress/playlist' );
	}

	/**
	 * Render the playlist block through do_blocks() so block supports
	 * (wrapper class names) apply like on a real page.
	 *
	 * @param array $attributes Block attributes.
	 * @return string Rendered markup.
	 */
	private function render( $attributes ) {
		// Empty attributes encode to `[]`, which the block parser rejects; omit them instead.
		$json = empty( $attributes ) ? '' : wp_json_encode( $attributes, JSON_UNESCAPED_SLASHES ) . ' ';
		return do_blocks( '<!-- wp:videopress/playlist ' . $json . '/-->' );
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
