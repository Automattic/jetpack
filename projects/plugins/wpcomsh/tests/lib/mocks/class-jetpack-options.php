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

		/**
		 * Returns the requested option, and ensures it's autoloaded in the future.
		 * This does _not_ adjust the prefix in any way (does not prefix jetpack_%)
		 *
		 * @param string $name Option name.
		 * @param mixed  $default (optional).
		 *
		 * @return mixed
		 */
		public static function get_option_and_ensure_autoload( $name, $default ) {
			return self::get_option( $name, $default );
		}
	}
}
