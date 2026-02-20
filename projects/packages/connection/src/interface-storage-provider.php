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
 * ## Required Methods
 *
 * - `is_available()` - Check if storage backend is accessible
 * - `should_handle( $option_name )` - Determine if provider handles the option
 * - `get( $option_name )` - Retrieve value from external storage
 * - `get_environment_id()` - Return environment identifier for logging
 *
 * ## Optional Methods
 *
 * Providers may implement these additional methods for enhanced functionality:
 *
 * ### handle_error_event( string $event_type, string $key, string $details, string $environment )
 *
 * Called when External_Storage detects an error or empty state. Implement this
 * to report errors to your host's monitoring system.
 *
 * - `$event_type` - 'error' or 'empty'
 * - `$key` - The option key that triggered the event
 * - `$details` - Additional error details (error message, etc.)
 * - `$environment` - Environment identifier from get_environment_id()
 *
 * Example:
 *
 *     public function handle_error_event( $event_type, $key, $details, $environment ) {
 *         // Report to your monitoring system
 *         wp_remote_post(
 *             'https://your-api/errors',
 *             array(
 *                 'body' => array(
 *                     'event_type'  => $event_type,
 *                     'key'         => $key,
 *                     'details'     => $details,
 *                     'environment' => $environment,
 *                 ),
 *             )
 *         );
 *     }
 *
 * ### get_empty_state_delay_threshold()
 *
 * Customize the delay before reporting empty states. Returns delay in seconds.
 * Default (when not implemented) is 5 minutes (300 seconds). Use this if your
 * storage system has different sync times.
 *
 * - Return `0` if external storage is the source of truth (written first)
 * - Return higher values for slower sync systems
 * - Maximum allowed value is 15 minutes (900 seconds); values above this are ignored
 *
 * Example:
 *
 *     public function get_empty_state_delay_threshold() {
 *         return 90; // 90 seconds for fast-syncing storage
 *         // return 0; // No delay - external storage is written first
 *     }
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
