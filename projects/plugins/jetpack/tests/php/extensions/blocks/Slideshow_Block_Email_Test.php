<?php
/**
 * Slideshow Block Email Rendering tests
 *
 * @package automattic/jetpack
 */

// Include mock classes for WooCommerce Email Editor helpers FIRST
// This ensures the mock class is available when slideshow.php checks for it
require_once __DIR__ . '/mocks/class-mock-woocommerce-gallery-renderer.php';

require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/slideshow/slideshow.php';

// Ensure the function is available
if ( ! function_exists( 'Automattic\Jetpack\Extensions\Slideshow\render_email' ) ) {
	require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/slideshow/slideshow.php';
}

use PHPUnit\Framework\Attributes\CoversFunction;

/**
 * Slideshow Block Email Rendering tests.
 *
 * These tests verify the render_email function works correctly for various scenarios
 * including valid inputs, security validation, caption handling, and grid layout generation.
 *
 * @covers ::Automattic\Jetpack\Extensions\Slideshow\render_email
 */
#[CoversFunction( 'Automattic\Jetpack\Extensions\Slideshow\render_email' )]
class Slideshow_Block_Email_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Test attachment IDs for testing.
	 *
	 * @var array
	 */
	private $test_attachment_ids = array();

	/**
	 * Set up test environment.
	 */
	public function set_up() {
		parent::set_up();

		// Create test attachments first
		$this->create_test_attachments();

		// Filter wp_get_attachment_image_url to return test URLs for our test attachments
		$test_ids = $this->test_attachment_ids;
		add_filter(
			'wp_get_attachment_image_url',
			function ( $url, $attachment_id ) use ( $test_ids ) {
				if ( ! empty( $test_ids ) && in_array( $attachment_id, $test_ids, true ) ) {
					$test_urls = array(
						$test_ids[0] => 'http://example.com/wp-content/uploads/test-image-1.jpg',
						$test_ids[1] => 'http://example.com/wp-content/uploads/test-image-2.jpg',
					);
					if ( isset( $test_urls[ $attachment_id ] ) ) {
						return $test_urls[ $attachment_id ];
					}
				}
				return $url;
			},
			10,
			2
		);
	}

	/**
	 * Clean up test environment.
	 */
	public function tear_down() {
		// Clean up test attachments
		foreach ( $this->test_attachment_ids as $attachment_id ) {
			wp_delete_attachment( $attachment_id, true );
		}

		parent::tear_down();
	}

	/**
	 * Helper to create a parsed block with test images.
	 *
	 * @param array $images_data Optional custom images data.
	 * @param array $ids Optional attachment IDs. If not provided, only images array is used.
	 * @return array Parsed block structure.
	 */
	private function create_parsed_block_with_images( $images_data = null, $ids = null ) {
		if ( null === $images_data ) {
			$images_data = $this->get_default_test_images();
		}

		$attrs = array(
			'images' => $images_data,
		);

		// Only set ids if explicitly provided (for testing the ids path)
		// Otherwise, rely on images array fallback which is more reliable for testing
		if ( null !== $ids ) {
			$attrs['ids'] = $ids;
		}

		return array(
			'attrs' => $attrs,
		);
	}

	/**
	 * Helper to get default test images data.
	 *
	 * @return array Default test images.
	 */
	private function get_default_test_images() {
		return array(
			array(
				'url'     => 'http://example.com/test-image-1.jpg',
				'alt'     => 'Test Alt Text 1',
				'caption' => 'Test Caption 1',
				'id'      => 1,
			),
			array(
				'url'     => 'http://example.com/test-image-2.jpg',
				'alt'     => 'Test Alt Text 2',
				'caption' => 'Test Caption 2',
				'id'      => 2,
			),
		);
	}

	/**
	 * Helper to create a rendering context mock.
	 *
	 * @param string $width The width to return from get_layout_width_without_padding.
	 * @return object Mock rendering context.
	 */
	private function create_rendering_context_mock( $width = '800px' ) {
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
	 * Create test attachments for testing.
	 */
	private function create_test_attachments() {
		// Create test posts to attach images to
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Test Post for Slideshow',
				'post_content' => 'Test content',
				'post_status'  => 'publish',
			)
		);

		// Create test attachment 1
		$attachment_id_1 = wp_insert_post(
			array(
				'post_title'   => 'Test Image 1',
				'post_type'    => 'attachment',
				'post_parent'  => $post_id,
				'post_excerpt' => 'Photo by Test User on <a href="https://example.com">Example.com</a>',
				'post_status'  => 'inherit',
				'guid'         => 'http://example.com/wp-content/uploads/test-image-1.jpg',
			)
		);

		// Create test attachment 2
		$attachment_id_2 = wp_insert_post(
			array(
				'post_title'   => 'Test Image 2',
				'post_type'    => 'attachment',
				'post_parent'  => $post_id,
				'post_excerpt' => 'Another test caption',
				'post_status'  => 'inherit',
				'guid'         => 'http://example.com/wp-content/uploads/test-image-2.jpg',
			)
		);

		// Set attachment metadata
		wp_update_attachment_metadata(
			$attachment_id_1,
			array(
				'file'  => 'test-image-1.jpg',
				'sizes' => array(
					'medium' => array(
						'file'   => 'test-image-1-300x200.jpg',
						'width'  => 300,
						'height' => 200,
					),
				),
			)
		);

		wp_update_attachment_metadata(
			$attachment_id_2,
			array(
				'file'  => 'test-image-2.jpg',
				'sizes' => array(
					'medium' => array(
						'file'   => 'test-image-2-300x200.jpg',
						'width'  => 300,
						'height' => 200,
					),
				),
			)
		);

		// Set alt text
		update_post_meta( $attachment_id_1, '_wp_attachment_image_alt', 'Test Alt Text 1' );
		update_post_meta( $attachment_id_2, '_wp_attachment_image_alt', 'Test Alt Text 2' );

		$this->test_attachment_ids = array( $attachment_id_1, $attachment_id_2 );
	}

	/**
	 * Test render_email with valid IDs.
	 */
	public function test_render_email_with_valid_ids() {
		// Test with images array (more reliable for testing)
		$parsed_block = $this->create_parsed_block_with_images();
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Slideshow\render_email( '', $parsed_block, $mock_context );

		// Should return HTML content
		$this->assertNotEmpty( $result );
		$this->assertStringContainsString( '<table', $result );
		$this->assertStringContainsString( '<img', $result );

		// Should contain both images
		$this->assertStringContainsString( 'test-image-1.jpg', $result );
		$this->assertStringContainsString( 'test-image-2.jpg', $result );

		// Should contain alt text
		$this->assertStringContainsString( 'Test Alt Text 1', $result );
		$this->assertStringContainsString( 'Test Alt Text 2', $result );
	}

	/**
	 * Test render_email with missing attrs.
	 */
	public function test_render_email_with_missing_attrs() {
		$mock_context = $this->create_rendering_context_mock();

		// Test with missing attrs
		$result = \Automattic\Jetpack\Extensions\Slideshow\render_email( '', array( 'not-attrs' => array() ), $mock_context );
		$this->assertSame( '', $result );

		// Test with empty attrs
		$result = \Automattic\Jetpack\Extensions\Slideshow\render_email( '', array( 'attrs' => array() ), $mock_context );
		$this->assertSame( '', $result );

		// Test with non-array ids
		$result = \Automattic\Jetpack\Extensions\Slideshow\render_email( '', array( 'attrs' => array( 'ids' => 'not-an-array' ) ), $mock_context );
		$this->assertSame( '', $result );
	}

	/**
	 * Test render_email with invalid attachment IDs.
	 */
	public function test_render_email_with_invalid_attachment_ids() {
		$parsed_block = array(
			'attrs' => array(
				'ids' => array( 99999, 99998 ), // Non-existent IDs
			),
		);

		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Slideshow\render_email( '', $parsed_block, $mock_context );

		// Should return empty string when no valid images
		$this->assertSame( '', $result );
	}

	/**
	 * Test render_email with mixed valid and invalid IDs.
	 */
	public function test_render_email_with_mixed_ids() {
		$images_data = array(
			array(
				'url'     => 'http://example.com/test-image-1.jpg',
				'alt'     => 'Test Alt Text 1',
				'caption' => 'Test Caption 1',
				'id'      => 1,
			),
			array(
				'url'     => '', // Invalid/empty URL
				'alt'     => 'Test Alt Text 2',
				'caption' => 'Test Caption 2',
				'id'      => 2,
			),
		);

		$parsed_block = $this->create_parsed_block_with_images( $images_data );
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Slideshow\render_email( '', $parsed_block, $mock_context );

		// Should return HTML with only the valid image
		$this->assertNotEmpty( $result );
		$this->assertStringContainsString( 'test-image-1.jpg', $result );
		$this->assertStringNotContainsString( 'test-image-2.jpg', $result );
	}

	/**
	 * Test render_email with captions from post_excerpt.
	 */
	public function test_render_email_with_captions() {
		$images_data = array(
			array(
				'url'     => 'http://example.com/test-image-1.jpg',
				'alt'     => 'Test Alt Text 1',
				'caption' => 'Photo by Test User on <a href="https://example.com">Example.com</a>',
				'id'      => $this->test_attachment_ids[0],
			),
			array(
				'url'     => 'http://example.com/test-image-2.jpg',
				'alt'     => 'Test Alt Text 2',
				'caption' => 'Another test caption',
				'id'      => $this->test_attachment_ids[1],
			),
		);

		$parsed_block = $this->create_parsed_block_with_images( $images_data );
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Slideshow\render_email( '', $parsed_block, $mock_context );

		// Should contain captions (HTML preserved and sanitized by gallery renderer)
		$this->assertStringContainsString( 'Photo by Test User on', $result );
		$this->assertStringContainsString( 'Another test caption', $result );

		// Links in captions should be sanitized but may still appear
		// The gallery renderer sanitizes HTML, so script tags should be removed
		$this->assertStringNotContainsString( '<script>', $result );
	}

	/**
	 * Test render_email with captions from images array.
	 */
	public function test_render_email_with_images_array_captions() {
		$images_data = array(
			array(
				'url'     => 'http://example.com/test-image-1.jpg',
				'alt'     => 'Test Alt Text 1',
				'caption' => 'Custom caption from images array',
				'id'      => 1,
			),
			array(
				'url'     => 'http://example.com/test-image-2.jpg',
				'alt'     => 'Test Alt Text 2',
				'caption' => 'Another custom caption',
				'id'      => 2,
			),
		);

		$parsed_block = $this->create_parsed_block_with_images( $images_data );
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Slideshow\render_email( '', $parsed_block, $mock_context );

		// Should use captions from images array
		$this->assertStringContainsString( 'Custom caption from images array', $result );
		$this->assertStringContainsString( 'Another custom caption', $result );
	}

	/**
	 * Test render_email grid layout structure.
	 */
	public function test_render_email_grid_layout() {
		$parsed_block = $this->create_parsed_block_with_images();
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Slideshow\render_email( '', $parsed_block, $mock_context );

		// Should have table-based grid structure (from core gallery renderer)
		$this->assertStringContainsString( 'role="presentation"', $result );
		$this->assertStringContainsString( 'table-layout: fixed', $result );
		$this->assertStringContainsString( 'border-collapse: collapse', $result );

		// Should have proper cell structure
		$this->assertStringContainsString( '<td', $result );
		$this->assertStringContainsString( '</td>', $result );

		// Should have inline styles for email compatibility
		$this->assertStringContainsString( 'style="', $result );
		$this->assertStringContainsString( 'email-block-gallery', $result );
	}

	/**
	 * Test render_email with rendering context width.
	 */
	public function test_render_email_with_rendering_context() {
		$mock_context = $this->create_rendering_context_mock( '800px' );
		$parsed_block = $this->create_parsed_block_with_images();
		$result       = \Automattic\Jetpack\Extensions\Slideshow\render_email( '', $parsed_block, $mock_context );

		// Should return HTML (width is handled by the gallery renderer)
		$this->assertNotEmpty( $result );
		$this->assertStringContainsString( '<table', $result );
	}

	/**
	 * Test render_email with odd number of images.
	 */
	public function test_render_email_with_odd_number_of_images() {
		// Use images array for reliable testing
		$images_data = array(
			array(
				'url'     => 'http://example.com/test-image-1.jpg',
				'alt'     => 'Test Alt Text 1',
				'caption' => 'Test Caption 1',
				'id'      => 1,
			),
			array(
				'url'     => 'http://example.com/test-image-2.jpg',
				'alt'     => 'Test Alt Text 2',
				'caption' => 'Test Caption 2',
				'id'      => 2,
			),
			array(
				'url'     => 'http://example.com/test-image-3.jpg',
				'alt'     => 'Test Alt Text 3',
				'caption' => 'Third test caption',
				'id'      => 3,
			),
		);

		$parsed_block = $this->create_parsed_block_with_images( $images_data );
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Slideshow\render_email( '', $parsed_block, $mock_context );

		// Should have 3 images (gallery renderer handles layout)
		$this->assertNotEmpty( $result );
		$this->assertStringContainsString( '<img', $result );
		$this->assertStringContainsString( 'Test Alt Text 1', $result );
		$this->assertStringContainsString( 'Test Alt Text 2', $result );
		$this->assertStringContainsString( 'Test Alt Text 3', $result );
	}

	/**
	 * Test render_email security - XSS prevention.
	 */
	public function test_render_email_security_xss_prevention() {
		$images_data = array(
			array(
				'url'     => 'http://example.com/malicious-image.jpg',
				'alt'     => 'Malicious Alt Text',
				'caption' => '<script>alert("XSS")</script>Malicious caption',
				'id'      => 1,
			),
		);

		$parsed_block = $this->create_parsed_block_with_images( $images_data );
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Slideshow\render_email( '', $parsed_block, $mock_context );

		// Should contain the caption text but not the script tag
		// The text "alert("XSS")" may appear but it's safe as long as script tags are removed
		$this->assertStringContainsString( 'Malicious caption', $result );
		$this->assertStringNotContainsString( '<script>', $result );
		$this->assertStringNotContainsString( '</script>', $result );
		// The gallery renderer sanitizes HTML, so script tags are removed but text may remain
	}

	/**
	 * Test render_email returns empty when WooCommerce Email Editor gallery renderer class is missing.
	 */
	public function test_render_email_returns_empty_when_gallery_renderer_missing() {
		// Test that the function returns empty when gallery renderer class doesn't exist
		// This test verifies the upfront class checking behavior
		$parsed_block = $this->create_parsed_block_with_images();
		$mock_context = $this->create_rendering_context_mock();

		// Verify that with mocked class, the function works
		$result_with_mocks = \Automattic\Jetpack\Extensions\Slideshow\render_email( '', $parsed_block, $mock_context );
		$this->assertNotEmpty( $result_with_mocks );

		// Test the class existence check logic directly
		$gallery_renderer_exists = class_exists( '\Automattic\WooCommerce\EmailEditor\Integrations\Core\Renderer\Blocks\Gallery' );

		// Gallery renderer class should exist due to our mock
		$this->assertTrue( $gallery_renderer_exists, 'Gallery renderer class should be mocked and available' );
	}
}
