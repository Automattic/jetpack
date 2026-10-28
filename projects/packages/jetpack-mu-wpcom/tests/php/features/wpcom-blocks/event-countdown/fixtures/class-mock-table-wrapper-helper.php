<?php
/**
 * Minimal mock of the WooCommerce Email Editor Table_Wrapper_Helper so the
 * countdown email renderer can run without the optional package.
 *
 * @package automattic/jetpack-mu-wpcom
 */

if ( ! class_exists( '\Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper' ) ) {
	/**
	 * Mock Table_Wrapper_Helper covering only render_table_wrapper().
	 */
	class Mock_Table_Wrapper_Helper {
		/**
		 * Wrap content in a table.
		 *
		 * @param string $content     Table content.
		 * @param array  $table_attrs Table attributes.
		 * @param array  $cell_attrs  Cell attributes.
		 * @return string
		 */
		public static function render_table_wrapper( $content, $table_attrs = array(), $cell_attrs = array() ) {
			return '<table style="' . ( $table_attrs['style'] ?? '' ) . '"><tbody><tr><td style="' . ( $cell_attrs['style'] ?? '' ) . '">' . $content . '</td></tr></tbody></table>';
		}
	}
	class_alias( 'Mock_Table_Wrapper_Helper', '\Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper' );
}
