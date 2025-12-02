<?php
/**
 * Mock Flex Layout Renderer class for testing.
 *
 * This mock simulates the WooCommerce Email Editor's Flex_Layout_Renderer class
 * for use in unit tests without requiring the actual WooCommerce Email Editor plugin.
 *
 * @package automattic/jetpack
 */

/**
 * Mock Flex Layout Renderer class.
 */
if ( ! class_exists( '\Automattic\WooCommerce\EmailEditor\Engine\Renderer\ContentRenderer\Layout\Flex_Layout_Renderer' ) ) {
	/**
	 * Mock Flex Layout Renderer for testing.
	 */
	class Mock_Flex_Layout_Renderer {

		/**
		 * Renders inner blocks in a flex layout for email.
		 *
		 * @param array  $parsed_block The parsed block data.
		 * @param object $rendering_context The email rendering context.
		 * @return string The rendered HTML.
		 */
		public function render_inner_blocks_in_layout( $parsed_block, $rendering_context ) {
			$inner_blocks_html = '';

			if ( ! empty( $parsed_block['innerBlocks'] ) ) {
				foreach ( $parsed_block['innerBlocks'] as $inner_block ) {
					$inner_blocks_html .= '<td style="padding:5px;">';
					if ( isset( $inner_block['blockName'] ) ) {
						$inner_blocks_html .= '<!-- ' . esc_html( $inner_block['blockName'] ) . ' -->';
					}
					$inner_blocks_html .= '</td>';
				}
			}

			$width = '600px';
			if ( method_exists( $rendering_context, 'get_layout_width_without_padding' ) ) {
				$width = $rendering_context->get_layout_width_without_padding();
			}

			return sprintf(
				'<table role="presentation" style="border-collapse:collapse;width:100%%;max-width:%s;"><tr>%s</tr></table>',
				esc_attr( $width ),
				$inner_blocks_html
			);
		}
	}

	class_alias( 'Mock_Flex_Layout_Renderer', 'Automattic\WooCommerce\EmailEditor\Engine\Renderer\ContentRenderer\Layout\Flex_Layout_Renderer' );
}
