<?php
/**
 * Mock class for WooCommerce Email Editor core/video Renderer
 *
 * @package automattic/jetpack-videopress
 */

// Mock WooCommerce core/video Renderer class for testing.
if ( ! class_exists( '\Automattic\WooCommerce\EmailEditor\Integrations\Core\Renderer\Blocks\Video' ) ) {
	/**
	 * Mock implementation of WooCommerce core/video renderer for testing.
	 */
	class Mock_WooCommerce_Video_Renderer {
		/**
		 * Mock render method.
		 *
		 * @param string $block_content     The block content.
		 * @param array  $parsed_block      The parsed block data.
		 * @param object $rendering_context The email rendering context.
		 * @return string
		 */
		public function render( $block_content, $parsed_block, $rendering_context ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			$attrs  = $parsed_block['attrs'] ?? array();
			$poster = $attrs['poster'] ?? '';

			// Mirror the real renderer: no poster means no output.
			if ( empty( $poster ) ) {
				return '';
			}

			// Return simple HTML that tests can verify.
			return sprintf( '<div class="email-core-video"><img src="%s" /></div>', esc_url( $poster ) );
		}
	}
	class_alias( 'Mock_WooCommerce_Video_Renderer', '\Automattic\WooCommerce\EmailEditor\Integrations\Core\Renderer\Blocks\Video' );
}
