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
use Automattic\WpcomMcp\Transport\WpcomSingleSiteRestTransport;
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
		require_once ABSPATH . 'wp-content/lib/public-api-helpers/get-target-blog-id.php';
		// Extract the target blog ID from the URL.
		$blog_id   = get_target_blog_id();
		$blog_name = get_blog_details( $blog_id )->blogname;
		$site_url  = get_blog_details( $blog_id )->siteurl;

		// Use ErrorLog handlers on sandbox, Log2Logstash handlers otherwise.
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
		$tools     = AbilityRegistry::get_tools_for_server( 'site-level' );
		$resources = AbilityRegistry::get_resources_for_server( 'site-level' );
		$prompts   = AbilityRegistry::get_prompts_for_server( 'site-level' );

		WpcomMcp::instance()->get_mcp_adapter()->create_server(
			'wpcom-site-level-server',
			'wp/v2',
			'mcp/v1',
			$blog_name . ' MCP Server',
			"This MCP server provides AI assistants with access to the WordPress.com site '{$blog_name}' ({$site_url}), offering tools to search and analyze site content while respecting user permissions and security. Use the posts search tool to find content by keywords, categories, tags, post types, and custom fields with pagination support, and the performance analysis prompt to generate optimization insights for specified time periods. All operations automatically exclude confidential content and respect WordPress access controls, enabling AI assistants to provide informed responses about the site's published content, metadata, and performance metrics.",
			'0.1.0',
			array(
				WpcomSingleSiteRestTransport::class,
			),
			$error_handler,
			$observability_handler,
			$tools,     // Dynamically loaded from config
			$resources, // Dynamically loaded from config
			$prompts    // Dynamically loaded from config
		);
	}
);
