<?php
/**
 * Jetpack MCP Package
 *
 * @package automattic/jetpack-mcp
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\AbilitiesRegistry\Registry\AbilityRegistry;

/**
 * Jetpack MCP Package class.
 */
class Mcp {

	const PACKAGE_VERSION = '0.1.0-alpha';

	/**
	 * Initialize the MCP package.
	 */
	public static function init(): void {
		// Prevent multiple executions.
		static $loaded = false;
		if ( $loaded ) {
			return;
		}
		$loaded = true;

		// Only load for Automatticians on WordPress.com.
		if ( ! function_exists( 'is_automattician' ) || ! is_automattician() ) {
			return;
		}

		// Load the abilities API.
		if ( function_exists( 'wp_abilities_api_init' ) ) {
			add_action(
				'abilities_api_init',
				function () {
					// Load abilities dynamically from configuration - NO hardcoded names!
					$all_abilities = AbilityRegistry::get_all_names();

					foreach ( $all_abilities as $ability_name ) {
						$ability_class = AbilityRegistry::get_ability_class( $ability_name );

						if ( $ability_class && class_exists( $ability_class ) ) {
							new $ability_class();
						}
					}
				}
			);
		}
	}

}

// Initialize the package when Jetpack loads it.
add_action( 'plugins_loaded', array( Mcp::class, 'init' ) );
