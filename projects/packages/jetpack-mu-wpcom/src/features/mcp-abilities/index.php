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

// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
error_log( 'init_jetpack_mcp_abilities - file loaded' );

// Prevent direct access.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Define constants.
if ( ! defined( 'WPCOM_MCP_VERSION' ) ) {
	define( 'WPCOM_MCP_VERSION', '1.0.0' );
}
if ( ! defined( 'WPCOM_MCP_PATH' ) ) {
	define( 'WPCOM_MCP_PATH', plugin_dir_path( __FILE__ ) );
}
if ( ! defined( 'WPCOM_MCP_URL' ) ) {
	define( 'WPCOM_MCP_URL', plugin_dir_url( __FILE__ ) );
}

/**
 * Initialize the WordPress MCP plugin.
 */
function init_jetpack_mcp_abilities(): void {
	// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
	error_log( 'init_jetpack_mcp_abilities - function called' );
	// Prevent multiple executions.
	static $loaded = false;
	if ( $loaded ) {
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		error_log( 'init_jetpack_mcp_abilities already loaded' );
		return;
	}
	$loaded = true;

	// Only load for Automatticians.
	$is_automattician = is_automattician();
	// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
	error_log( 'init_jetpack_mcp_abilities is_automattician: ' . ( $is_automattician ? 'true' : 'false' ) );
	if ( ! $is_automattician ) {
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		error_log( 'init_jetpack_mcp_abilities not automattician - exiting early' );
		return;
	}

	// Load the abilities API.
	require_once ABSPATH . 'wp-content/lib/abilities-api/load.php';

	// Check if MCP adapter is available (loaded by Jetpack autoloader)
	if ( ! class_exists( McpAdapter::class ) ) {
		// MCP adapter not available - may not be installed or autoloader not working
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		error_log( 'init_jetpack_mcp_abilities mcp adapter not available' );
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
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log,WordPress.PHP.DevelopmentFunctions.error_log_print_r
			error_log( 'init_jetpack_mcp_abilities all abilities: ' . print_r( $all_abilities, true ) );
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
	// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
	error_log( 'init_jetpack_mcp_abilities servers loaded' );
}

// Initialize the plugin after all plugins are loaded.
add_action( 'plugins_loaded', 'init_jetpack_mcp_abilities' );
// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
error_log( 'init_jetpack_mcp_abilities - action hook registered' );
