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

// Load required classes. wpcomsh_init_external_storage() loads the storage provider.
require_once __DIR__ . '/class-protected-owner-error-handler.php';

/**
 * Initialize Jetpack Connection handlers.
 */
function wpcomsh_init_connection_handlers() {
	/*
	 * Register the provider now, because connection versions before 8.3.0 never fire
	 * `jetpack_external_storage_init`. When the classes cannot load yet, register on that action,
	 * which fires on the first read. Load this file before code that reads the connection options.
	 */
	if ( ! wpcomsh_init_external_storage() ) {
		add_action( 'jetpack_external_storage_init', 'wpcomsh_init_external_storage' );
	}

	wpcomsh_init_protected_owner_handler();
}

/**
 * Initialize external storage provider for Jetpack connection data.
 *
 * @return bool Whether the provider was registered.
 */
function wpcomsh_init_external_storage() {
	/**
	 * Filters whether to register the Atomic external storage provider.
	 *
	 * The default skips it during PHPUnit tests to avoid logging. Tests of the registration turn it on.
	 *
	 * @param bool $register Whether to register the provider.
	 */
	if ( ! apply_filters( 'wpcomsh_register_external_storage_provider', ! defined( 'PHPUNIT_JETPACK_TESTSUITE' ) ) ) {
		return false;
	}

	if ( ! class_exists( 'Automattic\Jetpack\Connection\External_Storage' )
		|| ! interface_exists( 'Automattic\Jetpack\Connection\Storage_Provider_Interface' ) ) {
		return false;
	}

	// Load the provider only now: it declares its class only when the interface exists.
	require_once __DIR__ . '/class-atomic-storage-provider.php';

	return \Automattic\Jetpack\Connection\External_Storage::register_provider(
		new Atomic_Storage_Provider()
	);
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

wpcomsh_init_connection_handlers();
