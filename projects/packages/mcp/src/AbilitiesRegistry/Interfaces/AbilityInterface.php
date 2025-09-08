<?php // phpcs:ignore

namespace Automattic\WpcomMcp\AbilitiesRegistry\Interfaces;

use WP_Error;

/**
 * Interface for WordPress.com MCP AbilitiesRegistry
 *
 * Defines the contract that all ability classes must implement.
 * This ensures consistency across all abilities and makes them easier to maintain.
 *
 * @since 1.0.0
 */
interface AbilityInterface {

	/**
	 * Get the ability configuration array.
	 *
	 * This method must return an array containing all the configuration
	 * needed to register the ability with the WordPress AbilitiesRegistry API.
	 *
	 * Required keys:
	 * - label: Human-readable ability label
	 * - description: Detailed ability description
	 * - input_schema: JSON schema for input validation
	 * - output_schema: JSON schema for output structure
	 * - execute_callback: Callback for executing the ability
	 * - permission_callback: Callback for permission checking
	 *
	 * Optional keys:
	 * - meta: Additional metadata (e.g., for prompts, resources)
	 *
	 * @return array The ability configuration.
	 */
	public function get_config(): array;

	/**
	 * Execute the ability with the provided input.
	 *
	 * This is the main method that performs the ability's functionality.
	 * It should handle input validation, business logic execution,
	 * and return properly formatted results or errors.
	 *
	 * @param array $input The input parameters for the ability.
	 *
	 * @return array|WP_Error The execution result or error.
	 */
	public function execute( array $input = array() );

	/**
	 * Check if the current user has permission to execute this ability.
	 *
	 * This method should implement all necessary permission checks
	 * including user authentication, capability checks, and any
	 * ability-specific access controls.
	 *
	 * @param array $input The input parameters (may affect permissions).
	 *
	 * @return bool True if permission is granted, false otherwise.
	 */
	public function check_permission( array $input = array() ): bool;
}
