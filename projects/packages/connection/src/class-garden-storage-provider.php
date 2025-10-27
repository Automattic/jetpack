<?php
/**
 * Garden Storage Provider for Jetpack Connection.
 *
 * Provides external storage implementation for the Garden environment (WP Cloud)
 * using the Atomic_Persistent_Data class.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

/**
 * Garden Storage Provider class.
 *
 * Retrieves connection blog tokens from Atomic_Persistent_Data in the Garden environment.
 *
 * @since 6.18.0
 */
class Garden_Storage_Provider implements Storage_Provider_Interface {

	/**
	 * Check if the storage provider is available in the current environment.
	 *
	 * @since 6.18.0
	 *
	 * @return bool True if Atomic_Persistent_Data class exists, false otherwise.
	 */
	public function is_available() {
		return class_exists( 'Atomic_Persistent_Data' );
	}

	/**
	 * Determine if this provider should handle the given option.
	 *
	 * Handles both 'blog_token' and 'id' (blog_id) options.
	 *
	 * @since 6.18.0
	 *
	 * @param string $option_name The name of the option to check.
	 * @return bool True if this provider should handle the option, false otherwise.
	 */
	public function should_handle( $option_name ) {
		return in_array( $option_name, array( 'blog_token', 'id' ), true );
	}

	/**
	 * Retrieve a value from Atomic_Persistent_Data.
	 *
	 * @since 6.18.0
	 *
	 * @param string $option_name The name of the option to retrieve.
	 * @return mixed The option value from Atomic_Persistent_Data, or null if not found.
	 * @throws \Exception If there's an error retrieving the value.
	 */
	public function get( $option_name ) {
		if ( ! $this->is_available() ) {
			return null;
		}

		try {
			$persistent_data = new \Atomic_Persistent_Data();

			switch ( $option_name ) {
				case 'blog_token':
					return $persistent_data->JETPACK_BLOG_TOKEN; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

				case 'id':
					$blog_id = $persistent_data->JETPACK_BLOG_ID; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
					return $blog_id ? intval( $blog_id ) : null;
			}

			return null;
		} catch ( \Exception $e ) {
			// Re-throw for External_Storage to handle logging
			throw new \Exception(
				sprintf(
					'Failed to retrieve %s from Atomic_Persistent_Data: %s',
					$option_name,
					$e->getMessage()
				)
			);
		}
	}

	/**
	 * Get the environment identifier for this provider.
	 *
	 * @since 6.18.0
	 *
	 * @return string The environment identifier 'garden'.
	 */
	public function get_environment_id() {
		return 'garden';
	}
}
