<?php
/**
 * Tests for VideoPress video block email renderer.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

// Include mock classes for WooCommerce Email Editor helpers FIRST.
// This ensures the mock class is available when Video_Block_Email_Renderer checks for it.
require_once __DIR__ . '/mocks/class-mock-woocommerce-embed-renderer.php';

use PHPUnit\Framework\Attributes\CoversMethod;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Tests for VideoPress video block email renderer.
 *
 * @covers \Automattic\Jetpack\VideoPress\Video_Block_Email_Renderer::render
 * @covers \Automattic\Jetpack\VideoPress\Video_Block_Email_Renderer::get_videopress_url
 * @covers \Automattic\Jetpack\VideoPress\Video_Block_Email_Renderer::render_link
 */
#[CoversMethod( Video_Block_Email_Renderer::class, 'render' )]
#[CoversMethod( Video_Block_Email_Renderer::class, 'get_videopress_url' )]
#[CoversMethod( Video_Block_Email_Renderer::class, 'render_link' )]
class Video_Block_Email_Renderer_Test extends BaseTestCase {

	/**
	 * Helper to create a parsed block with attributes.
	 *
	 * @param array $attrs Block attributes.
	 * @param array $email_attrs Optional email attributes.
	 * @return array Parsed block structure.
	 */
	private function create_parsed_block( $attrs = array(), $email_attrs = null ) {
		$block = array(
			'attrs' => $attrs,
		);

		if ( null !== $email_attrs ) {
			$block['email_attrs'] = $email_attrs;
		}

		return $block;
	}

	/**
	 * Helper to create a rendering context mock.
	 *
	 * @return object Mock rendering context.
	 */
	private function create_rendering_context_mock() {
		return new class() {
			/**
			 * Get layout width.
			 *
			 * @return string
			 */
			public function get_layout_width_without_padding() {
				return '600px';
			}
		};
	}

	/**
	 * Test render with valid guid.
	 */
	public function test_render_email_with_valid_guid() {
		$parsed_block = $this->create_parsed_block( array( 'guid' => 'nfbj0J36' ) );
		$mock_context = $this->create_rendering_context_mock();

		$result = Video_Block_Email_Renderer::render( '', $parsed_block, $mock_context );

		// Should return HTML content from the mock renderer.
		$this->assertNotEmpty( $result );
		$this->assertStringContainsString( 'email-embed-video', $result );
		$this->assertStringContainsString( 'https://videopress.com/v/nfbj0J36', $result );
		$this->assertStringContainsString( 'data-provider="videopress"', $result );
	}

	/**
	 * Test render with missing attrs.
	 */
	public function test_render_email_with_missing_attrs() {
		$mock_context = $this->create_rendering_context_mock();

		// Test with missing attrs key.
		$result = Video_Block_Email_Renderer::render( '', array( 'not-attrs' => array() ), $mock_context );
		$this->assertSame( '', $result );

		// Test with non-array attrs.
		$result = Video_Block_Email_Renderer::render( '', array( 'attrs' => 'not-an-array' ), $mock_context );
		$this->assertSame( '', $result );
	}

	/**
	 * Test render with missing guid.
	 */
	public function test_render_email_with_missing_guid() {
		$parsed_block = $this->create_parsed_block( array( 'title' => 'Test Video' ) );
		$mock_context = $this->create_rendering_context_mock();

		$result = Video_Block_Email_Renderer::render( '', $parsed_block, $mock_context );

		$this->assertSame( '', $result );
	}

	/**
	 * Test render with empty guid.
	 */
	public function test_render_email_with_empty_guid() {
		$parsed_block = $this->create_parsed_block( array( 'guid' => '' ) );
		$mock_context = $this->create_rendering_context_mock();

		$result = Video_Block_Email_Renderer::render( '', $parsed_block, $mock_context );

		$this->assertSame( '', $result );
	}

	/**
	 * Data provider for invalid guid test cases.
	 *
	 * @return array Test cases with invalid guids.
	 */
	public static function invalid_guid_provider() {
		return array(
			'contains spaces'        => array( 'abc 123' ),
			'contains special chars' => array( 'abc<script>alert(1)</script>' ),
			'contains slashes'       => array( 'abc/def' ),
			'contains dots'          => array( 'abc.def' ),
			'contains hyphens'       => array( 'abc-def' ),
			'contains underscores'   => array( 'abc_def' ),
			'contains url'           => array( 'https://evil.com' ),
			'contains html entities' => array( '&lt;script&gt;' ),
			'contains null byte'     => array( "abc\x00def" ),
		);
	}

