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
	// Skip external storage initialization during PHPUnit tests to avoid logging
	if ( defined( 'PHPUNIT_JETPACK_TESTSUITE' ) ) {
		return;
	}

	// Only initialize if both External_Storage class and our provider class are available
	if ( class_exists( 'Automattic\Jetpack\Connection\External_Storage' ) && class_exists( 'Atomic_Storage_Provider' ) ) {
		// Register the Atomic storage provider
		\Automattic\Jetpack\Connection\External_Storage::register_provider(
			new Atomic_Storage_Provider()
		);
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
