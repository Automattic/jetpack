<?php
/**
 * Mock class for WooCommerce Email Editor Button Renderer
 *
 * @package automattic/jetpack
 */

// Mock WooCommerce Button Renderer class for testing
if ( ! class_exists( '\Automattic\WooCommerce\EmailEditor\Integrations\Core\Renderer\Blocks\Button' ) ) {
	/**
	 * Mock implementation of WooCommerce Button Renderer for testing
	 */
	class Mock_WooCommerce_Button_Renderer {
		/**
		 * Mock render method
		 *
		 * @param string $block_content The block content.
		 * @param array  $parsed_block  The parsed block data.
		 * @param object $rendering_context The email rendering context.
		 * @return string
		 */
		public function render( $block_content, $parsed_block, $rendering_context ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			$attributes = $parsed_block['attrs'] ?? array();
			$inner_html = $parsed_block['innerHTML'] ?? '';

			// Extract button text and URL from innerHTML
			preg_match( '/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/', $inner_html, $matches );
			$url  = $matches[1] ?? '#';
			$text = $matches[2] ?? 'Click here';

			// Build styles from attributes
			$styles = array();

			// Background color - named colors go in backgroundColor, hex colors go in style.color.background
			if ( ! empty( $attributes['backgroundColor'] ) ) {
				$styles[] = 'background-color:' . $attributes['backgroundColor'];
			}
			if ( ! empty( $attributes['style']['color']['background'] ) ) {
				$styles[] = 'background-color:' . $attributes['style']['color']['background'];
			}

			// Text color - named colors go in textColor, hex colors go in style.color.text
			if ( ! empty( $attributes['textColor'] ) ) {
				$styles[] = 'color:' . $attributes['textColor'];
			}
			if ( ! empty( $attributes['style']['color']['text'] ) ) {
				$styles[] = 'color:' . $attributes['style']['color']['text'];
			}

			// Typography
			if ( ! empty( $attributes['style']['typography']['fontSize'] ) ) {
				$styles[] = 'font-size:' . $attributes['style']['typography']['fontSize'];
			}

			// Borders
			if ( ! empty( $attributes['borderColor'] ) ) {
				$styles[] = 'border-color:' . $attributes['borderColor'];
			}
			if ( ! empty( $attributes['style']['border']['color'] ) ) {
				$styles[] = 'border-color:' . $attributes['style']['border']['color'];
			}
			if ( ! empty( $attributes['style']['border']['radius'] ) ) {
				$radius = $attributes['style']['border']['radius'];
				// Cap border radius at 50px for email compatibility
				if ( is_numeric( str_replace( 'px', '', $radius ) ) && (int) str_replace( 'px', '', $radius ) > 50 ) {
					$radius = '50px';
				}
				$styles[] = 'border-radius:' . $radius;
			}
			if ( ! empty( $attributes['style']['border']['width'] ) ) {
				$styles[] = 'border-width:' . $attributes['style']['border']['width'];
			}

			// Handle padding
			if ( ! empty( $attributes['style']['spacing']['padding'] ) ) {
				$styles[] = 'padding:' . $attributes['style']['spacing']['padding'];
			}

			$style_attr = ! empty( $styles ) ? ' style="' . implode( ';', $styles ) . '"' : ''; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

			// Build the button HTML
			$button_html = sprintf(
				'<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;line-height:100%%;max-width:800px;width:100%%;"><tr><td align="center" bgcolor="#113AF5" role="presentation" style="border:none;border-radius:3px;cursor:auto;mso-padding-alt:10px 25px;background:#113AF5;" valign="middle"><a href="%s" style="display:inline-block;background:#113AF5;border:1px solid #113AF5;border-radius:3px;color:#ffffff;font-family: Arial, sans-serif;font-size:16px;font-weight:400;line-height:120%%;margin:0;text-decoration:none;text-transform:none;padding:10px 25px;mso-padding-alt:0px;border-radius:3px;%s" target="_blank">%s</a></td></tr></table>',
				esc_url( $url ),
				implode( ';', $styles ),
				esc_html( $text )
			);

			return $button_html;
		}
	}
	class_alias( 'Mock_WooCommerce_Button_Renderer', '\Automattic\WooCommerce\EmailEditor\Integrations\Core\Renderer\Blocks\Button' );
}
