<?php
/**
 * Atomic Persistent Data storage provider for Jetpack Connection data.
 *
 * @package wpcomsh
 */

// Only define the class if the interface is available
if ( interface_exists( 'Automattic\Jetpack\Connection\Storage_Provider_Interface' ) ) {

	/**
	 * Atomic Persistent Data storage provider for Jetpack Connection data.
	 * Stage 1: Read-only support for blog_token and id (blog_id).
	 *
	 * @since 8.0.0
	 */
	class Atomic_Storage_Provider implements \Automattic\Jetpack\Connection\Storage_Provider_Interface {

		/**
		 * Check if Atomic Persistent Data is available in current environment.
		 *
		 * @return bool True if available, false otherwise.
		 */
		public function is_available() {
			return class_exists( 'Atomic_Persistent_Data' );
		}

		/**
		 * Check if this provider should handle the given option.
		 *
		 * @param string $option_name The option name to check.
		 * @return bool True if this provider should handle the option.
		 */
		public function should_handle( $option_name ) {
			// Handle blog connection data by default
			return in_array( $option_name, array( 'blog_token', 'id' ), true );
		}

		/**
		 * Get value from Atomic Persistent Data.
		 *
		 * @param string $option_name The option name to retrieve.
		 * @return mixed The option value, or null if not found.
		 */
		public function get( $option_name ) {
			$persistent_data = new Atomic_Persistent_Data();

			switch ( $option_name ) {
				case 'blog_token':
					return $persistent_data->JETPACK_BLOG_TOKEN; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

				case 'id':
					$blog_id = $persistent_data->JETPACK_BLOG_ID; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
					return $blog_id ? intval( $blog_id ) : null;
			}

			return null;
		}

		/**
		 * Get environment identifier for logging.
		 *
		 * @return string Environment identifier.
		 */
		public function get_environment_id() {
			return 'woa';
		}
	}

}
