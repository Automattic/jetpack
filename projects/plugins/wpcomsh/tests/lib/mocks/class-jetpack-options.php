<?php
/**
 * Jetpack Options file.
 *
 * @package wpcomsh
 */

/**
 * Mock for Jetpack_Options.
 */
if ( ! class_exists( 'Jetpack_Options' ) ) {
	/**
	 * Class Jetpack_Options.
	 */
	class Jetpack_Options {

		/**
		 * Get option.
		 *
		 * @param string        $option_name Option name.
		 * @param string|boolen $default     Optional. Default false.
		 * @return mixed Option value.
		 */
		public static function get_option( $option_name, $default = false ) { // phpcs:ignore Universal.NamingConventions.NoReservedKeywordParameterNames.defaultFound
			return apply_filters( 'jetpack_options', get_option( $option_name, $default ), $option_name );
		}
	}
}
