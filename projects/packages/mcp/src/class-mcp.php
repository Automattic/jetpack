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

		// Check PHP version - MCP requires PHP 7.4+
		if ( version_compare( PHP_VERSION, '7.4.0', '<' ) ) {
			return;
		}

		// Load the abilities API.
		self::load_abilities_api();

		// Only register abilities if the abilities API is available.
		if ( self::is_abilities_api_available() ) {
			add_action(
				'abilities_api_init',
				function () {
					// Load abilities dynamically from configuration - NO hardcoded names!
					$all_abilities = AbilityRegistry::get_all_names();

					foreach ( $all_abilities as $ability_name ) {
						$ability_class = AbilityRegistry::get_ability_class( $ability_name );

						if ( $ability_class && class_exists( $ability_class ) ) {
							// @phan-suppress-next-line PhanNoopNew
							new $ability_class();
						}
					}
				}
			);
		}
	}

	/**
	 * Load the WordPress Abilities API.
	 */
	private static function load_abilities_api(): void {
		// Check if the abilities API is already loaded.
		if ( function_exists( 'wp_register_ability' ) ) {
			return;
		}

		// First, try to use Jetpack's autoloader if available.
		// This is the most efficient approach when running within Jetpack.
		if ( class_exists( 'Automattic\\Jetpack\\Autoloader\\Autoloader' ) ) {
			// The abilities API should be available through Jetpack's autoloader
			// since it's included as a dependency in composer.json
			return;
		}

		// Fallback: Try to load from Composer autoloader in various locations.
		$autoloader_paths = array(
			// MCP package vendor directory
			__DIR__ . '/../vendor/autoload.php',
			// Parent package vendor directory
			__DIR__ . '/../../vendor/autoload.php',
			// Jetpack plugin vendor directory (when MCP is loaded as part of Jetpack)
			__DIR__ . '/../../../vendor/autoload.php',
			// WordPress root vendor directory
			__DIR__ . '/../../../../vendor/autoload.php',
		);

		foreach ( $autoloader_paths as $path ) {
			if ( file_exists( $path ) ) {
				require_once $path;
				// Check if the function is now available after loading autoloader
				if ( function_exists( 'wp_register_ability' ) ) {
					return;
				}
			}
		}

		// Last resort: Try to load directly from the package.
		if ( ! function_exists( 'wp_register_ability' ) ) {
			$abilities_api_paths = array(
				__DIR__ . '/../vendor/wordpress/abilities-api/src/',
				__DIR__ . '/../../vendor/wordpress/abilities-api/src/',
				__DIR__ . '/../../../vendor/wordpress/abilities-api/src/',
				__DIR__ . '/../../../../vendor/wordpress/abilities-api/src/',
			);

			foreach ( $abilities_api_paths as $path ) {
				if ( file_exists( $path . 'wp-abilities-api.php' ) ) {
					require_once $path . 'wp-abilities-api.php';
					break;
				}
			}
		}
	}

	/**
	 * Check if the abilities API is available.
	 *
	 * @return bool True if available, false otherwise.
	 */
	public static function is_abilities_api_available(): bool {
		return function_exists( 'wp_register_ability' );
	}

	/**
	 * Check if we're running within Jetpack's autoloader context.
	 *
	 * @return bool True if running within Jetpack, false otherwise.
	 */
	public static function is_running_within_jetpack(): bool {
		return class_exists( 'Automattic\\Jetpack\\Autoloader\\Autoloader' );
	}
}
