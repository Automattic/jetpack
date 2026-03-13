<?php
/**
 * Mock class for WooCommerce Email Editor Gallery Renderer
 *
 * @package automattic/jetpack
 */

// Mock WooCommerce Gallery Renderer class for testing
if ( ! class_exists( '\Automattic\WooCommerce\EmailEditor\Integrations\Core\Renderer\Blocks\Gallery' ) ) {
	/**
	 * Mock implementation of WooCommerce Gallery Renderer for testing
	 */
	class Mock_WooCommerce_Gallery_Renderer {
		/**
		 * Mock render method
		 *
		 * @param string $block_content The block content.
		 * @param array  $parsed_block  The parsed block data.
		 * @param object $rendering_context The email rendering context.
		 * @return string
		 */
		public function render( $block_content, $parsed_block, $rendering_context ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			$inner_blocks = $parsed_block['innerBlocks'] ?? array();
			$attributes   = $parsed_block['attrs'] ?? array();
			$columns      = $attributes['columns'] ?? 3;

			if ( empty( $inner_blocks ) ) {
				return '';
			}

			// Extract images from innerBlocks
			$gallery_images = array();
			foreach ( $inner_blocks as $block ) {
				if ( 'core/image' === $block['blockName'] && isset( $block['innerHTML'] ) ) {
					// Extract image HTML from innerHTML
					if ( preg_match( '/<img[^>]*>/', $block['innerHTML'], $img_matches ) ) {
						$img_html = $img_matches[0];

						// Extract caption if present
						if ( preg_match( '/<figcaption[^>]*>(.*?)<\/figcaption>/s', $block['innerHTML'], $caption_matches ) ) {
							$caption   = wp_kses_post( trim( $caption_matches[1] ) );
							$img_html .= '<br><div class="wp-element-caption" style="font-size: 13px; line-height: 1.0;">' . $caption . '</div>';
						}

						$gallery_images[] = $img_html;
					}
				}
			}

			if ( empty( $gallery_images ) ) {
				return '';
			}

			// Build table-based layout
			$content_parts = array();
			$image_count   = count( $gallery_images );
			$cell_padding  = 8;

			// Process images in chunks based on columns
			for ( $i = 0; $i < $image_count; $i += $columns ) {
				$row_images = array_slice( $gallery_images, $i, $columns );
				$row_cells  = '';

				foreach ( $row_images as $image_html ) {
					$cell_width_percent = 100 / count( $row_images );
					$row_cells         .= sprintf(
						'<td style="width: %.2f%%; padding: %dpx; vertical-align: top; text-align: center;" valign="top">%s</td>',
						$cell_width_percent,
						$cell_padding,
						$image_html
					);
				}

				$content_parts[] = sprintf(
					'<table role="presentation" style="width: 100%%; border-collapse: collapse; table-layout: fixed;"><tr>%s</tr></table>',
					$row_cells
				);
			}

			// Wrap in main table
			return sprintf(
				'<table role="presentation" class="email-block-gallery" style="width: 100%%; border-collapse: collapse; text-align: left;" align="left" width="100%%"><tr><td>%s</td></tr></table>',
				implode( '', $content_parts )
			);
		}
	}
	class_alias( 'Mock_WooCommerce_Gallery_Renderer', '\Automattic\WooCommerce\EmailEditor\Integrations\Core\Renderer\Blocks\Gallery' );
}
