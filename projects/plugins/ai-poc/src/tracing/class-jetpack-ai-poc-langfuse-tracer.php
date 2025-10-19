<?php
/**
 * Langfuse Tracer for Jetpack AI POC.
 *
 * Uses OpenTelemetry to send traces to Langfuse.
 *
 * @package automattic/jetpack-ai-poc
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

use OpenTelemetry\API\Trace\SpanKind;
use OpenTelemetry\API\Trace\StatusCode;
use OpenTelemetry\Contrib\Otlp\SpanExporter;
use OpenTelemetry\SDK\Common\Attribute\Attributes;
use OpenTelemetry\SDK\Common\Time\ClockFactory;
use OpenTelemetry\SDK\Resource\ResourceInfo;
use OpenTelemetry\SDK\Resource\ResourceInfoFactory;
use OpenTelemetry\SDK\Trace\SpanProcessor\BatchSpanProcessor;
use OpenTelemetry\SDK\Trace\TracerProvider;

/**
 * Class Jetpack_AI_POC_Langfuse_Tracer
 *
 * Configures OpenTelemetry to send traces to Langfuse.
 */
class Jetpack_AI_POC_Langfuse_Tracer {

	/**
	 * Tracer provider instance.
	 *
	 * @var TracerProvider|null
	 */
	private static $tracer_provider = null;

	/**
	 * Tracer instance.
	 *
	 * @var \OpenTelemetry\API\Trace\TracerInterface|null
	 */
	private static $tracer = null;

	/**
	 * Initialize the Langfuse tracer.
	 *
	 * @param string $langfuse_public_key Langfuse public key.
	 * @param string $langfuse_secret_key Langfuse secret key.
	 * @param string $langfuse_host Langfuse host URL.
	 * @return void
	 */
	public static function init( $langfuse_public_key, $langfuse_secret_key, $langfuse_host = 'https://cloud.langfuse.com' ) {
		if ( self::$tracer_provider !== null ) {
			return;
		}

		// Check if OpenTelemetry classes are available.
		if ( ! class_exists( 'OpenTelemetry\SDK\Trace\TracerProvider' ) ||
			! class_exists( 'OpenTelemetry\Contrib\Otlp\SpanExporter' ) ||
			! class_exists( 'OpenTelemetry\Contrib\Otlp\OtlpHttpTransportFactory' ) ) {
			return;
		}

		try {
			// Create resource with service information.
			$resource = ResourceInfoFactory::emptyResource()->merge(
				ResourceInfo::create(
					Attributes::create(
						array(
							'service.name'    => 'jetpack-ai-poc',
							'service.version' => '0.8.0',
						)
					)
				)
			);

			// Create OTLP exporter configured for Langfuse.
			$endpoint = rtrim( $langfuse_host, '/' ) . '/api/public/otel/v1/traces';

			// Create Basic Auth header.
			$auth_string = base64_encode( $langfuse_public_key . ':' . $langfuse_secret_key );

			$exporter = new SpanExporter(
				( new \OpenTelemetry\Contrib\Otlp\OtlpHttpTransportFactory() )->create(
					$endpoint,
					'application/x-protobuf',
					array(
						'Authorization' => 'Basic ' . $auth_string,
					)
				)
			);

			// Create tracer provider with batch span processor.
			$clock                 = ClockFactory::getDefault();
			self::$tracer_provider = new TracerProvider(
				new BatchSpanProcessor( $exporter, $clock ),
				null,
				$resource
			);

			// Get tracer instance.
			self::$tracer = self::$tracer_provider->getTracer( 'jetpack-ai-poc' );
		} catch ( \Exception $e ) {
			// Silently fail - tracing is optional.
			return;
		}
	}

	/**
	 * Get the tracer instance.
	 *
	 * @return \OpenTelemetry\API\Trace\TracerInterface|null
	 */
	public static function get_tracer() {
		return self::$tracer;
	}

	/**
	 * Create a span for an LLM request.
	 *
	 * @param string $prompt User prompt.
	 * @param string $model Model name.
	 * @return \OpenTelemetry\API\Trace\SpanInterface|null
	 */
	public static function start_llm_span( $prompt, $model ) {
		if ( self::$tracer === null ) {
			return null;
		}

		$span = self::$tracer
			->spanBuilder( 'llm.chat' )
			->setSpanKind( SpanKind::KIND_CLIENT )
			->setAttribute( 'gen_ai.system', 'anthropic' )
			->setAttribute( 'gen_ai.request.model', $model )
			->setAttribute( 'gen_ai.operation.name', 'chat' )
			->startSpan();

		// Add prompt as span event with proper structure.
		$span->addEvent(
			'gen_ai.content.prompt',
			array(
				'gen_ai.prompt' => $prompt,
			)
		);

		return $span;
	}

	/**
	 * Create a span for a tool call.
	 *
	 * @param string $tool_name Tool name.
	 * @param array  $input Tool input.
	 * @return \OpenTelemetry\API\Trace\SpanInterface|null
	 */
	public static function start_tool_span( $tool_name, $input ) {
		if ( self::$tracer === null ) {
			return null;
		}

		$span = self::$tracer
			->spanBuilder( 'tool.execute' )
			->setSpanKind( SpanKind::KIND_INTERNAL )
			->setAttribute( 'gen_ai.tool.name', $tool_name )
			->startSpan();

		// Add tool input as event
		$span->addEvent(
			'gen_ai.tool.input',
			array(
				'gen_ai.tool.parameters' => wp_json_encode( $input ),
			)
		);

		return $span;
	}

	/**
	 * End a span with success.
	 *
	 * @param \OpenTelemetry\API\Trace\SpanInterface|null $span Span instance.
	 * @param mixed                                       $output Output data.
	 * @return void
	 */
	public static function end_span_success( $span, $output = null ) {
		if ( $span === null ) {
			return;
		}

		if ( $output !== null ) {
			// Add output as span event with proper GenAI conventions
			$span->addEvent(
				'gen_ai.content.completion',
				array(
					'gen_ai.completion' => is_string( $output ) ? $output : wp_json_encode( $output ),
				)
			);
		}

		$span->setStatus( StatusCode::STATUS_OK );
		$span->end();
	}

	/**
	 * End a span with error.
	 *
	 * @param \OpenTelemetry\API\Trace\SpanInterface|null $span Span instance.
	 * @param string                                      $error_message Error message.
	 * @return void
	 */
	public static function end_span_error( $span, $error_message ) {
		if ( $span === null ) {
			return;
		}

		$span->setStatus( StatusCode::STATUS_ERROR, $error_message );
		$span->setAttribute( 'error', true );
		$span->setAttribute( 'error.message', $error_message );
		$span->end();
	}

	/**
	 * Shutdown the tracer provider.
	 *
	 * Ensures all spans are flushed before shutdown.
	 *
	 * @return void
	 */
	public static function shutdown() {
		if ( self::$tracer_provider !== null ) {
			self::$tracer_provider->shutdown();
		}
	}
}
