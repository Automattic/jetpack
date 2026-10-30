<?php
/**
 * Mock class for WooCommerce Email Editor Table_Wrapper_Helper
 *
 * @package automattic/jetpack-videopress
 */

// Mock WooCommerce Table_Wrapper_Helper class for testing.
if ( ! class_exists( '\Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper' ) ) {
	/**
	 * Mock implementation of WooCommerce Table_Wrapper_Helper for testing.
	 */
	class Mock_WooCommerce_Table_Wrapper_Helper {
		/**
		 * Mock render_table_wrapper method.
		 *
		 * @param string $content     Table content.
		 * @param array  $table_attrs Table attributes.
		 * @return string
		 */
		public static function render_table_wrapper( $content, $table_attrs = array() ) {
			return sprintf(
				'<table class="%s" style="%s"><tbody><tr><td>%s</td></tr></tbody></table>',
				esc_attr( $table_attrs['class'] ?? '' ),
				esc_attr( $table_attrs['style'] ?? '' ),
				$content
			);
		}
	}
	class_alias( 'Mock_WooCommerce_Table_Wrapper_Helper', '\Automattic\WooCommerce\EmailEditor\Integrations\Utils\Table_Wrapper_Helper' );
}
