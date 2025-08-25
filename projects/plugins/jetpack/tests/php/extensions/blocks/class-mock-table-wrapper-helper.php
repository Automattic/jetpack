<?php
/**
 * Mock class for WooCommerce Email Editor Table_Wrapper_Helper
 *
 * @package automattic/jetpack
 */

// Mock Table_Wrapper_Helper class for testing
if ( ! class_exists( '\Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper' ) ) {
	/**
	 * Mock implementation of Table_Wrapper_Helper for testing
	 */
	class Mock_Table_Wrapper_Helper {
		/**
		 * Mock render_table_wrapper method
		 *
		 * @param string $content    The content to wrap.
		 * @param array  $attributes The table attributes.
		 * @return string The wrapped table HTML.
		 */
		public static function render_table_wrapper( $content, $attributes ) {
			// Simple mock that wraps content in a table
			$style = $attributes['style'] ?? '';
			$width = $attributes['width'] ?? 600;

			return sprintf(
				'<table role="presentation" style="width: 100%%; max-width: %dpx; margin: 16px auto; border-collapse: collapse; padding: 0; %s">',
				$width,
				$style
			) . '<tr><td style="padding: 0; font-family: Arial, sans-serif;">' . $content . '</td></tr></table>';
		}
	}
	class_alias( 'Mock_Table_Wrapper_Helper', '\Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper' );
}
