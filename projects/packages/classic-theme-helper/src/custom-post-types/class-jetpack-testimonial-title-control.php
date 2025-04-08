<?php
/**
 * Helper class for the Jetpack Testimonial Title Control.
 *
 * @package automattic/jetpack-classic-theme-helper
 */

namespace Automattic\Jetpack\Classic_Theme_Helper;

if ( ! class_exists( __NAMESPACE__ . '\Jetpack_Testimonial_Title_Control' ) ) {
	/**
	 * Extends the WP_Customize_Control class to clean the title parameter.
	 */
	class Jetpack_Testimonial_Title_Control extends \WP_Customize_Control {
		/**
		 * Sanitize content passed to control.
		 *
		 * @param string $value Control value.
		 * @return string Sanitized value.
		 */
		public static function sanitize_content( $value ) {
			if ( '' != $value ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseNotEqual -- handle non-string inputs gracefully.
				$value = trim( convert_chars( wptexturize( $value ) ) );
			}
			return $value;
		}
	}
}
