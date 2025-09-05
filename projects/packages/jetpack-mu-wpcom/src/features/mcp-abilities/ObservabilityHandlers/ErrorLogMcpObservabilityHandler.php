<?php //phpcs:ignore
/**
 * ErrorLogMcpObservabilityHandler class for logging MCP observability metrics to PHP error log.
 *
 * @package McpAdapter
 */

declare( strict_types=1 );

namespace Automattic\WpcomMcp\ObservabilityHandlers;

use WP\MCP\Infrastructure\Observability\Contracts\McpObservabilityHandlerInterface;
use WP\MCP\Infrastructure\Observability\McpObservabilityHelperTrait;

/**
 * Class ErrorLogMcpObservabilityHandler
 *
 * This class handles observability tracking by writing metrics to the PHP error log.
 * This provides a simple way to track MCP metrics without external dependencies.
 *
 * @package WP\MCP\ObservabilityHandlers
 */
class ErrorLogMcpObservabilityHandler implements McpObservabilityHandlerInterface {

	use McpObservabilityHelperTrait;
	use McpObservabilityDataProcessorTrait;

	/**
	 * Emit a countable event for tracking.
	 *
	 * @param string $event The event name to record.
	 * @param array  $tags Optional tags to attach to the event.
	 *
	 * @return void
	 */
	public static function record_event( string $event, array $tags = array() ): void {
		$prepared_data = self::prepare_event_data( $event, $tags );

		if ( null === $prepared_data ) {
			return;
		}

		$log_message = self::format_as_string( $prepared_data );
		error_log( $log_message ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
	}

	/**
	 * Record a timing measurement.
	 *
	 * @param string $metric The metric name for timing.
	 * @param float  $duration_ms The duration in milliseconds.
	 * @param array  $tags Optional tags to attach to the timing.
	 *
	 * @return void
	 */
	public static function record_timing( string $metric, float $duration_ms, array $tags = array() ): void {
		$prepared_data = self::prepare_timing_data( $metric, $duration_ms, $tags );
		$log_message   = self::format_as_string( $prepared_data );

		error_log( $log_message ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
	}
}
