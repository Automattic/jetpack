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
	 * Number of title lookups attempted during the current test.
	 *
	 * @var int
	 */
	private $title_requests = 0;

	/**
	 * Canned response for title lookups, or null to simulate an unreachable API.
	 *
	 * @var array|null
	 */
	private $title_response = null;

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		parent::tear_down();

		if ( \WP_Block_Type_Registry::get_instance()->is_registered( 'videopress/playlist' ) ) {
			\WP_Block_Type_Registry::get_instance()->unregister( 'videopress/playlist' );
		}

		// Drop title transients so caching state never leaks between tests.
		foreach ( array( 'abcd1234', 'efgh5678' ) as $guid ) {
			delete_transient( 'videopress_playlist_title_' . $guid );
		}
	}

	/**
	 * Intercept the title lookup so tests never hit the network.
	 *
	 * @param false|array|\WP_Error $preempt Whether to preempt the request.
	 * @param array                 $args    Request arguments.
	 * @param string                $url     Request URL.
	 * @return false|array|\WP_Error
	 */
	public function intercept_title_request( $preempt, $args, $url ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! str_contains( $url, 'public-api.wordpress.com/rest/v1.1/videos/' ) ) {
			return $preempt;
		}

		++$this->title_requests;

		return $this->title_response ?? new \WP_Error( 'http_request_failed', 'unreachable' );
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

		add_filter( 'pre_http_request', array( $this, 'intercept_title_request' ), 10, 3 );
		$html = do_blocks( '<!-- wp:videopress/playlist ' . $json . '/-->' );
		remove_filter( 'pre_http_request', array( $this, 'intercept_title_request' ) );

		return $html;
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

	/** Tests that rendering pulls the current title from the video data over the stored one. */
	public function test_render_uses_fresh_title_from_video_data() {
		$this->title_response = array(
			'response' => array( 'code' => 200 ),
			'body'     => wp_json_encode( array( 'title' => 'Renamed on VideoPress' ), JSON_UNESCAPED_SLASHES ),
		);

		$html = $this->render(
			array(
				'videos' => array(
					array(
						'guid'  => 'abcd1234',
						'title' => 'Stale stored title',
					),
				),
			)
		);

		$this->assertStringContainsString( 'Renamed on VideoPress', $html );
		$this->assertStringNotContainsString( 'Stale stored title', $html );
	}

	/** Tests that title lookups are cached and fall back to the stored title on failure. */
	public function test_render_title_lookups_are_cached() {
		$this->title_response = array(
			'response' => array( 'code' => 200 ),
			'body'     => wp_json_encode( array( 'title' => 'Fresh title' ), JSON_UNESCAPED_SLASHES ),
		);

		$attributes = array(
			'videos' => array(
				array(
					'guid'  => 'abcd1234',
					'title' => 'Stored title',
				),
			),
		);

		$this->render( $attributes );
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- Deliberate identical re-render to prove the lookup is served from cache.
		$this->render( $attributes );
		$this->assertSame( 1, $this->title_requests, 'The second render must be served from cache.' );

		// Unreachable API: the stored title is kept, and the failure is negative-cached.
		$this->title_requests = 0;
		$this->title_response = null;
		delete_transient( 'videopress_playlist_title_abcd1234' );

		$html = $this->render( $attributes );
		$this->assertStringContainsString( 'Stored title', $html );

		$this->render( $attributes );
		$this->assertSame( 1, $this->title_requests, 'Failed lookups must be negative-cached.' );
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
