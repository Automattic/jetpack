<?php // phpcs:ignore

/**
 * Default MCP Server configuration.
 *
 * @package WpcomMcp
 */

namespace Automattic\WpcomMcp\Servers;

use Automattic\WpcomMcp\AbilitiesRegistry\Registry\AbilityRegistry;
use Automattic\WpcomMcp\ErrorHandlers\Log2LogstashMcpErrorHandler;
use Automattic\WpcomMcp\ObservabilityHandlers\ErrorLogMcpObservabilityHandler;
use Automattic\WpcomMcp\ObservabilityHandlers\Log2LogstashMcpObservabilityHandler;
use Automattic\WpcomMcp\Transport\WpcomRestTransport;
use Automattic\WpcomMcp\WpcomMcp;
use WP\MCP\Infrastructure\ErrorHandling\ErrorLogMcpErrorHandler;

add_action(
	/**
	 * Hook to initialize the MCP adapter for site-level operations.
	 *
	 * @throws \Exception
	 */
	'mcp_adapter_init',
	function () {
		// Use ErrorLog handlers on non-production environments, Log2Logstash handlers on production
		$is_production         = ! (
			( defined( 'WPCOM_SANDBOXED' ) && WPCOM_SANDBOXED ) ||
			( defined( 'ISOLATED_TESTING_ENV' ) && ISOLATED_TESTING_ENV ) ||
			( defined( 'WP_CLI' ) && WP_CLI ) ||
			( defined( 'TEST_REQUEST' ) && TEST_REQUEST ) ||
			( defined( 'WPCOM_MCP_AUTOMATED_TEST' ) && WPCOM_MCP_AUTOMATED_TEST ) ||
			class_exists( 'PHPUnit\Runner\Version' ) ||
			class_exists( 'PHPUnit_Framework_TestCase' )
		);
		$error_handler         = $is_production ? Log2LogstashMcpErrorHandler::class : ErrorLogMcpErrorHandler::class;
		$observability_handler = $is_production ? Log2LogstashMcpObservabilityHandler::class : ErrorLogMcpObservabilityHandler::class;

		// Get abilities from configuration - NO hardcoded names!
		$tools     = AbilityRegistry::get_tools_for_server( 'default' );
		$resources = AbilityRegistry::get_resources_for_server( 'default' );
		$prompts   = AbilityRegistry::get_prompts_for_server( 'default' );

		WpcomMcp::instance()->get_mcp_adapter()->create_server(
			'wpcom-default-server',
			'wpcom/v2',
			'mcp/v1',
			'WordPress.com MCP Server',
			'This MCP server provides AI assistants with comprehensive access to manage and search across all your WordPress.com sites, offering tools to list accessible sites with pagination, search posts across multiple sites with advanced filtering by content, categories, tags, post types, and custom fields, and generate performance optimization insights. All operations respect user permissions and automatically exclude confidential content, enabling AI assistants to provide informed responses about your WordPress.com portfolio, cross-site content discovery, and site management recommendations.',
			'0.2.0',
			array(
				WpcomRestTransport::class,
			),
			$error_handler,
			$observability_handler,
			$tools,     // Dynamically loaded from config
			$resources, // Dynamically loaded from config
			$prompts    // Dynamically loaded from config
		);
	}
);
