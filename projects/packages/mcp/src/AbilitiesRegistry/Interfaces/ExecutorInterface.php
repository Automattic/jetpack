<?php // phpcs:ignore

namespace Automattic\Jetpack\AbilitiesRegistry\Interfaces;

use WP_Error;

/**
 * Executor Interface
 *
 * All ability executors must implement this interface
 */
interface ExecutorInterface {
	/**
	 * Execute the ability logic
	 *
	 * @param array $input Input parameters.
	 * @return WP_Error|array The result data or error
	 */
	public function execute( array $input = array() ): WP_Error|array;

	/**
	 * Check if the current user has permission to execute this ability
	 *
	 * @param array $input Input parameters.
	 * @return bool True if permission granted, false otherwise
	 */
	public function check_permission( array $input = array() ): bool;
}
