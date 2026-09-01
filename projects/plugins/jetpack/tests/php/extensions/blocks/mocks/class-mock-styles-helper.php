<?php
/**
 * Mock class for WooCommerce Email Editor Styles_Helper
 *
 * @package automattic/jetpack
 */

// Mock Styles_Helper class for testing
if ( ! class_exists( '\Automattic\WooCommerce\EmailEditor\Integrations\Utils\Styles_Helper' ) ) {
	/**
	 * Mock implementation of Styles_Helper for testing
	 */
	class Mock_Styles_Helper {
		/**
		 * Mock parse_value method
		 *
		 * @param string $value The value to parse.
		 * @return int The parsed value.
		 */
		public static function parse_value( $value ) {
			// Simple mock that extracts numeric value from "800px" format
			if ( is_string( $value ) && preg_match( '/^(\d+)px$/', $value, $matches ) ) {
				return (int) $matches[1];
			}
			return 600; // Default fallback
		}
	}
	class_alias( 'Mock_Styles_Helper', '\Automattic\WooCommerce\EmailEditor\Integrations\Utils\Styles_Helper' );
}