	/**
	 * Test render rejects invalid guid characters (security).
	 *
	 * @dataProvider invalid_guid_provider
	 * @param string $invalid_guid The invalid guid to test.
	 */
	#[DataProvider( 'invalid_guid_provider' )]
	public function test_render_email_rejects_invalid_guid_characters( $invalid_guid ) {
		$parsed_block = $this->create_parsed_block( array( 'guid' => $invalid_guid ) );
		$mock_context = $this->create_rendering_context_mock();

		$result = Video_Block_Email_Renderer::render( '', $parsed_block, $mock_context );

		// Should return empty string for invalid guids.
		$this->assertSame( '', $result, "Invalid guid '$invalid_guid' should be rejected" );
	}

	/**
	 * Data provider for valid guid test cases.
	 *
	 * @return array Test cases with valid guids.
	 */
	public static function valid_guid_provider() {
		return array(
			'lowercase letters'   => array( 'abcdefgh' ),
			'uppercase letters'   => array( 'ABCDEFGH' ),
			'numbers'             => array( '12345678' ),
			'mixed case and nums' => array( 'nfbj0J36' ),
			'all lowercase mixed' => array( 'abc123xy' ),
			'single character'    => array( 'a' ),
			'long guid'           => array( 'abcdefghijklmnop1234567890' ),
		);
	}

	/**
	 * Test render accepts valid guid formats.
	 *
	 * @dataProvider valid_guid_provider
	 * @param string $valid_guid The valid guid to test.
	 */
	#[DataProvider( 'valid_guid_provider' )]
	public function test_render_email_accepts_valid_guid_formats( $valid_guid ) {
		$parsed_block = $this->create_parsed_block( array( 'guid' => $valid_guid ) );
		$mock_context = $this->create_rendering_context_mock();

		$result = Video_Block_Email_Renderer::render( '', $parsed_block, $mock_context );

		// Should return HTML content for valid guids.
		$this->assertNotEmpty( $result, "Valid guid '$valid_guid' should be accepted" );
		$this->assertStringContainsString( "https://videopress.com/v/$valid_guid", $result );
	}

	/**
	 * Test render preserves email_attrs.
	 */
	public function test_render_email_preserves_email_attrs() {
		$email_attrs = array(
			'width'   => '500px',
			'padding' => '10px',
		);

		$parsed_block = $this->create_parsed_block(
			array( 'guid' => 'testguid' ),
			$email_attrs
		);
		$mock_context = $this->create_rendering_context_mock();

		// The mock renderer doesn't use email_attrs, but we verify the function doesn't error.
		$result = Video_Block_Email_Renderer::render( '', $parsed_block, $mock_context );

		$this->assertNotEmpty( $result );
		$this->assertStringContainsString( 'https://videopress.com/v/testguid', $result );
	}

	/**
	 * Test render constructs correct mock block structure.
	 */
	public function test_render_email_constructs_correct_mock_block() {
		$parsed_block = $this->create_parsed_block( array( 'guid' => 'abc123' ) );
		$mock_context = $this->create_rendering_context_mock();

		$result = Video_Block_Email_Renderer::render( '', $parsed_block, $mock_context );

		// Verify the mock renderer received correct provider.
		$this->assertStringContainsString( 'data-provider="videopress"', $result );

		// Verify correct URL format.
		$this->assertStringContainsString( 'https://videopress.com/v/abc123', $result );
	}

	/**
	 * Test URL construction produces correct format.
	 */
	public function test_url_construction_format() {
		$parsed_block = $this->create_parsed_block( array( 'guid' => 'MyVideo1' ) );
		$mock_context = $this->create_rendering_context_mock();

		$result = Video_Block_Email_Renderer::render( '', $parsed_block, $mock_context );

		// URL should be exactly https://videopress.com/v/{guid}.
		$this->assertStringContainsString( 'href="https://videopress.com/v/MyVideo1"', $result );
	}

	/**
	 * Test render works with real-world block attributes.
	 */
	public function test_render_email_with_realistic_block_attributes() {
		// Simulate attributes from a real VideoPress block.
		$parsed_block = $this->create_parsed_block(
			array(
				'title'          => 'small-video-1-mp4',
				'description'    => '',
				'id'             => 175,
				'guid'           => 'nfbj0J36',
				'src'            => 'https://videos.files.wordpress.com/nfbj0J36/small-video-1.mp4',
				'videoRatio'     => 57.166666666666664,
				'privacySetting' => 2,
				'allowDownload'  => false,
				'rating'         => 'G',
				'isPrivate'      => false,
				'duration'       => 5568,
			)
		);
		$mock_context = $this->create_rendering_context_mock();

		$result = Video_Block_Email_Renderer::render( '', $parsed_block, $mock_context );

		$this->assertNotEmpty( $result );
		$this->assertStringContainsString( 'https://videopress.com/v/nfbj0J36', $result );
	}

