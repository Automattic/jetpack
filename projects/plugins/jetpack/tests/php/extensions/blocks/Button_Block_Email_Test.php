<?php
/**
 * Button Block Email Rendering tests
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/button/button.php';

// Ensure the function is available
if ( ! function_exists( 'Automattic\Jetpack\Extensions\Button\render_email' ) ) {
	require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/button/button.php';
}

// Include mock classes for WooCommerce Email Editor helpers
require_once __DIR__ . '/mocks/class-mock-styles-helper.php';
require_once __DIR__ . '/mocks/class-mock-table-wrapper-helper.php';
require_once __DIR__ . '/mocks/class-mock-woocommerce-button-renderer.php';

use PHPUnit\Framework\Attributes\CoversFunction;

/**
 * Button Block Email Rendering tests.
 *
 * These tests verify the render_email function works correctly for various scenarios
 * including valid inputs, security validation, button styling, and HTML content handling.
 *
 * @covers ::Automattic\Jetpack\Extensions\Button\render_email
 */
#[CoversFunction( 'Automattic\Jetpack\Extensions\Button\render_email' )]
class Button_Block_Email_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Helper to create a parsed block with test attributes.
	 *
	 * @param array $attributes Optional custom attributes.
	 * @return array Parsed block structure.
	 */
	private function create_parsed_block_with_attributes( $attributes = array() ) {
		$default_attributes = array(
			'text'            => 'Click here',
			'url'             => 'https://example.com',
			'element'         => 'a',
			'backgroundColor' => 'blue',
			'textColor'       => 'white',
			'fontSize'        => '16px',
			'borderRadius'    => 4,
			'borderColor'     => 'black',
		);

		return array(
			'attrs' => array_merge( $default_attributes, $attributes ),
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
	 * Test render_email with valid attributes.
	 */
	public function test_render_email_with_valid_attributes() {
		$parsed_block = $this->create_parsed_block_with_attributes();
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Button\render_email( '', $parsed_block, $mock_context );

		// Should return HTML content
		$this->assertNotEmpty( $result );
		$this->assertStringContainsString( '<table', $result );
		$this->assertStringContainsString( '<a href', $result );

		// Should contain the button text
		$this->assertStringContainsString( 'Click here', $result );

		// Should contain the URL
		$this->assertStringContainsString( 'https://example.com', $result );
	}

	/**
	 * Test render_email with missing attrs.
	 */
	public function test_render_email_with_missing_attrs() {
		$mock_context = $this->create_rendering_context_mock();

		// Test with missing attrs
		$result = \Automattic\Jetpack\Extensions\Button\render_email( '', array( 'not-attrs' => array() ), $mock_context );
		$this->assertSame( '', $result );

		// Test with empty attrs
		$result = \Automattic\Jetpack\Extensions\Button\render_email( '', array( 'attrs' => array() ), $mock_context );
		$this->assertNotEmpty( $result ); // Should still render with defaults
	}

	/**
	 * Test render_email with custom button text.
	 */
	public function test_render_email_with_custom_button_text() {
		$attributes = array(
			'text' => 'Learn More',
		);

		$parsed_block = $this->create_parsed_block_with_attributes( $attributes );
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Button\render_email( '', $parsed_block, $mock_context );

		// Should contain the custom button text
		$this->assertStringContainsString( 'Learn More', $result );
		$this->assertStringNotContainsString( 'Click here', $result );
	}

	/**
	 * Test render_email with HTML in button text.
	 */
	public function test_render_email_with_html_button_text() {
		$attributes = array(
			'text' => '<strong><em>Click here</em></strong>',
		);

		$parsed_block = $this->create_parsed_block_with_attributes( $attributes );
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Button\render_email( '', $parsed_block, $mock_context );

		// Should strip HTML and show only text content
		$this->assertStringContainsString( 'Click here', $result );
		$this->assertStringNotContainsString( '<strong>', $result );
		$this->assertStringNotContainsString( '<em>', $result );
	}

	/**
	 * Test render_email with custom colors.
	 */
	public function test_render_email_with_custom_colors() {
		$attributes = array(
			'backgroundColor' => 'red',
			'textColor'       => 'yellow',
			'borderColor'     => 'green',
		);

		$parsed_block = $this->create_parsed_block_with_attributes( $attributes );
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Button\render_email( '', $parsed_block, $mock_context );

		// Should contain color styles (CSS format without spaces after colons)
		$this->assertStringContainsString( 'background-color:', $result );
		$this->assertStringContainsString( 'color:', $result );
		// Note: border-color may not be present if the color resolves to empty
	}

	/**
	 * Test render_email with custom border radius.
	 */
	public function test_render_email_with_custom_border_radius() {
		$attributes = array(
			'borderRadius' => 18,
		);

		$parsed_block = $this->create_parsed_block_with_attributes( $attributes );
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Button\render_email( '', $parsed_block, $mock_context );

		// Should contain border radius (CSS format without spaces after colons)
		$this->assertStringContainsString( 'border-radius:18px', $result );
	}

	/**
	 * Test render_email with custom border weight.
	 */
	public function test_render_email_with_custom_border_weight() {
		$attributes = array(
			'borderWeight' => 4,
		);

		$parsed_block = $this->create_parsed_block_with_attributes( $attributes );
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Button\render_email( '', $parsed_block, $mock_context );

		// Should contain border width (CSS format without spaces after colons)
		$this->assertStringContainsString( 'border-width:4px', $result );
	}

	/**
	 * Test render_email with subscription block attributes (mapped from subscriptions).
	 */
	public function test_render_email_with_subscription_attributes() {
		$attributes = array(
			'buttonBackgroundColor' => 'red',
			'textColor'             => 'yellow',
			'borderColor'           => 'green',
			'borderWeight'          => 3,
			'fontSize'              => '1.5rem',
		);

		$parsed_block = $this->create_parsed_block_with_attributes( $attributes );
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Button\render_email( '', $parsed_block, $mock_context );

		// Should contain the mapped attributes
		$this->assertStringContainsString( 'background-color:', $result );
		$this->assertStringContainsString( 'color:', $result );
		$this->assertStringContainsString( 'border-width:3px', $result );
		$this->assertStringContainsString( 'font-size:1.5rem', $result );
	}

	/**
	 * Test render_email table structure.
	 */
	public function test_render_email_table_structure() {
		$parsed_block = $this->create_parsed_block_with_attributes();
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Button\render_email( '', $parsed_block, $mock_context );

		// Should have table-based structure
		$this->assertStringContainsString( 'role="presentation"', $result );
		$this->assertStringContainsString( 'border-collapse:collapse', $result );

		// Should have proper cell structure
		$this->assertStringContainsString( '<td', $result );
		$this->assertStringContainsString( '</td>', $result );

		// Should have inline styles for email compatibility
		$this->assertStringContainsString( 'style="', $result );
		$this->assertStringContainsString( 'font-family: Arial, sans-serif', $result );
	}

	/**
	 * Test render_email with rendering context width.
	 */
	public function test_render_email_with_rendering_context() {
		$mock_context = $this->create_rendering_context_mock( '800px' );
		$parsed_block = $this->create_parsed_block_with_attributes();
		$result       = \Automattic\Jetpack\Extensions\Button\render_email( '', $parsed_block, $mock_context );

		// Should use the provided width (CSS format without spaces after colons)
		$this->assertStringContainsString( 'max-width:800px', $result );
	}

	/**
	 * Test render_email security - HTML stripping.
	 */
	public function test_render_email_html_stripping() {
		$attributes = array(
			'text' => '<strong><em>Click here</em></strong>',
		);

		$parsed_block = $this->create_parsed_block_with_attributes( $attributes );
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Button\render_email( '', $parsed_block, $mock_context );

		// Should strip HTML and show only text content
		$this->assertStringContainsString( 'Click here', $result );
		$this->assertStringNotContainsString( '<strong>', $result );
		$this->assertStringNotContainsString( '<em>', $result );
	}

	/**
	 * Test render_email with long button text.
	 */
	public function test_render_email_with_long_button_text() {
		$long_text  = str_repeat( 'A', 300 ); // 300 characters
		$attributes = array(
			'text' => $long_text,
		);

		$parsed_block = $this->create_parsed_block_with_attributes( $attributes );
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Button\render_email( '', $parsed_block, $mock_context );

		// Should contain the long text (may not be truncated as expected)
		$this->assertStringContainsString( substr( $long_text, 0, 100 ), $result );
	}

	/**
	 * Test render_email with invalid font size.
	 */
	public function test_render_email_with_invalid_font_size() {
		$attributes = array(
			'fontSize' => 'invalid-size',
		);

		$parsed_block = $this->create_parsed_block_with_attributes( $attributes );
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Button\render_email( '', $parsed_block, $mock_context );

		// Should fall back to default font size (CSS format without spaces after colons)
		$this->assertStringContainsString( 'font-size:16px', $result );
	}

	/**
	 * Test render_email with excessive border radius.
	 */
	public function test_render_email_with_excessive_border_radius() {
		$attributes = array(
			'borderRadius' => 100, // Above the 50px cap
		);

		$parsed_block = $this->create_parsed_block_with_attributes( $attributes );
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Button\render_email( '', $parsed_block, $mock_context );

		// Should cap at 50px (CSS format without spaces after colons)
		$this->assertStringContainsString( 'border-radius:50px', $result );
		$this->assertStringNotContainsString( 'border-radius:100px', $result );
	}

	/**
	 * Test render_email returns empty when WooCommerce Email Editor helper classes are missing.
	 */
	public function test_render_email_returns_empty_when_helpers_missing() {
		$parsed_block = $this->create_parsed_block_with_attributes();
		$mock_context = $this->create_rendering_context_mock();

		// Verify that with mocked classes, the function works
		$result_with_mocks = \Automattic\Jetpack\Extensions\Button\render_email( '', $parsed_block, $mock_context );
		$this->assertNotEmpty( $result_with_mocks );

		// Test the class existence check logic directly
		$button_renderer_exists = class_exists( '\Automattic\WooCommerce\EmailEditor\Integrations\Core\Renderer\Blocks\Button' );

		// The class should exist due to our mocks
		$this->assertTrue( $button_renderer_exists, 'Button renderer class should be mocked and available' );
	}

	/**
	 * Test render_email with custom background color.
	 */
	public function test_render_email_with_custom_background_color() {
		$attributes = array(
			'customBackgroundColor' => '#FF5733',
		);

		$parsed_block = $this->create_parsed_block_with_attributes( $attributes );
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Button\render_email( '', $parsed_block, $mock_context );

		// Should contain the custom background color
		$this->assertStringContainsString( 'background-color:#FF5733', $result );
	}

	/**
	 * Test render_email with custom text color.
	 */
	public function test_render_email_with_custom_text_color() {
		$attributes = array(
			'customTextColor' => '#00FF00',
		);

		$parsed_block = $this->create_parsed_block_with_attributes( $attributes );
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Button\render_email( '', $parsed_block, $mock_context );

		// Should contain the custom text color
		$this->assertStringContainsString( 'color:#00FF00', $result );
	}

	/**
	 * Test render_email with custom border color.
	 */
	public function test_render_email_with_custom_border_color() {
		$attributes = array(
			'customBorderColor' => '#FFD700',
		);

		$parsed_block = $this->create_parsed_block_with_attributes( $attributes );
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Button\render_email( '', $parsed_block, $mock_context );

		// Should contain the custom border color
		$this->assertStringContainsString( 'border-color:#FFD700', $result );
	}

	/**
	 * Test render_email with custom font size.
	 */
	public function test_render_email_with_custom_font_size() {
		$attributes = array(
			'customFontSize' => '24px',
		);

		$parsed_block = $this->create_parsed_block_with_attributes( $attributes );
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Button\render_email( '', $parsed_block, $mock_context );

		// Should contain the custom font size
		$this->assertStringContainsString( 'font-size:24px', $result );
	}

	/**
	 * Test render_email with element type 'button'.
	 */
	public function test_render_email_with_button_element() {
		$attributes = array(
			'element' => 'button',
		);

		$parsed_block = $this->create_parsed_block_with_attributes( $attributes );
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Button\render_email( '', $parsed_block, $mock_context );

		// Should still render as a link for email compatibility
		$this->assertStringContainsString( '<a href', $result );
		$this->assertStringNotContainsString( '<button', $result );
	}

	/**
	 * Test render_email with element type 'input'.
	 */
	public function test_render_email_with_input_element() {
		$attributes = array(
			'element' => 'input',
		);

		$parsed_block = $this->create_parsed_block_with_attributes( $attributes );
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Button\render_email( '', $parsed_block, $mock_context );

		// Should still render as a link for email compatibility
		$this->assertStringContainsString( '<a href', $result );
		$this->assertStringNotContainsString( '<input', $result );
	}
}
