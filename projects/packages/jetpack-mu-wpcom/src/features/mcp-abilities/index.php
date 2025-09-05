<?php
/**
 * MCP Abilities Feature
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types=1 );

use Automattic\WpcomMcp\AbilitiesRegistry\Registry\AbilityRegistry;
use Automattic\WpcomMcp\WpcomMcp;
use WP\MCP\Core\McpAdapter;

// Prevent direct access.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Define constants.
define( 'WPCOM_MCP_VERSION', '1.0.0' );
define( 'WPCOM_MCP_PATH', plugin_dir_path( __FILE__ ) );
define( 'WPCOM_MCP_URL', plugin_dir_url( __FILE__ ) );

/**
 * Initialize the WordPress MCP plugin.
 */
function init_jetpack_mcp_abilities(): void {
	// Prevent multiple executions.
	static $loaded = false;
	if ( $loaded ) {
		return;
	}
	$loaded = true;

	// Only load for Automatticians.
	if ( ! is_automattician() ) {
		return;
	}

	// Load the abilities API.
	require_once ABSPATH . 'wp-content/lib/abilities-api/load.php';

	// Check if MCP adapter is available (loaded by Jetpack autoloader)
	if ( ! class_exists( McpAdapter::class ) ) {
		// MCP adapter not available - may not be installed or autoloader not working
		return;
	}

	// Load the main MCP class
	require_once __DIR__ . '/WpcomMcp.php';

	// Initialize the registry.
	WpcomMcp::instance()
			->set_plugin_dir( __DIR__ )
			->register();

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

	// Load servers.
	require_once __DIR__ . '/Servers/DefaultServer.php';
	require_once __DIR__ . '/Servers/SiteLevelMcpServer.php';
}

// Initialize the plugin after all plugins are loaded.
add_action( 'plugins_loaded', 'init_jetpack_mcp_abilities' );
