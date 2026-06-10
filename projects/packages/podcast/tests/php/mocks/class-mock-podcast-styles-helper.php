<?php
/**
 * Minimal mock of the WooCommerce Email Editor Styles_Helper so the podcast
 * email renderer can be exercised without the optional package.
 *
 * @package automattic/jetpack-podcast
 */

if ( ! class_exists( '\Automattic\WooCommerce\EmailEditor\Integrations\Utils\Styles_Helper' ) ) {
	/**
	 * Mock Styles_Helper covering only the methods render_email() calls.
	 */
	class Mock_Podcast_Styles_Helper {
		/**
		 * Parse the leading numeric part of a CSS value (e.g. "600px" → 600.0).
		 *
		 * @param mixed $value Value to parse.
		 * @return float
		 */
		public static function parse_value( $value ) {
			if ( is_numeric( $value ) ) {
				return (float) $value;
			}
			if ( is_string( $value ) && preg_match( '/^\s*(-?\d+(?:\.\d+)?)/', $value, $m ) ) {
				return (float) $m[1];
			}
			return 0.0;
		}

		/**
		 * Return no user-set block styles. Parameters mirror the real signature
		 * but are unused by the mock.
		 *
		 * @param array  $block_attributes  Block attributes.
		 * @param object $rendering_context Rendering context.
		 * @param array  $properties        Requested style properties.
		 * @return array
		 */
		public static function get_block_styles( $block_attributes, $rendering_context, $properties ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			return array( 'css' => '' );
		}
	}
	class_alias( 'Mock_Podcast_Styles_Helper', '\Automattic\WooCommerce\EmailEditor\Integrations\Utils\Styles_Helper' );
}
