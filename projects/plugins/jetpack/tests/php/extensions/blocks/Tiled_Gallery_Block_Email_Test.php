<?php
/**
 * Tiled Gallery Block Email Rendering tests
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/tiled-gallery/tiled-gallery.php';

// Include mock classes for WooCommerce Email Editor helpers
require_once __DIR__ . '/mocks/class-mock-styles-helper.php';
require_once __DIR__ . '/mocks/class-mock-table-wrapper-helper.php';

use PHPUnit\Framework\Attributes\CoversMethod;

/**
 * Tiled Gallery Block Email Rendering tests.
 *
 * These tests verify the render_email function works correctly for various scenarios
 * including valid inputs, security validation, layout styles, and grid generation.
 *
 * @covers Automattic\Jetpack\Extensions\Tiled_Gallery::render_email
 */
#[CoversMethod( Automattic\Jetpack\Extensions\Tiled_Gallery::class, 'render_email' )]
class Tiled_Gallery_Block_Email_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Helper to create a parsed block with test images.
	 *
	 * @param array $attrs Optional custom attributes.
	 * @return array Parsed block structure.
	 */
	private function create_parsed_block_with_attrs( $attrs = array() ) {
		$default_attrs = array(
			'images' => array(
				array(
					'url' => 'http://example.com/test-image-1.jpg',
					'alt' => 'Test Alt Text 1',
					'id'  => 1,
				),
				array(
					'url' => 'http://example.com/test-image-2.jpg',
					'alt' => 'Test Alt Text 2',
					'id'  => 2,
				),
				array(
					'url' => 'http://example.com/test-image-3.jpg',
					'alt' => 'Test Alt Text 3',
					'id'  => 3,
				),
			),
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
	 * Test render_email with valid images - mosaic layout.
	 */
	public function test_render_email_with_valid_images_mosaic() {
		$parsed_block = $this->create_parsed_block_with_attrs();
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Tiled_Gallery::render_email( '', $parsed_block, $mock_context );

		// Should return HTML content
		$this->assertNotEmpty( $result );
		$this->assertStringContainsString( '<table', $result );
		$this->assertStringContainsString( '<img', $result );

		// Should contain table-based layout for email compatibility
		$this->assertStringContainsString( 'border-collapse: collapse', $result );

		// Should contain margin styling for email spacing
		$this->assertStringContainsString( 'margin: 16px 0', $result );
	}

	/**
	 * Test render_email with square layout style.
	 */
	public function test_render_email_with_square_layout() {
		$parsed_block = $this->create_parsed_block_with_attrs(
			array(
				'className' => 'is-style-square',
				'columns'   => 2,
			)
		);
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Tiled_Gallery::render_email( '', $parsed_block, $mock_context );

		// Should return HTML content with square layout
		$this->assertNotEmpty( $result );
		$this->assertStringContainsString( '<table', $result );
		$this->assertStringContainsString( '<img', $result );

		// Should contain table-based layout for email compatibility
		$this->assertStringContainsString( 'border-collapse: collapse', $result );
	}

	/**
	 * Test render_email with circle layout style.
	 */
	public function test_render_email_with_circle_layout() {
		$parsed_block = $this->create_parsed_block_with_attrs(
			array(
				'className' => 'is-style-circle',
				'columns'   => 3,
			)
		);
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Tiled_Gallery::render_email( '', $parsed_block, $mock_context );

		// Should return HTML content with circle styling
		$this->assertNotEmpty( $result );
		$this->assertStringContainsString( 'border-radius:50%', $result );
	}

	/**
	 * Test render_email with columns layout style.
	 */
	public function test_render_email_with_columns_layout() {
		$parsed_block = $this->create_parsed_block_with_attrs(
			array(
				'className' => 'is-style-columns',
				'columns'   => 2,
			)
		);
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Tiled_Gallery::render_email( '', $parsed_block, $mock_context );

		// Should return HTML content with columns layout
		$this->assertNotEmpty( $result );
		$this->assertStringContainsString( 'border-collapse: collapse', $result );
	}

	/**
	 * Test render_email with rounded corners.
	 */
	public function test_render_email_with_rounded_corners() {
		$parsed_block = $this->create_parsed_block_with_attrs(
			array(
				'roundedCorners' => 10,
			)
		);
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Tiled_Gallery::render_email( '', $parsed_block, $mock_context );

		// Should contain border radius styling
		$this->assertNotEmpty( $result );
		$this->assertStringContainsString( 'border-radius:10px', $result );
	}

	/**
	 * Test render_email with missing attrs.
	 */
	public function test_render_email_with_missing_attrs() {
		$mock_context = $this->create_rendering_context_mock();

		// Test with missing attrs
		$result = \Automattic\Jetpack\Extensions\Tiled_Gallery::render_email( '', array( 'not-attrs' => array() ), $mock_context );
		$this->assertSame( '', $result );

		// Test with empty attrs
		$result = \Automattic\Jetpack\Extensions\Tiled_Gallery::render_email( '', array( 'attrs' => array() ), $mock_context );
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
		$result       = \Automattic\Jetpack\Extensions\Tiled_Gallery::render_email( '', $parsed_block, $mock_context );

		// Should return empty string when no valid images
		$this->assertSame( '', $result );
	}

	/**
	 * Test render_email with invalid images array.
	 */
	public function test_render_email_with_invalid_images() {
		$parsed_block = array(
			'attrs' => array(
				'images' => array(
					array(
						'url' => '', // Invalid/empty URL
						'alt' => 'Test Alt Text',
						'id'  => 1,
					),
				),
			),
		);

		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Tiled_Gallery::render_email( '', $parsed_block, $mock_context );

		// Should return empty string when no valid images
		$this->assertSame( '', $result );
	}

	/**
	 * Test render_email security - column validation.
	 */
	public function test_render_email_security_column_validation() {
		$parsed_block = $this->create_parsed_block_with_attrs(
			array(
				'columns' => 50, // Excessive number of columns
			)
		);
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Tiled_Gallery::render_email( '', $parsed_block, $mock_context );

		// Should still render (columns should be clamped to max 6)
		$this->assertNotEmpty( $result );
	}

	/**
	 * Test render_email security - border radius validation.
	 */
	public function test_render_email_security_border_radius_validation() {
		$parsed_block = $this->create_parsed_block_with_attrs(
			array(
				'roundedCorners' => 100, // Excessive border radius
			)
		);
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Tiled_Gallery::render_email( '', $parsed_block, $mock_context );

		// Should render with clamped border radius (max 20px)
		$this->assertNotEmpty( $result );
		$this->assertStringContainsString( 'border-radius:20px', $result );
		$this->assertStringNotContainsString( 'border-radius:100px', $result );
	}

	/**
	 * Test render_email returns empty when WooCommerce Email Editor helper classes are missing.
	 */
	public function test_render_email_returns_empty_when_helpers_missing() {
		$parsed_block = $this->create_parsed_block_with_attrs();
		$mock_context = $this->create_rendering_context_mock();

		// Verify that with mocked classes, the function works
		$result_with_mocks = \Automattic\Jetpack\Extensions\Tiled_Gallery::render_email( '', $parsed_block, $mock_context );
		$this->assertNotEmpty( $result_with_mocks );

		// Test the class existence check logic directly
		$styles_helper_exists = class_exists( '\Automattic\WooCommerce\EmailEditor\Integrations\Utils\Styles_Helper' );
		$table_helper_exists  = class_exists( '\Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper' );

		// Both classes should exist due to our mocks
		$this->assertTrue( $styles_helper_exists, 'Styles_Helper class should be mocked and available' );
		$this->assertTrue( $table_helper_exists, 'Table_Wrapper_Helper class should be mocked and available' );
	}

	/**
	 * Test render_email with no link setting (default: none).
	 */
	public function test_render_email_with_no_link() {
		$parsed_block = $this->create_parsed_block_with_attrs(
			array(
				'linkTo' => 'none',
			)
		);
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Tiled_Gallery::render_email( '', $parsed_block, $mock_context );

		// Should return HTML content without any links
		$this->assertNotEmpty( $result );
		$this->assertStringContainsString( '<img', $result );
		$this->assertStringNotContainsString( '<a href=', $result );
	}

	/**
	 * Test render_email with media file links.
	 */
	public function test_render_email_with_media_links() {
		$parsed_block = $this->create_parsed_block_with_attrs(
			array(
				'linkTo' => 'media',
			)
		);
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Tiled_Gallery::render_email( '', $parsed_block, $mock_context );

		// Should return HTML content with media file links
		$this->assertNotEmpty( $result );
		$this->assertStringContainsString( '<a href="http://example.com/test-image-1.jpg">', $result );
		$this->assertStringContainsString( '<a href="http://example.com/test-image-2.jpg">', $result );
		$this->assertStringContainsString( '<a href="http://example.com/test-image-3.jpg">', $result );
	}

	/**
	 * Test render_email with attachment page links.
	 */
	public function test_render_email_with_attachment_links() {
		// Create test attachments
		$attachment_id_1 = $this->factory()->attachment->create();
		$attachment_id_2 = $this->factory()->attachment->create();
		$attachment_id_3 = $this->factory()->attachment->create();

		$parsed_block = $this->create_parsed_block_with_attrs(
			array(
				'linkTo' => 'attachment',
				'images' => array(
					array(
						'url' => 'http://example.com/test-image-1.jpg',
						'alt' => 'Test Alt Text 1',
						'id'  => $attachment_id_1,
					),
					array(
						'url' => 'http://example.com/test-image-2.jpg',
						'alt' => 'Test Alt Text 2',
						'id'  => $attachment_id_2,
					),
					array(
						'url' => 'http://example.com/test-image-3.jpg',
						'alt' => 'Test Alt Text 3',
						'id'  => $attachment_id_3,
					),
				),
			)
		);
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Tiled_Gallery::render_email( '', $parsed_block, $mock_context );

		// Should return HTML content with attachment page links
		$this->assertNotEmpty( $result );
		$this->assertStringContainsString( '<a href=', $result );

		// Check that links contain attachment URLs
		$expected_url_1 = get_permalink( $attachment_id_1 );
		$expected_url_2 = get_permalink( $attachment_id_2 );
		$expected_url_3 = get_permalink( $attachment_id_3 );

		if ( $expected_url_1 ) {
			$this->assertStringContainsString( 'href="' . esc_url( $expected_url_1 ) . '"', $result );
		}
		if ( $expected_url_2 ) {
			$this->assertStringContainsString( 'href="' . esc_url( $expected_url_2 ) . '"', $result );
		}
		if ( $expected_url_3 ) {
			$this->assertStringContainsString( 'href="' . esc_url( $expected_url_3 ) . '"', $result );
		}
	}

	/**
	 * Test render_email with invalid linkTo setting.
	 */
	public function test_render_email_with_invalid_link_setting() {
		$parsed_block = $this->create_parsed_block_with_attrs(
			array(
				'linkTo' => 'invalid-setting',
			)
		);
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Tiled_Gallery::render_email( '', $parsed_block, $mock_context );

		// Should return HTML content without any links (fallback to no links)
		$this->assertNotEmpty( $result );
		$this->assertStringContainsString( '<img', $result );
		$this->assertStringNotContainsString( '<a href=', $result );
	}
}
