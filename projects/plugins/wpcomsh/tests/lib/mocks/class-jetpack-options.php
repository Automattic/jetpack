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
		 * @param string         $option_name Option name.
		 * @param string|boolean $default     Optional. Default false.
		 * @return mixed Option value.
		 */
		public static function get_option( $option_name, $default = false ) {
			// Handle grouped options based on their actual storage location
			if ( in_array( $option_name, array( 'master_user', 'id' ), true ) ) {
				// These are in the 'compact' group -> jetpack_options
				$compact_options = get_option( 'jetpack_options', array() );
				return isset( $compact_options[ $option_name ] ) ? $compact_options[ $option_name ] : $default;
			}

			if ( in_array( $option_name, array( 'user_tokens', 'blog_token' ), true ) ) {
				// These are in the 'private' group -> jetpack_private_options
				$private_options = get_option( 'jetpack_private_options', array() );
				return isset( $private_options[ $option_name ] ) ? $private_options[ $option_name ] : $default;
			}

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

		/**
		 * Update option.
		 *
		 * @param string $option_name Option name.
		 * @param mixed  $value       Option value.
		 * @return bool True if the option was updated, false otherwise.
		 */
		public static function update_option( $option_name, $value ) {
			return update_option( $option_name, $value );
		}

		/**
		 * Delete option.
		 *
		 * @param string $option_name Option name.
		 * @return bool True if the option was deleted, false otherwise.
		 */
		public static function delete_option( $option_name ) {
			return delete_option( $option_name );
		}

		/**
		 * Get raw option (bypass external storage).
		 *
		 * @param string $option_name Option name.
		 * @param mixed  $default     Default value.
		 * @return mixed Option value.
		 */
		public static function get_raw_option( $option_name, $default = false ) {
			return get_option( $option_name, $default );
		}

		/**
		 * Update raw option (bypass external storage).
		 *
		 * @param string    $option_name Option name.
		 * @param mixed     $value       Option value.
		 * @param bool|null $autoload    Optional. Whether to autoload the option.
		 * @return bool True if the option was updated, false otherwise.
		 */
		public static function update_raw_option( $option_name, $value, $autoload = null ) {
			return update_option( $option_name, $value, $autoload );
		}
	}
}
