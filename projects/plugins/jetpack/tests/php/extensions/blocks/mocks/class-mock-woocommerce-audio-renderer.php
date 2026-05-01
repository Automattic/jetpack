<?php
/**
 * Mock class for WooCommerce Email Editor Audio Renderer
 *
 * @package automattic/jetpack
 */

// Mock WooCommerce Audio Renderer class for testing
if ( ! class_exists( '\Automattic\WooCommerce\EmailEditor\Integrations\Core\Renderer\Blocks\Audio' ) ) {
	/**
	 * Mock implementation of WooCommerce Audio Renderer for testing
	 */
	class Mock_WooCommerce_Audio_Renderer {
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

			// Get URL from attrs or extract from block_content
			$url = $attributes['src'] ?? '';
			if ( empty( $url ) && preg_match( '#<audio[^>]*\ssrc=["\']([^"\']*)["\'][^>]*/?>#', $block_content, $matches ) ) {
				$url = $matches[1] ?? '';
			}

			if ( empty( $url ) ) {
				return '';
			}

			$label = $attributes['label'] ?? __( 'Listen to the audio', 'jetpack' );

			// Get spacing from email_attrs
			$email_attrs        = $parsed_block['email_attrs'] ?? array();
			$table_margin_style = '';

			if ( ! empty( $email_attrs ) && class_exists( '\WP_Style_Engine' ) ) {
				$table_margin_style = \WP_Style_Engine::compile_css( array_intersect_key( $email_attrs, array_flip( array( 'margin' ) ) ), '' );
			}

			// Use CDN URL for icon in mock
			// This ensures the mock works in tests without requiring actual icon files
			$icon_image = 'https://s0.wp.com/i/emails/wpcom-notifications/audio-play.png';
			$audio_url  = esc_url( $url );

			// Define pill-style colors and styling
			$background_color = '#f6f7f7';
			$border_color     = '#AAA';
			$icon_size        = '18px';

			// Generate the icon content
			$icon_content = sprintf(
				'<a href="%1$s" rel="noopener nofollow" target="_blank" style="padding: 0.25em; padding-left: 17px; display: inline-block; vertical-align: middle;"><img height="%2$s" src="%3$s" style="display:block;margin-right:0;vertical-align:middle;" width="%2$s" alt="%4$s"></a>',
				$audio_url,
				esc_attr( $icon_size ),
				esc_url( $icon_image ),
				// translators: %s is the audio player icon.
				sprintf( __( '%s icon', 'jetpack' ), __( 'Audio', 'jetpack' ) )
			);

			// Generate the label content
			$label_content = sprintf(
				'<a href="%1$s" rel="noopener nofollow" target="_blank" style="text-decoration:none; padding: 0.25em; padding-right: 17px; display: inline-block;"><span style="margin-left:.5em;margin-right:.5em;font-weight:bold"> %2$s </span></a>',
				$audio_url,
				esc_html( $label )
			);

			// Combine icon and label
			$audio_content = $icon_content . $label_content;

			// Create the main pill-style table
			$main_table_styles = sprintf(
				'background-color: %s; border-radius: 9999px; float: none; border: 1px solid %s; border-collapse: separate;',
				$background_color,
				$border_color
			);

			$main_table = sprintf(
				'<table role="presentation" align="left" style="%s"><tr><td>%s</td></tr></table>',
				esc_attr( $main_table_styles ),
				$audio_content
			);

			// Create the main wrapper table
			$table_style = 'width: 100%;';
			if ( ! empty( $table_margin_style ) ) {
				$table_style = $table_margin_style . '; ' . $table_style;
			} else {
				$table_style = 'margin: 16px 0; ' . $table_style;
			}

			return sprintf(
				'<table role="presentation" style="%s"><tr><td style="min-width: 100%%; vertical-align: middle; word-break: break-word; text-align: left;">%s</td></tr></table>',
				esc_attr( $table_style ),
				$main_table
			);
		}
	}
	class_alias( 'Mock_WooCommerce_Audio_Renderer', '\Automattic\WooCommerce\EmailEditor\Integrations\Core\Renderer\Blocks\Audio' );
}
