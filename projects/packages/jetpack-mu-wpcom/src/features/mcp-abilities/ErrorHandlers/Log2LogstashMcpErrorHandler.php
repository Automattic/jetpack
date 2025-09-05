<?php //phpcs:ignore

namespace Automattic\WpcomMcp\ErrorHandlers;

use WP\MCP\Infrastructure\ErrorHandling\Contracts\McpErrorHandlerInterface;

/**
 * Class Log2LogstashMcpErrorHandler
 *
 * This class handles error logging by sending logs to Log2Logstash.
 *
 * @package WpcomMcp
 */
class Log2LogstashMcpErrorHandler implements McpErrorHandlerInterface {

	/**
	 * Log with context.
	 *
	 * @param string $message The log message.
	 * @param array  $context Additional context data.
	 * @param string $type The type of log (e.g., 'error', 'info', etc.). Default is 'error'.
	 *
	 * @return void
	 */
	public function log( string $message, array $context = array(), string $type = 'error' ): void {
		require_once WP_CONTENT_DIR . '/lib/log2logstash/log2logstash.php';

		log2logstash(
			array(
				'feature'  => 'wpcom-mcp',
				'message'  => $message,
				'extra'    => wp_json_encode( $context ),
				'severity' => $type,
				'user_id'  => get_current_user_id(),
			)
		);
	}
}
