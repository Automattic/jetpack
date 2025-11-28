<?php
/**
 * Payment Buttons Block Email Rendering tests
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/payment-buttons/payment-buttons.php';

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
	 * Test render_block_email returns empty when class is missing.
	 */
	public function test_render_block_email_returns_empty_when_class_missing() {
		if ( class_exists( '\Automattic\WooCommerce\EmailEditor\Engine\Renderer\ContentRenderer\Layout\Flex_Layout_Renderer' ) ) {
			$this->markTestSkipped( 'Flex Layout Renderer class already exists' );
		}

		$mock_context = $this->create_rendering_context_mock();

		$parsed_block = array(
			'blockName'   => 'jetpack/payment-buttons',
			'innerBlocks' => array(),
		);

		$result = \Automattic\Jetpack\Extensions\PaymentButtons\render_block_email( '', $parsed_block, $mock_context );

		$this->assertSame( '', $result );
	}

	/**
	 * Test render_block_email renders two buttons.
	 */
	public function test_render_block_email_with_valid_payment_buttons() {
		require_once __DIR__ . '/mocks/class-mock-flex-layout-renderer.php';

		$mock_context = $this->create_rendering_context_mock();

		$parsed_block = array(
			'blockName'   => 'jetpack/payment-buttons',
			'innerBlocks' => array(
				array(
					'blockName' => 'jetpack/recurring-payments',
				),
				array(
					'blockName' => 'jetpack/recurring-payments',
				),
			),
		);

		$result      = \Automattic\Jetpack\Extensions\PaymentButtons\render_block_email( '', $parsed_block, $mock_context );
		$block_count = substr_count( $result, 'jetpack/recurring-payments' );

		$this->assertSame( 2, $block_count );
	}

	/**
	 * Test render_block_email render with no inner blocks.
	 */
	public function test_render_block_email_with_no_inner_blocks() {
		require_once __DIR__ . '/mocks/class-mock-flex-layout-renderer.php';

		$mock_context = $this->create_rendering_context_mock();

		$parsed_block = array(
			'blockName'   => 'jetpack/payment-buttons',
			'innerBlocks' => array(),
		);

		$result = \Automattic\Jetpack\Extensions\PaymentButtons\render_block_email( '', $parsed_block, $mock_context );

		// Expected result is an empty table.
		$this->assertSame( '<table role="presentation" style="border-collapse:collapse;width:100%;max-width:600px;"><tr></tr></table>', $result );
	}
}
