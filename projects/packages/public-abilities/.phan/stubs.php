<?php
/**
 * Stubs for WordPress Ability API functions.
 *
 * These functions are part of a proposed WordPress Feature API that may be added to core.
 * This stub file allows Phan to analyze code that depends on these functions.
 *
 * @package automattic/jetpack-public-abilities
 */

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Stub functions don't use parameters.

/**
 * Check if an ability is registered.
 *
 * @param string $name The ability name.
 * @return bool True if the ability exists, false otherwise.
 */
function wp_has_ability( $name ) {
	return false;
}

/**
 * Get a registered ability by name.
 *
 * @param string $name The ability name.
 * @return object|null The ability object or null if not found.
 */
function wp_get_ability( $name ) {
	return null;
}

/**
 * Get all registered abilities.
 *
 * @return array Array of ability objects.
 */
function wp_get_abilities() {
	return array();
}
