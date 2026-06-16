<?php
/**
 * Minimal mock of the WooCommerce Email Editor Table_Wrapper_Helper so the
 * podcast email renderer can be exercised without the optional package.
 *
 * @package automattic/jetpack-podcast
 */

if ( ! class_exists( '\Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper' ) ) {
	/**
	 * Mock Table_Wrapper_Helper covering only the methods render_email() calls.
	 */
	class Mock_Podcast_Table_Wrapper_Helper {
		/**
		 * Wrap content in a table cell.
		 *
		 * @param string $content    Cell content.
		 * @param array  $cell_attrs Cell attributes.
		 * @return string
		 */
		public static function render_table_cell( $content, $cell_attrs = array() ) {
			return '<td style="' . ( $cell_attrs['style'] ?? '' ) . '">' . $content . '</td>';
		}

		/**
		 * Wrap content in a table.
		 *
		 * @param string $content     Table content.
		 * @param array  $table_attrs Table attributes.
		 * @param array  $cell_attrs  Cell attributes.
		 * @param array  $row_attrs   Row attributes.
		 * @param bool   $render_cell Whether to wrap content in a cell first.
		 * @return string
		 */
		public static function render_table_wrapper( $content, $table_attrs = array(), $cell_attrs = array(), $row_attrs = array(), $render_cell = true ) {
			if ( $render_cell ) {
				$content = self::render_table_cell( $content, $cell_attrs );
			}
			return '<table style="' . ( $table_attrs['style'] ?? '' ) . '"><tbody><tr>' . $content . '</tr></tbody></table>';
		}
	}
	class_alias( 'Mock_Podcast_Table_Wrapper_Helper', '\Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper' );
}
