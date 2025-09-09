<?php
/**
 * Jetpack Connection handlers for wpcomsh.
 *
 * Initialization for:
 * - External Storage (Atomic Persistent Data)
 * - Protected Owner Error Handler
 *
 * @package wpcomsh
 */

// Load required classes
require_once __DIR__ . '/class-atomic-storage-provider.php';
require_once __DIR__ . '/class-protected-owner-error-handler.php';

/**
 * Initialize Jetpack Connection handlers.
 */
function wpcomsh_init_connection_handlers() {
	wpcomsh_init_external_storage();
	wpcomsh_init_protected_owner_handler();
}

/**
 * Initialize external storage provider for Jetpack connection data.
 */
function wpcomsh_init_external_storage() {
	// Only initialize if both External_Storage class and our provider class are available
	if ( class_exists( 'Automattic\Jetpack\Connection\External_Storage' ) && class_exists( 'Atomic_Storage_Provider' ) ) {
		// In test environment, register a test-friendly provider that doesn't log
		if ( defined( 'PHPUNIT_JETPACK_TESTSUITE' ) ) {
			$test_provider = new class() implements \Automattic\Jetpack\Connection\Storage_Provider_Interface {
				/**
				 * Check if storage provider is available.
				 *
				 * @return bool Always false in tests to avoid logging.
				 */
				public function is_available() {
					return false; // Return false to avoid logging
				}

				/**
				 * Check if this provider should handle the given option.
				 *
				 * @param string $option_name The option name to check.
				 * @return bool Always false in tests.
				 */
				public function should_handle( $option_name ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
					return false; // Don't handle any options in tests
				}

				/**
				 * Get value from storage provider.
				 *
				 * @param string $option_name The option name to retrieve.
				 * @return mixed Always null in tests.
				 */
				public function get( $option_name ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
					return null;
				}

				/**
				 * Get environment identifier for logging.
				 *
				 * @return string Test environment identifier.
				 */
				public function get_environment_id() {
					return 'test';
				}
			};
			\Automattic\Jetpack\Connection\External_Storage::register_provider( $test_provider );
		} else {
			// Register the Atomic storage provider for production
			\Automattic\Jetpack\Connection\External_Storage::register_provider(
				new Atomic_Storage_Provider()
			);
		}
	}
}

/**
 * Initialize Protected Owner Error Handler.
 */
function wpcomsh_init_protected_owner_handler() {
	// Only initialize if both the handler class and Jetpack Error_Handler are available
	if ( class_exists( 'Automattic\WPComSH\Connection\Protected_Owner_Error_Handler' ) &&
		class_exists( 'Automattic\Jetpack\Connection\Error_Handler' ) ) {
		// Initialize the Protected Owner Error Handler singleton
		\Automattic\WPComSH\Connection\Protected_Owner_Error_Handler::get_instance();
	}
}

// Initialize connection handlers immediately to ensure external storage is available for REST requests
wpcomsh_init_connection_handlers();
