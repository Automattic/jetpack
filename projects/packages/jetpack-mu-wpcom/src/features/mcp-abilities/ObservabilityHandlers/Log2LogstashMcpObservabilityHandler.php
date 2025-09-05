<?php //phpcs:ignore

namespace Automattic\WpcomMcp\ObservabilityHandlers;

use WP\MCP\Infrastructure\Observability\Contracts\McpObservabilityHandlerInterface;
use WP\MCP\Infrastructure\Observability\McpObservabilityHelperTrait;

/**
 * Class Log2LogstashMcpObservabilityHandler
 *
 * This class handles observability tracking by sending metrics to Log2Logstash.
 *
 * @package WpcomMcp
 */
class Log2LogstashMcpObservabilityHandler implements McpObservabilityHandlerInterface {

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
		require_once WP_CONTENT_DIR . '/lib/log2logstash/log2logstash.php';

		$prepared_data = self::prepare_event_data( $event, $tags );

		if ( null === $prepared_data ) {
			return;
		}

		$log_params = self::prepare_log2logstash_params( $prepared_data );
		log2logstash( $log_params );
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
		require_once WP_CONTENT_DIR . '/lib/log2logstash/log2logstash.php';

		$prepared_data = self::prepare_timing_data( $metric, $duration_ms, $tags );
		$log_params    = self::prepare_log2logstash_params( $prepared_data );

		log2logstash( $log_params );
	}
}
