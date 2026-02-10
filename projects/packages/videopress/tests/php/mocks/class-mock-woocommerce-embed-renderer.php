<?php
/**
 * Mock class for WooCommerce Email Editor Embed Renderer
 *
 * @package automattic/jetpack-videopress
 */

// Mock WooCommerce Embed Renderer class for testing.
if ( ! class_exists( '\Automattic\WooCommerce\EmailEditor\Integrations\Core\Renderer\Blocks\Embed' ) ) {
	/**
	 * Mock implementation of WooCommerce Embed Renderer for testing.
	 */
	class Mock_WooCommerce_Embed_Renderer {
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
			$url   = $attrs['url'] ?? '';

			if ( empty( $url ) ) {
				return '';
			}

			$provider = $attrs['providerNameSlug'] ?? 'unknown';

			// Return simple HTML that tests can verify.
			return sprintf(
				'<div class="email-embed-video" data-provider="%s"><a href="%s">Watch Video</a></div>',
				esc_attr( $provider ),
				esc_url( $url )
			);
		}
	}
	class_alias( 'Mock_WooCommerce_Embed_Renderer', '\Automattic\WooCommerce\EmailEditor\Integrations\Core\Renderer\Blocks\Embed' );
}