	/**
	 * Test that block_content parameter is accepted but not required.
	 */
	public function test_render_email_accepts_block_content_parameter() {
		$parsed_block  = $this->create_parsed_block( array( 'guid' => 'testguid' ) );
		$mock_context  = $this->create_rendering_context_mock();
		$block_content = '<div>Some original content</div>';

		// Should work with non-empty block_content.
		$result = Video_Block_Email_Renderer::render( $block_content, $parsed_block, $mock_context );

		$this->assertNotEmpty( $result );
		$this->assertStringContainsString( 'https://videopress.com/v/testguid', $result );
	}

	/**
	 * Test render with private video renders a link fallback to the post.
	 */
	public function test_render_email_with_private_video_renders_link() {
		// Create a post so get_the_permalink() returns a valid URL.
		$post_id         = wp_insert_post(
			array(
				'post_title'  => 'Test Post',
				'post_status' => 'publish',
			)
		);
		$GLOBALS['post'] = get_post( $post_id );

		$parsed_block = $this->create_parsed_block(
			array(
				'guid'      => 'privatevid',
				'isPrivate' => true,
			)
		);
		$mock_context = $this->create_rendering_context_mock();

		$result = Video_Block_Email_Renderer::render( '', $parsed_block, $mock_context );

		// Should render a simple link to the post instead of video embed.
		$this->assertNotEmpty( $result );
		$this->assertStringContainsString( '<a href=', $result );
		$this->assertStringContainsString( 'Visit the post to watch the video', $result );
		// Should NOT contain the embed wrapper that the mock renderer produces.
		$this->assertStringNotContainsString( 'email-embed-video', $result );
		// Should NOT link to VideoPress since video is private.
		$this->assertStringNotContainsString( 'videopress.com', $result );

		// Clean up.
		wp_delete_post( $post_id, true );
		unset( $GLOBALS['post'] );
	}

	/**
	 * Test render with public video renders full embed.
	 */
	public function test_render_email_with_public_video_renders_embed() {
		$parsed_block = $this->create_parsed_block(
			array(
				'guid'      => 'publicvid',
				'isPrivate' => false,
			)
		);
		$mock_context = $this->create_rendering_context_mock();

		$result = Video_Block_Email_Renderer::render( '', $parsed_block, $mock_context );

		// Should render the full embed (via mock renderer).
		$this->assertNotEmpty( $result );
		$this->assertStringContainsString( 'https://videopress.com/v/publicvid', $result );
		$this->assertStringContainsString( 'email-embed-video', $result );
	}

	/**
	 * Test render private video link includes padding when email_attrs present.
	 */
	public function test_render_email_private_video_link_with_padding() {
		// Create a post so get_the_permalink() returns a valid URL.
		$post_id         = wp_insert_post(
			array(
				'post_title'  => 'Test Post',
				'post_status' => 'publish',
			)
		);
		$GLOBALS['post'] = get_post( $post_id );

		$parsed_block = $this->create_parsed_block(
			array(
				'guid'      => 'privatevid',
				'isPrivate' => true,
			),
			array( 'padding' => '20px' )
		);
		$mock_context = $this->create_rendering_context_mock();

		$result = Video_Block_Email_Renderer::render( '', $parsed_block, $mock_context );

		$this->assertNotEmpty( $result );
		$this->assertStringContainsString( 'padding: 20px', $result );
		$this->assertStringContainsString( '<p style=', $result );

		// Clean up.
		wp_delete_post( $post_id, true );
		unset( $GLOBALS['post'] );
	}

	/**
	 * Test render with private video returns empty when no post context.
	 */
	public function test_render_email_with_private_video_no_post_returns_empty() {
		// Ensure no post context.
		unset( $GLOBALS['post'] );

		$parsed_block = $this->create_parsed_block(
			array(
				'guid'      => 'privatevid',
				'isPrivate' => true,
			)
		);
		$mock_context = $this->create_rendering_context_mock();

		$result = Video_Block_Email_Renderer::render( '', $parsed_block, $mock_context );

		// Should return empty string when no post URL available.
		$this->assertSame( '', $result );
	}
}
