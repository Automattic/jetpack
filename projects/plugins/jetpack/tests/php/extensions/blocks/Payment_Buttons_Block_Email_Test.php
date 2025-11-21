<?php
/**
 * Payment Buttons Block Email Rendering tests
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/payment-buttons/payment-buttons.php';

// Include mock class for WooCommerce Email Editor Flex Layout Renderer
require_once __DIR__ . '/class-mock-flex-layout-renderer.php';

use PHPUnit\Framework\Attributes\CoversFunction;

/**
 * Payment Buttons Block Email Rendering tests.
 *
 * These tests verify the render_block_email function works correctly for various scenarios.
 *
 * @covers ::Automattic\Jetpack\Extensions\PaymentButtons\render_block_email
 */
#[CoversFunction( 'Automattic\Jetpack\Extensions\PaymentButtons\render_block_email' )]
class Payment_Buttons_Block_Email_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Helper to create a parsed block with test attributes.
	 *
	 * @param array $attributes Optional custom attributes.
	 * @param array $inner_blocks Optional inner blocks.
	 * @return array Parsed block structure.
	 */
	private function create_parsed_block( $attributes = array(), $inner_blocks = array() ) {
		$default_attributes = array(
			'layout' => array(
				'type' => 'flex',
			),
		);

		return array(
			'attrs'       => array_merge( $default_attributes, $attributes ),
			'innerBlocks' => $inner_blocks,
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
	 * Test render_block_email with valid attributes.
	 */
	public function test_render_block_email_with_valid_attributes() {
		$parsed_block = $this->create_parsed_block();
		$mock_context = $this->create_rendering_context_mock();

		$result = \Automattic\Jetpack\Extensions\PaymentButtons\render_block_email( '', $parsed_block, $mock_context );

		// Should return HTML content from the flex layout renderer
		$this->assertNotEmpty( $result );
		$this->assertStringContainsString( '<table', $result );
	}

	/**
	 * Test render_block_email with inner blocks.
	 */
	public function test_render_block_email_with_inner_blocks() {
		$inner_blocks = array(
			array(
				'blockName' => 'jetpack/recurring-payments',
				'attrs'     => array(
					'planId' => 123,
				),
			),
		);

		$parsed_block = $this->create_parsed_block( array(), $inner_blocks );
		$mock_context = $this->create_rendering_context_mock();

		$result = \Automattic\Jetpack\Extensions\PaymentButtons\render_block_email( '', $parsed_block, $mock_context );

		// Should return content
		$this->assertNotEmpty( $result );
	}

	/**
	 * Test render_block_email with empty attributes.
	 */
	public function test_render_block_email_with_empty_attributes() {
		$parsed_block = array(
			'attrs'       => array(),
			'innerBlocks' => array(),
		);
		$mock_context = $this->create_rendering_context_mock();

		$result = \Automattic\Jetpack\Extensions\PaymentButtons\render_block_email( '', $parsed_block, $mock_context );

		$this->assertNotEmpty( $result );
	}

	/**
	 * Test render_block_email table structure.
	 */
	public function test_render_block_email_table_structure() {
		$parsed_block = $this->create_parsed_block();
		$mock_context = $this->create_rendering_context_mock();

		$result = \Automattic\Jetpack\Extensions\PaymentButtons\render_block_email( '', $parsed_block, $mock_context );

		// Should have table-based structure for email compatibility
		$this->assertStringContainsString( '<table', $result );
		$this->assertStringContainsString( '</table>', $result );
	}

	/**
	 * Test render_block_email with rendering context.
	 */
	public function test_render_block_email_with_rendering_context() {
		$mock_context = $this->create_rendering_context_mock( '800px' );
		$parsed_block = $this->create_parsed_block();

		$result = \Automattic\Jetpack\Extensions\PaymentButtons\render_block_email( '', $parsed_block, $mock_context );

		// Should return content using the rendering context
		$this->assertNotEmpty( $result );
	}

	/**
	 * Test render_block_email preserves other style attributes.
	 */
	public function test_render_block_email_preserves_other_styles() {
		$parsed_block = $this->create_parsed_block(
			array(
				'style' => array(
					'typography' => array(
						'fontSize'   => '24px', // This should be removed
						'fontWeight' => 'bold', // This should be preserved
					),
					'spacing'    => array(
						'padding' => '10px',
					),
				),
			)
		);
		$mock_context = $this->create_rendering_context_mock();

		$result = \Automattic\Jetpack\Extensions\PaymentButtons\render_block_email( '', $parsed_block, $mock_context );

		// Should render successfully
		$this->assertNotEmpty( $result );
	}

	/**
	 * Test render_block_email handles typography without fontSize.
	 */
	public function test_render_block_email_handles_typography_without_font_size() {
		$parsed_block = $this->create_parsed_block(
			array(
				'style' => array(
					'typography' => array(
						'fontWeight' => 'bold',
						'lineHeight' => '1.5',
					),
				),
			)
		);
		$mock_context = $this->create_rendering_context_mock();

		$result = \Automattic\Jetpack\Extensions\PaymentButtons\render_block_email( '', $parsed_block, $mock_context );

		// Should render successfully without errors
		$this->assertNotEmpty( $result );
	}

	/**
	 * Test render_block_email handles style without typography.
	 */
	public function test_render_block_email_handles_style_without_typography() {
		$parsed_block = $this->create_parsed_block(
			array(
				'style' => array(
					'spacing' => array(
						'padding' => '10px',
					),
					'color'   => array(
						'background' => '#ffffff',
					),
				),
			)
		);
		$mock_context = $this->create_rendering_context_mock();

		$result = \Automattic\Jetpack\Extensions\PaymentButtons\render_block_email( '', $parsed_block, $mock_context );

		// Should render successfully without errors
		$this->assertNotEmpty( $result );
	}

	/**
	 * Test render_block_email with multiple inner blocks.
	 */
	public function test_render_block_email_with_multiple_inner_blocks() {
		$inner_blocks = array(
			array(
				'blockName' => 'jetpack/recurring-payments',
				'attrs'     => array(
					'planId' => 123,
				),
			),
			array(
				'blockName' => 'jetpack/recurring-payments',
				'attrs'     => array(
					'planId' => 456,
				),
			),
			array(
				'blockName' => 'jetpack/recurring-payments',
				'attrs'     => array(
					'planId' => 789,
				),
			),
		);

		$parsed_block = $this->create_parsed_block( array(), $inner_blocks );
		$mock_context = $this->create_rendering_context_mock();

		$result = \Automattic\Jetpack\Extensions\PaymentButtons\render_block_email( '', $parsed_block, $mock_context );

		// Should render all inner blocks
		$this->assertNotEmpty( $result );
		$this->assertStringContainsString( 'jetpack/recurring-payments', $result );
	}

	/**
	 * Test render_block_email with null style attribute.
	 */
	public function test_render_block_email_with_null_style() {
		$parsed_block = array(
			'attrs'       => array(
				'style' => null,
			),
			'innerBlocks' => array(),
		);
		$mock_context = $this->create_rendering_context_mock();

		$result = \Automattic\Jetpack\Extensions\PaymentButtons\render_block_email( '', $parsed_block, $mock_context );

		// Should render successfully without errors
		$this->assertNotEmpty( $result );
	}

	/**
	 * Test render_block_email with deeply nested inner blocks.
	 */
	public function test_render_block_email_with_nested_inner_blocks() {
		$inner_blocks = array(
			array(
				'blockName'   => 'core/group',
				'attrs'       => array(),
				'innerBlocks' => array(
					array(
						'blockName' => 'jetpack/recurring-payments',
						'attrs'     => array(
							'planId' => 123,
						),
					),
				),
			),
		);

		$parsed_block = $this->create_parsed_block( array(), $inner_blocks );
		$mock_context = $this->create_rendering_context_mock();

		$result = \Automattic\Jetpack\Extensions\PaymentButtons\render_block_email( '', $parsed_block, $mock_context );

		// Should render the nested structure
		$this->assertNotEmpty( $result );
	}
}
