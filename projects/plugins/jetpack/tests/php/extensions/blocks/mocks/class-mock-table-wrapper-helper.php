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
		 * @param string $content     The content to wrap.
		 * @param array  $table_attrs Table attributes.
		 * @param array  $cell_attrs  Cell attributes.
		 * @param array  $row_attrs   Row attributes.
		 * @param bool   $render_cell Whether to render the td wrapper.
		 * @return string The wrapped table HTML.
		 */
		public static function render_table_wrapper( $content, $table_attrs = array(), $cell_attrs = array(), $row_attrs = array(), $render_cell = true ) {
			// Simple mock that wraps content in a table
			$style = $table_attrs['style'] ?? '';
			$width = $table_attrs['width'] ?? 600;

			$table_html = sprintf(
				'<table role="presentation" style="width: 100%%; max-width: %dpx; margin: 16px auto; border-collapse: collapse; padding: 0; %s">',
				$width,
				$style
			);

			if ( $render_cell ) {
				$cell_style = $cell_attrs['style'] ?? '';
				$content    = '<td style="padding: 0; font-family: Arial, sans-serif; ' . $cell_style . '">' . $content . '</td>';
			}

			return $table_html . '<tr>' . $content . '</tr></table>';
		}

		/**
		 * Mock render_table_cell method
		 *
		 * @param string $content    The content to wrap in a cell.
		 * @param array  $attributes The cell attributes.
		 * @return string The wrapped cell HTML.
		 */
		public static function render_table_cell( $content, $attributes ) {
			// Simple mock that wraps content in a table cell
			$style = $attributes['style'] ?? '';

			return sprintf(
				'<td style="%s">%s</td>',
				$style,
				$content
			);
		}

		/**
		 * Mock render_outlook_table_wrapper method
		 *
		 * @param string $content    The content to wrap.
		 * @param array  $attributes The table attributes.
		 * @return string The wrapped table HTML.
		 */
		public static function render_outlook_table_wrapper( $content, $attributes ) {
			// Simple mock that wraps content in a table for Outlook compatibility
			$style = $attributes['style'] ?? '';
			$align = $attributes['align'] ?? 'left';

			return sprintf(
				'<table role="presentation" style="width: 100%%; max-width: 600px; margin: 16px auto; border-collapse: collapse; padding: 0; text-align: %s; %s">',
				$align,
				$style
			) . '<tr><td style="padding: 0; font-family: Arial, sans-serif;">' . $content . '</td></tr></table>';
		}
	}
	class_alias( 'Mock_Table_Wrapper_Helper', '\Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper' );
}
