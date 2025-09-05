<?php
/**
 * MCP Abilities Feature
 *
 * @package automattic/jetpack-mu-wpcom
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Initialize MCP Abilities when conditions are met.
 */
function init_jetpack_mcp_abilities(): void {
	// Only load for Automatticians
	if ( ! function_exists( 'is_automattician' ) || ! is_automattician() ) {
		return;
	}

	// Check if MCP adapter is available (loaded by wpcom-mcp plugin)
	if ( ! function_exists( 'wp_register_ability' ) ) {
		// MCP adapter not available - wpcom-mcp plugin may not be loaded
		return;
	}

	// Load the main MCP class
	require_once __DIR__ . '/WpcomMcp.php';

	// Initialize the MCP system
	new Automattic\WpcomMcp\WpcomMcp();

	// Register abilities when the abilities API is ready
	add_action(
		'abilities_api_init',
		function () {
			// Load abilities dynamically from configuration
			$all_abilities = Automattic\WpcomMcp\AbilitiesRegistry\Registry\AbilityRegistry::get_all_names();

			foreach ( $all_abilities as $ability_name ) {
				$ability_class = Automattic\WpcomMcp\AbilitiesRegistry\Registry\AbilityRegistry::get_ability_class( $ability_name );

				if ( $ability_class && class_exists( $ability_class ) ) {
					new $ability_class();
				}
			}
		}
	);
}

// Initialize after WordPress is loaded
add_action( 'init', 'init_jetpack_mcp_abilities', 20 );
