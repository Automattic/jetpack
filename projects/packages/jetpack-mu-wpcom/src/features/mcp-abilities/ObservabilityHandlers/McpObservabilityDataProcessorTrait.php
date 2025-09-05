<?php //phpcs:ignore
/**
 * McpObservabilityDataProcessorTrait for processing MCP observability data.
 *
 * @package McpAdapter
 */

declare( strict_types=1 );

namespace Automattic\WpcomMcp\ObservabilityHandlers;

use Automattic\WpcomMcp\Infrastructure\McpRequestContext;

/**
 * Trait McpObservabilityDataProcessorTrait
 *
 * This trait provides common functionality for processing MCP observability data
 * including event filtering, data preparation, and formatting for different output handlers.
 *
 * @package WP\MCP\ObservabilityHandlers
 */
trait McpObservabilityDataProcessorTrait {

	/**
	 * Get the blacklisted events that should not be recorded.
	 *
	 * @return array
	 */
	protected static function get_blacklisted_events(): array {
		return array(
			'mcp.component.registered',
			'mcp.server.created',
			'mcp.request.count',
			'mcp.tool.execution_success',
		);
	}

	/**
	 * Check if an event should be recorded (not blacklisted).
	 *
	 * @param string $event The event name to check.
	 * @return bool
	 */
	protected static function should_record_event( string $event ): bool {
		return ! in_array( $event, self::get_blacklisted_events(), true );
	}

	/**
	 * Prepare event data for logging.
	 *
	 * @param string $event The event name to record.
	 * @param array  $tags Optional tags to attach to the event.
	 * @return array|null Prepared data array or null if event should not be recorded.
	 */
	protected static function prepare_event_data( string $event, array $tags = array() ): ?array {
		if ( ! self::should_record_event( $event ) ) {
			return null;
		}

		$formatted_event = self::format_metric_name( $event );
		$merged_tags     = self::merge_tags( $tags );

		// Process request body and add to tags
		$merged_tags = self::process_request_body_tags( $merged_tags );

		// Extract properties from tags
		$properties = self::extract_properties_from_tags( $merged_tags );

		return array(
			'type'           => 'event',
			'formatted_name' => $formatted_event,
			'original_name'  => $event,
			'properties'     => $properties,
			'extra'          => $merged_tags,
			'message'        => 'MCP Event: ' . $formatted_event,
		);
	}

	/**
	 * Prepare timing data for logging.
	 *
	 * @param string $metric The metric name for timing.
	 * @param float  $duration_ms The duration in milliseconds.
	 * @param array  $tags Optional tags to attach to the timing.
	 * @return array Prepared data array.
	 */
	protected static function prepare_timing_data( string $metric, float $duration_ms, array $tags = array() ): array {
		$formatted_metric = self::format_metric_name( $metric );
		$merged_tags      = self::merge_tags( $tags );

		// Process request body and add to tags
		$merged_tags = self::process_request_body_tags( $merged_tags );

		// Extract properties from tags
		$properties = self::extract_properties_from_tags( $merged_tags );

		// Add duration to properties for consistency
		$properties['duration_ms'] = $duration_ms;

		return array(
			'type'           => 'timing',
			'formatted_name' => $formatted_metric,
			'original_name'  => $metric,
			'duration_ms'    => $duration_ms,
			'properties'     => $properties,
			'extra'          => $merged_tags,
			'message'        => 'MCP Timing',
		);
	}

	/**
	 * Prepare log parameters for Log2Logstash format.
	 *
	 * @param array $prepared_data Prepared data from prepare_event_data or prepare_timing_data.
	 * @return array
	 */
	protected static function prepare_log2logstash_params( array $prepared_data ): array {
		$log_params = array(
			'feature'  => 'wpcom-mcp-observability',
			'message'  => $prepared_data['message'],
			'severity' => 'info',
			'user_id'  => get_current_user_id(),
			'blog_id'  => get_current_blog_id(),
		);

		// Add properties if we have any
		if ( ! empty( $prepared_data['properties'] ) ) {
			$log_params['properties'] = $prepared_data['properties'];
		}

		// Add extra data if any and not timing event
		if ( 'event' === $prepared_data['type'] && ! empty( $prepared_data['extra'] ) ) {
			$log_params['extra'] = wp_json_encode( $prepared_data['extra'] );
		}

		return $log_params;
	}

