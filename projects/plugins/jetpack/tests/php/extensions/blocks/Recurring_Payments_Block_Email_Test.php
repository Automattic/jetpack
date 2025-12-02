<?php
/**
 * Recurring Payments Block Email Rendering tests
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'modules/memberships/class-jetpack-memberships.php';
require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/button/button.php';

// Include mock classes for WooCommerce Email Editor helpers
require_once __DIR__ . '/mocks/class-mock-styles-helper.php';
require_once __DIR__ . '/mocks/class-mock-table-wrapper-helper.php';
require_once __DIR__ . '/mocks/class-mock-woocommerce-button-renderer.php';

use PHPUnit\Framework\Attributes\CoversMethod;

/**
 * Recurring Payments Block Email Rendering tests.
 *
 * These tests verify the render_button_email method works correctly for various scenarios.
 *
 * @covers Jetpack_Memberships::render_button_email
 */
#[CoversMethod( Jetpack_Memberships::class, 'render_button_email' )]
class Recurring_Payments_Block_Email_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Helper to create a parsed block with inner button block.
	 *
	 * @param array $button_attrs Optional custom attributes for the inner button block.
	 * @return array Parsed block structure.
	 */
	private function create_parsed_block_with_inner_block_button( $button_attrs = array() ) {
		$default_button_attrs = array(
			'text'            => 'Subscribe',
			'url'             => 'https://example.com/subscribe',
			'backgroundColor' => '#3858e9',
			'textColor'       => '#ffffff',
		);

		return array(
			'attrs'       => array(),
			'innerBlocks' => array(
				array(
					'blockName' => 'jetpack/button',
					'attrs'     => array_merge( $default_button_attrs, $button_attrs ),
				),
			),
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
	 * Test render_button_email with valid inner button block.
	 */
	public function test_render_button_email_with_valid_inner_block() {
		$memberships  = Jetpack_Memberships::get_instance();
		$parsed_block = $this->create_parsed_block_with_inner_block_button();
		$mock_context = $this->create_rendering_context_mock();

		$result = $memberships->render_button_email( '', $parsed_block, $mock_context );

		// Should return HTML content
		$this->assertNotEmpty( $result );
		$this->assertStringContainsString( '<table', $result );
		$this->assertStringContainsString( '<a href', $result );

		// Should contain the button text
		$this->assertStringContainsString( 'Subscribe', $result );

		// Should contain the URL
		$this->assertStringContainsString( 'https://example.com/subscribe', $result );

		// Should contain the custom colors
		$this->assertStringContainsString( 'background-color:#3858e9', $result );
		$this->assertStringContainsString( 'color:#ffffff', $result );
	}

	/**
	 * Test render_button_email returns empty when inner blocks are missing.
	 */
	public function test_render_button_email_returns_empty_when_inner_blocks_missing() {
		$memberships  = Jetpack_Memberships::get_instance();
		$mock_context = $this->create_rendering_context_mock();
		$parsed_block = $this->create_parsed_block_with_inner_block_button();

		// Remove the inner block.
		$parsed_block['innerBlocks'] = array();

		$result = $memberships->render_button_email( '', $parsed_block, $mock_context );

		$this->assertSame( '', $result );
	}

	/**
	 * Test render_button_email returns empty when button attrs are missing.
	 */
	public function test_render_button_email_returns_empty_when_button_attrs_missing() {
		$memberships  = Jetpack_Memberships::get_instance();
		$mock_context = $this->create_rendering_context_mock();
		$parsed_block = $this->create_parsed_block_with_inner_block_button();

		// Remove the inner block's attributes.
		$parsed_block['innerBlocks'][0]['attrs'] = array();

		$result = $memberships->render_button_email( '', $parsed_block, $mock_context );

		$this->assertSame( '', $result );
	}

	/**
	 * Test render_button_email returns empty when button attrs is not an array.
	 */
	public function test_render_button_email_returns_empty_when_attrs_not_array() {
		$memberships  = Jetpack_Memberships::get_instance();
		$mock_context = $this->create_rendering_context_mock();
		$parsed_block = $this->create_parsed_block_with_inner_block_button();

		// Remove the inner block's attributes.
		$parsed_block['innerBlocks'][0]['attrs'] = 'not-an-array';

		$result = $memberships->render_button_email( '', $parsed_block, $mock_context );

		$this->assertSame( '', $result );
	}

	/**
	 * Test render_button_email returns empty when button text is missing.
	 */
	public function test_render_button_email_returns_empty_when_text_missing() {
		$memberships  = Jetpack_Memberships::get_instance();
		$mock_context = $this->create_rendering_context_mock();

		$parsed_block = $this->create_parsed_block_with_inner_block_button(
			array(
				'text' => '',
				'url'  => 'https://example.com/subscribe',
			)
		);

		$result = $memberships->render_button_email( '', $parsed_block, $mock_context );

		$this->assertSame( '', $result );
	}

	/**
	 * Test render_button_email returns empty when button url is missing.
	 */
	public function test_render_button_email_returns_empty_when_url_missing() {
		$memberships  = Jetpack_Memberships::get_instance();
		$mock_context = $this->create_rendering_context_mock();

		$parsed_block = $this->create_parsed_block_with_inner_block_button(
			array(
				'text' => 'Subscribe',
				'url'  => '',
			)
		);

		$result = $memberships->render_button_email( '', $parsed_block, $mock_context );

		$this->assertSame( '', $result );
	}

	/**
	 * Test render_button_email table structure.
	 */
	public function test_render_button_email_table_structure() {
		$memberships  = Jetpack_Memberships::get_instance();
		$mock_context = $this->create_rendering_context_mock();
		$parsed_block = $this->create_parsed_block_with_inner_block_button();

		$result = $memberships->render_button_email( '', $parsed_block, $mock_context );

		// Should have table-based structure
		$this->assertStringContainsString( 'role="presentation"', $result );
		$this->assertStringContainsString( 'border-collapse:collapse', $result );

		// Should have proper cell structure
		$this->assertStringContainsString( '<td', $result );
		$this->assertStringContainsString( '</td>', $result );

		// Should have inline styles for email compatibility
		$this->assertStringContainsString( 'style="', $result );
	}
}
