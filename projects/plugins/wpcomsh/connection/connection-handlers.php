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
	// Only initialize if External_Storage class is available
	if ( ! class_exists( 'Automattic\Jetpack\Connection\External_Storage' ) ) {
		return;
	}

	// Register the Atomic storage provider
	\Automattic\Jetpack\Connection\External_Storage::register_provider(
		new Atomic_Storage_Provider()
	);
}

/**
 * Initialize Protected Owner Error Handler.
 */
function wpcomsh_init_protected_owner_handler() {
	// Initialize the Protected Owner Error Handler singleton
	\Automattic\WPComSH\Connection\Protected_Owner_Error_Handler::get_instance();
}

// Initialize connection handlers early to catch Jetpack connection checks
add_action( 'plugins_loaded', 'wpcomsh_init_connection_handlers', 1 );