	/**
	 * Format prepared data as a string for error_log output.
	 *
	 * @param array $prepared_data Prepared data from prepare_event_data or prepare_timing_data.
	 * @return string
	 */
	protected static function format_as_string( array $prepared_data ): string {
		$formatted_properties = self::format_properties( $prepared_data['properties'] );

		if ( 'event' === $prepared_data['type'] ) {
			$formatted_tags = self::format_tags( $prepared_data['extra'] );
			return sprintf(
				'[MCP Observability] EVENT %s %s %s',
				$prepared_data['formatted_name'],
				$formatted_properties,
				$formatted_tags
			);
		} else {
			// Timing events don't include extra/tags
			return sprintf(
				'[MCP Observability] TIMING %s %s',
				$prepared_data['formatted_name'],
				$formatted_properties
			);
		}
	}

	/**
	 * Format properties array into a readable string for logging.
	 *
	 * @param array $properties The properties to format.
	 *
	 * @return string
	 */
	private static function format_properties( array $properties ): string {
		if ( empty( $properties ) ) {
			return '';
		}

		$formatted = array_map(
			function ( $key, $value ) {
				// Handle array/object values by JSON encoding them
				if ( is_array( $value ) || is_object( $value ) ) {
					$value = wp_json_encode( $value );
				}
				return sprintf( '%s=%s', $key, $value );
			},
			array_keys( $properties ),
			array_values( $properties )
		);

		return 'PROPS[' . implode( ',', $formatted ) . ']';
	}

	/**
	 * Format tags array into a readable string for logging.
	 *
	 * @param array $tags The tags to format.
	 *
	 * @return string
	 */
	private static function format_tags( array $tags ): string {
		if ( empty( $tags ) ) {
			return '';
		}

		$formatted = array_map(
			function ( $key, $value ) {
				// Handle array/object values by JSON encoding them
				if ( is_array( $value ) || is_object( $value ) ) {
					$value = wp_json_encode( $value );
				}
				return sprintf( '%s=%s', $key, $value );
			},
			array_keys( $tags ),
			array_values( $tags )
		);

		return 'TAGS[' . implode( ',', $formatted ) . ']';
	}

	/**
	 * Process the request body and extract relevant fields to tags.
	 *
	 * @param array $tags Existing tags array to merge with.
	 * @return array Merged tags with extracted request body fields.
	 */
	protected static function process_request_body_tags( array $tags ): array {
		// Get the request body from our context (parsed from REST API)
		$json_request_body = McpRequestContext::get_instance()->get_request_body_json();
		$request_body      = $json_request_body ? json_decode( $json_request_body, true ) : array();

		// Add request body to tags if available
		if ( ! empty( $request_body ) ) {
			// Extract session_id and add to tags
			if ( isset( $request_body['session_id'] ) ) {
				$tags['session_id'] = $request_body['session_id'];
				unset( $request_body['session_id'] ); // Remove from request body to avoid duplication
			}

			// Extract request_id from request body and add to tags
			if ( isset( $request_body['id'] ) || isset( $request_body['request_id'] ) ) {
				$tags['request_id'] = $request_body['id'] ?? $request_body['request_id'];
				if ( isset( $request_body['id'] ) ) {
					unset( $request_body['id'] );
				}
				if ( isset( $request_body['request_id'] ) ) {
					unset( $request_body['request_id'] );
				}
			}

			// Extract session_id and add to tags
			$tags['ability'] = '';
			if ( isset( $request_body['name'] ) ) {
				$tags['ability'] = $request_body['name'];
			}

			// Remove method from request body to avoid duplication
			if ( isset( $request_body['method'] ) ) {
				unset( $request_body['method'] );
			}

			// Add the remaining request body as a tag
			if ( ! empty( $request_body ) ) {
				$tags['request_body'] = $request_body;
			}
		}

		return $tags;
	}

	/**
	 * Extract properties from tags for structured logging.
	 *
	 * This method extracts key observability fields (session_id, request_id, ability)
	 * from the tags array and returns them as a separate properties array.
	 * The extracted fields are removed from the original tags array to avoid duplication.
	 *
	 * @param array $tags Tags array to extract properties from (modified by reference).
	 * @return array Properties array with extracted fields.
	 */
	protected static function extract_properties_from_tags( array &$tags ): array {
		$properties = array();

		// Extract session_id
		if ( isset( $tags['session_id'] ) ) {
			$properties['session_id'] = $tags['session_id'];
			unset( $tags['session_id'] );
		}

		// Extract request_id
		if ( isset( $tags['request_id'] ) ) {
			$properties['request_id'] = $tags['request_id'];
			unset( $tags['request_id'] );
		}

		// Extract ability
		if ( isset( $tags['ability'] ) ) {
			$properties['ability'] = $tags['ability'];
			unset( $tags['ability'] );
		}

		return $properties;
	}
}
