<?php
/**
 * Mock class for WooCommerce Email Editor Video Renderer
 *
 * @package automattic/jetpack-videopress
 */

// Mock WooCommerce Video Renderer class for testing.
if ( ! class_exists( '\Automattic\WooCommerce\EmailEditor\Integrations\Core\Renderer\Blocks\Video' ) ) {
	/**
	 * Mock implementation of WooCommerce Video Renderer for testing.
	 */
	class Mock_WooCommerce_Video_Renderer {
		/**
		 * Mock render method.
		 *
		 * @param string $block_content The block content.
		 * @param array  $parsed_block  The parsed block data.
		 * @param object $rendering_context The email rendering context.
		 * @return string
		 */
		public function render( $block_content, $parsed_block, $rendering_context ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			$attrs = $parsed_block['attrs'] ?? array();

			if ( empty( $attrs['poster'] ) ) {
				return '';
			}

			return sprintf(
				'<div class="email-video" data-poster="%s"><a href="%s">Play</a></div>',
				esc_url( $attrs['poster'] ),
				esc_url( $attrs['videoUrl'] ?? '' )
			);
		}
	}
	class_alias( 'Mock_WooCommerce_Video_Renderer', '\Automattic\WooCommerce\EmailEditor\Integrations\Core\Renderer\Blocks\Video' );
}
