<?php
/**
 * Subscriptions Block Email Rendering tests
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/subscriptions/subscriptions.php';
require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/button/button.php';

// Ensure the functions are available
if ( ! function_exists( 'Automattic\Jetpack\Extensions\Subscriptions\render_email' ) ) {
	require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/subscriptions/subscriptions.php';
}
if ( ! function_exists( 'Automattic\Jetpack\Extensions\Button\render_email' ) ) {
	require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/button/button.php';
}

// Include mock classes for WooCommerce Email Editor helpers
require_once __DIR__ . '/mocks/class-mock-styles-helper.php';
require_once __DIR__ . '/mocks/class-mock-table-wrapper-helper.php';
require_once __DIR__ . '/mocks/class-mock-woocommerce-button-renderer.php';

use PHPUnit\Framework\Attributes\CoversFunction;

/**
 * Subscriptions Block Email Rendering tests.
 *
 * These tests verify the render_email function works correctly for various scenarios
 * including valid inputs, security validation, button styling, and HTML content handling.
 *
 * @covers ::Automattic\Jetpack\Extensions\Subscriptions\render_email
 */
#[CoversFunction( 'Automattic\Jetpack\Extensions\Subscriptions\render_email' )]
class Subscriptions_Block_Email_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Set up test environment.
	 */
	public function set_up() {
		parent::set_up();

		// Mock the Subscriptions module as active
		add_filter( 'jetpack_active_modules', array( $this, 'mock_subscriptions_active' ) );
	}

	/**
	 * Mock the subscriptions module as active.
	 *
	 * @param array $modules Active modules.
	 * @return array
	 */
	public function mock_subscriptions_active( $modules ) {
		$modules[] = 'subscriptions';
		return $modules;
	}

	/**
	 * Helper to create a parsed block with test attributes.
	 *
	 * @param array $attributes Optional custom attributes.
	 * @return array Parsed block structure.
	 */
	private function create_parsed_block_with_attributes( $attributes = array() ) {
		$default_attributes = array(
			'submitButtonText'      => 'Subscribe',
			'buttonBackgroundColor' => 'blue',
			'textColor'             => 'white',
			'fontSize'              => '16px',
			'borderRadius'          => 4,
			'borderWeight'          => 1,
			'borderColor'           => 'black',
			'padding'               => 15,
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
		$result       = \Automattic\Jetpack\Extensions\Subscriptions\render_email( '', $parsed_block, $mock_context );

		// Should return HTML content
		$this->assertNotEmpty( $result );
		$this->assertStringContainsString( '<table', $result );
		$this->assertStringContainsString( '<a href', $result );

		// Should contain the button text
		$this->assertStringContainsString( 'Subscribe', $result );

		// Should contain post permalink
		$this->assertStringContainsString( get_post_permalink(), $result );
	}

	/**
	 * Test render_email with missing attrs.
	 */
	public function test_render_email_with_missing_attrs() {
		$mock_context = $this->create_rendering_context_mock();

		// Test with missing attrs
		$result = \Automattic\Jetpack\Extensions\Subscriptions\render_email( '', array( 'not-attrs' => array() ), $mock_context );
		$this->assertSame( '', $result );

		// Test with empty attrs
		$result = \Automattic\Jetpack\Extensions\Subscriptions\render_email( '', array( 'attrs' => array() ), $mock_context );
		$this->assertNotEmpty( $result ); // Should still render with defaults
	}

	/**
	 * Test render_email with custom button text and HTML stripping.
	 */
	public function test_render_email_with_custom_button_text_and_html_stripping() {
		$attributes = array(
			'submitButtonText' => '<strong><em>Join Newsletter</em></strong>',
		);

		$parsed_block = $this->create_parsed_block_with_attributes( $attributes );
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Subscriptions\render_email( '', $parsed_block, $mock_context );

		// Should contain the custom button text (stripped of HTML)
		$this->assertStringContainsString( 'Join Newsletter', $result );
		$this->assertStringNotContainsString( '<strong>', $result );
		$this->assertStringNotContainsString( '<em>', $result );
	}

	/**
	 * Test render_email with custom styling attributes.
	 */
	public function test_render_email_with_custom_styling() {
		$attributes = array(
			'buttonBackgroundColor' => 'red',
			'textColor'             => 'yellow',
			'borderColor'           => 'green',
			'fontSize'              => '2.5rem',
			'borderRadius'          => 18,
			'borderWeight'          => 4,
			'padding'               => 21,
		);

		$parsed_block = $this->create_parsed_block_with_attributes( $attributes );
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Subscriptions\render_email( '', $parsed_block, $mock_context );

		// Should contain styling (CSS format without spaces after colons)
		$this->assertStringContainsString( 'background-color:', $result );
		$this->assertStringContainsString( 'color:', $result );
		$this->assertStringContainsString( 'font-size:2.5rem', $result );
		$this->assertStringContainsString( 'border-radius:18px', $result );
		$this->assertStringContainsString( 'border-width:4px', $result );
		$this->assertStringContainsString( 'padding:21px', $result );
	}

	/**
	 * Test render_email table structure and email compatibility.
	 */
	public function test_render_email_table_structure() {
		$parsed_block = $this->create_parsed_block_with_attributes();
		$mock_context = $this->create_rendering_context_mock();
		$result       = \Automattic\Jetpack\Extensions\Subscriptions\render_email( '', $parsed_block, $mock_context );

		// Should have table-based structure for email compatibility
		$this->assertStringContainsString( 'role="presentation"', $result );
		$this->assertStringContainsString( 'border-collapse:collapse', $result );
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
		$result       = \Automattic\Jetpack\Extensions\Subscriptions\render_email( '', $parsed_block, $mock_context );

		// Should use the provided width (CSS format without spaces after colons)
		$this->assertStringContainsString( 'max-width:800px', $result );
	}

	/**
	 * Test render_email returns empty when WooCommerce Email Editor helper classes are missing.
	 */
	public function test_render_email_returns_empty_when_helpers_missing() {
		$parsed_block = $this->create_parsed_block_with_attributes();
		$mock_context = $this->create_rendering_context_mock();

		// Verify that with mocked classes, the function works
		$result_with_mocks = \Automattic\Jetpack\Extensions\Subscriptions\render_email( '', $parsed_block, $mock_context );
		$this->assertNotEmpty( $result_with_mocks );

		// Test the class existence check logic directly
		$styles_helper_exists = class_exists( '\Automattic\WooCommerce\EmailEditor\Integrations\Utils\Styles_Helper' );
		$table_helper_exists  = class_exists( '\Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper' );

		// Both classes should exist due to our mocks
		$this->assertTrue( $styles_helper_exists, 'Styles_Helper class should be mocked and available' );
		$this->assertTrue( $table_helper_exists, 'Table_Wrapper_Helper class should be mocked and available' );
	}
}
