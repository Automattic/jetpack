<?php
/**
 * Storage Provider Interface for External Storage.
 *
 * Defines the contract that all external storage providers must implement
 * to be compatible with the Jetpack Connection External Storage system.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

/**
 * Interface for external storage providers.
 *
 * All storage providers must implement this interface to ensure
 * compatibility with the External_Storage system.
 *
 * @since 6.18.0
 */
interface Storage_Provider_Interface {

	/**
	 * Check if the storage provider is available in the current environment.
	 *
	 * This method should return true if the storage backend is accessible
	 * and ready to handle requests, false otherwise.
	 *
	 * @since 6.18.0
	 *
	 * @return bool True if storage is available, false otherwise.
	 */
	public function is_available();

	/**
	 * Determine if this provider should handle the given option.
	 *
	 * This method allows providers to selectively handle certain options
	 * based on their configuration, environment, or other criteria.
	 *
	 * @since 6.18.0
	 *
	 * @param string $option_name The name of the option to check.
	 * @return bool True if this provider should handle the option, false otherwise.
	 */
	public function should_handle( $option_name );

	/**
	 * Retrieve a value from external storage.
	 *
	 * This method should return the value from external storage, or null
	 * if the value is not found or cannot be retrieved.
	 *
	 * @since 6.18.0
	 *
	 * @param string $option_name The name of the option to retrieve.
	 * @return mixed The option value, or null if not found/available.
	 * @throws \Exception If there's an error retrieving the value.
	 */
	public function get( $option_name );

	/**
	 * Get the environment identifier for this provider.
	 *
	 * This method should return a unique identifier for the environment
	 * or storage type (e.g., 'atomic', 'vip', 'kubernetes', etc.).
	 * Used for logging and debugging purposes.
	 *
	 * @since 6.18.0
	 *
	 * @return string The environment identifier.
	 */
	public function get_environment_id();
}
