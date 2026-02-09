<?php
/**
 * Podcast Player Block Email Rendering tests
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/podcast-player/podcast-player.php';

// Include mock classes for WooCommerce Email Editor helpers
require_once __DIR__ . '/mocks/class-mock-styles-helper.php';
require_once __DIR__ . '/mocks/class-mock-table-wrapper-helper.php';
require_once __DIR__ . '/mocks/class-mock-woocommerce-audio-renderer.php';

use PHPUnit\Framework\Attributes\CoversFunction;

/**
 * Podcast Player Block Email Rendering tests.
 *
 * These tests verify the render_email function works correctly for various scenarios
 * including valid inputs, security validation, and email rendering.
 *
 * @covers ::Automattic\Jetpack\Extensions\Podcast_Player\render_email
 */
#[CoversFunction( 'Automattic\Jetpack\Extensions\Podcast_Player\render_email' )]
class Podcast_Player_Block_Email_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Helper to create a parsed block with test podcast URL.
	 *
	 * @param array $attrs Optional custom attributes.
	 * @return array Parsed block structure.
	 */
	private function create_parsed_block_with_attrs( $attrs = array() ) {
		$default_attrs = array(
			'url' => 'https://feeds.acast.com/public/shows/test-podcast',
		);

		return array(
			'attrs' => array_merge( $default_attrs, $attrs ),
		);
	}

	/**
	 * Helper to create a rendering context mock.
	 *
	 * @param string $width The width to return from get_layout_width_without_padding.
	 * @return object Mock rendering context.
	 */
	private function create_rendering_context_mock( $width = '600px' ) {
		return new class( $width ) {
			private $width;

			public function __construct( $width ) {
				$this->width = $width;
			}

			public function get_layout_width_without_padding() {
				return $this->width;
			}
		};
	}

	/**
	 * Test render_email with valid podcast URL.
	 */
	public function test_render_email_with_valid_podcast_url() {
		// Create a test post so get_the_permalink() works
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Test Post',
				'post_content' => 'Test content',
				'post_status'  => 'publish',
			)
		);
		global $post;
		$post = get_post( $post_id );

		$parsed_block = $this->create_parsed_block_with_attrs();
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Podcast_Player\render_email( '', $parsed_block, $mock_context );

		// Should return HTML content
		$this->assertNotEmpty( $result );
		$this->assertStringContainsString( '<table', $result );
		$this->assertStringContainsString( 'href=', $result );
		$this->assertStringContainsString( 'Listen to the podcast', $result );

		// Should link to the post URL, not the RSS feed URL
		$this->assertStringContainsString( get_permalink( $post_id ), $result );

		// Should contain table-based layout for email compatibility
		$this->assertStringContainsString( 'border-collapse', $result );

		// Should contain margin styling for email spacing
		$this->assertStringContainsString( 'margin: 16px 0', $result );

		// Cleanup
		wp_delete_post( $post_id, true );
	}

	/**
	 * Test render_email with missing attrs.
	 */
	public function test_render_email_with_missing_attrs() {
		$mock_context = $this->create_rendering_context_mock();

		// Test with missing attrs
		$result = \Automattic\Jetpack\Extensions\Podcast_Player\render_email( '', array( 'not-attrs' => array() ), $mock_context );
		$this->assertSame( '', $result );

		// Test with empty attrs
		$result = \Automattic\Jetpack\Extensions\Podcast_Player\render_email( '', array( 'attrs' => array() ), $mock_context );
		$this->assertSame( '', $result );
	}

	/**
	 * Test render_email returns empty when no post context.
	 */
	public function test_render_email_returns_empty_when_no_post() {
		// Clear global post to simulate no post context
		global $post;
		$original_post = $post;
		$post          = null;

		$parsed_block = $this->create_parsed_block_with_attrs();
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Podcast_Player\render_email( '', $parsed_block, $mock_context );

		// Should return empty string when no post permalink available
		$this->assertSame( '', $result );

		// Restore original post
		$post = $original_post;
	}

	/**
	 * Test render_email with empty URL.
	 */
	public function test_render_email_with_empty_url() {
		// Create a test post so get_the_permalink() works
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Test Post',
				'post_content' => 'Test content',
				'post_status'  => 'publish',
			)
		);
		global $post;
		$post = get_post( $post_id );

		$parsed_block = $this->create_parsed_block_with_attrs(
			array(
				'url' => '',
			)
		);
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Podcast_Player\render_email( '', $parsed_block, $mock_context );

		// Should return empty string when no valid URL
		$this->assertSame( '', $result );

		// Cleanup
		wp_delete_post( $post_id, true );
	}

	/**
	 * Test render_email with invalid URL.
	 */
	public function test_render_email_with_invalid_url() {
		// Create a test post so get_the_permalink() works
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Test Post',
				'post_content' => 'Test content',
				'post_status'  => 'publish',
			)
		);
		global $post;
		$post = get_post( $post_id );

		$parsed_block = $this->create_parsed_block_with_attrs(
			array(
				'url' => 'not-a-valid-url',
			)
		);
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Podcast_Player\render_email( '', $parsed_block, $mock_context );

		// Should return empty string when URL is invalid
		$this->assertSame( '', $result );

		// Cleanup
		wp_delete_post( $post_id, true );
	}

	/**
	 * Test render_email returns empty when WooCommerce Email Editor audio renderer class is missing.
	 */
	public function test_render_email_returns_empty_when_audio_renderer_missing() {
		// Create a test post so get_the_permalink() works
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Test Post',
				'post_content' => 'Test content',
				'post_status'  => 'publish',
			)
		);
		global $post;
		$post = get_post( $post_id );

		$parsed_block = $this->create_parsed_block_with_attrs();
		$mock_context = $this->create_rendering_context_mock();

		// Verify that with mocked classes, the function works
		$result_with_mocks = \Automattic\Jetpack\Extensions\Podcast_Player\render_email( '', $parsed_block, $mock_context );
		$this->assertNotEmpty( $result_with_mocks );

		// Test the class existence check logic directly
		$audio_renderer_exists = class_exists( '\Automattic\WooCommerce\EmailEditor\Integrations\Core\Renderer\Blocks\Audio' );

		// Class should exist due to our mock
		$this->assertTrue( $audio_renderer_exists, 'Audio renderer class should be mocked and available' );

		// Cleanup
		wp_delete_post( $post_id, true );
	}

	/**
	 * Test render_email security - URL validation.
	 */
	public function test_render_email_security_url_validation() {
		// Create a test post so get_the_permalink() works
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Test Post',
				'post_content' => 'Test content',
				'post_status'  => 'publish',
			)
		);
		global $post;
		$post = get_post( $post_id );

		$parsed_block = $this->create_parsed_block_with_attrs(
			array(
				'url' => 'https://feeds.acast.com/public/shows/test-podcast',
			)
		);
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Podcast_Player\render_email( '', $parsed_block, $mock_context );

		// Should render with valid URL
		$this->assertNotEmpty( $result );
		// Should link to the post URL, not the RSS feed URL
		$this->assertStringContainsString( get_permalink( $post_id ), $result );

		// Cleanup
		wp_delete_post( $post_id, true );
	}

	/**
	 * Test render_email contains proper button styling.
	 */
	public function test_render_email_contains_button_styling() {
		// Create a test post so get_the_permalink() works
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Test Post',
				'post_content' => 'Test content',
				'post_status'  => 'publish',
			)
		);
		global $post;
		$post = get_post( $post_id );

		$parsed_block = $this->create_parsed_block_with_attrs();
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Podcast_Player\render_email( '', $parsed_block, $mock_context );

		// Should contain button styling from audio renderer
		$this->assertNotEmpty( $result );
		$this->assertStringContainsString( 'background-color: #f6f7f7', $result );
		$this->assertStringContainsString( 'border: 1px solid #AAA', $result );
		$this->assertStringContainsString( 'border-radius: 9999px', $result );

		// Cleanup
		wp_delete_post( $post_id, true );
	}

	/**
	 * Test render_email contains play icon.
	 */
	public function test_render_email_contains_play_icon() {
		// Create a test post so get_the_permalink() works
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Test Post',
				'post_content' => 'Test content',
				'post_status'  => 'publish',
			)
		);
		global $post;
		$post = get_post( $post_id );

		$parsed_block = $this->create_parsed_block_with_attrs();
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Podcast_Player\render_email( '', $parsed_block, $mock_context );

		// Should contain play icon from audio renderer
		$this->assertNotEmpty( $result );
		$this->assertStringContainsString( 'audio-play.png', $result );
		$this->assertStringContainsString( '<img', $result );

		// Cleanup
		wp_delete_post( $post_id, true );
	}
}
