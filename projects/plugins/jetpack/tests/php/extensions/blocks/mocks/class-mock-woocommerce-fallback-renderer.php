<?php
/**
 * Mock class for WooCommerce Email Editor Fallback Renderer
 *
 * @package automattic/jetpack
 */

// Mock WooCommerce Fallback Renderer class for testing
if ( ! class_exists( '\Automattic\WooCommerce\EmailEditor\Integrations\Core\Renderer\Blocks\Fallback' ) ) {
	/**
	 * Mock implementation of WooCommerce Fallback Renderer for testing
	 */
	class Mock_WooCommerce_Fallback_Renderer {
		/**
		 * Mock render method
		 *
		 * The real renderer wraps the content in a spacer and a table. Only the pass-through
		 * matters here, so a caller can assert what it handed over.
		 *
		 * @param string $block_content     The block content.
		 * @param array  $parsed_block      The parsed block data.
		 * @param object $rendering_context The email rendering context.
		 * @return string
		 */
		public function render( $block_content, $parsed_block, $rendering_context ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			return '<table role="presentation" width="100%"><tr><td>' . $block_content . '</td></tr></table>';
		}
	}
	class_alias( 'Mock_WooCommerce_Fallback_Renderer', '\Automattic\WooCommerce\EmailEditor\Integrations\Core\Renderer\Blocks\Fallback' );
}
