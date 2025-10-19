<?php
/**
 * Neuron AI Agent for Jetpack AI POC.
 *
 * @package automattic/jetpack-ai-poc
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class Jetpack_AI_POC_Neuron_Agent
 *
 * Implements Neuron AI agent with WordPress abilities as tools.
 */
class Jetpack_AI_POC_Neuron_Agent {

	/**
	 * Anthropic API key.
	 *
	 * @var string
	 */
	private $api_key;

	/**
	 * Anthropic API endpoint.
	 *
	 * @var string
	 */
	private $api_endpoint = 'https://api.anthropic.com/v1/messages';

	/**
	 * Model to use.
	 *
	 * @var string
	 */
	private $model = 'claude-sonnet-4-5-20250929';

	/**
	 * Constructor.
	 *
	 * @param string $api_key Anthropic API key.
	 */
	public function __construct( $api_key ) {
		$this->api_key = $api_key;
	}

	/**
	 * Execute the agent with a user prompt.
	 *
	 * @param string $prompt User prompt.
	 * @return array|WP_Error Result or error.
	 */
	public function execute( $prompt ) {
		// Start LLM span for tracing.
		$llm_span = Jetpack_AI_POC_Langfuse_Tracer::start_llm_span( $prompt, $this->model );

		// Get available tools (WordPress abilities)
		$tools = $this->get_tools();

		// Create the initial message
		$messages = array(
			array(
				'role'    => 'user',
				'content' => $prompt,
			),
		);

		$max_iterations = 5;
		$iteration      = 0;

		while ( $iteration < $max_iterations ) {
			++$iteration;

			// Make API request to Claude
			$response = $this->call_claude_api( $messages, $tools );

			if ( is_wp_error( $response ) ) {
				Jetpack_AI_POC_Langfuse_Tracer::end_span_error( $llm_span, $response->get_error_message() );
				return $response;
			}

			// Check stop reason
			if ( 'end_turn' === $response['stop_reason'] ) {
				// Extract text response
				$text_response = $this->extract_text_from_content( $response['content'] );

				// End LLM span with success.
				Jetpack_AI_POC_Langfuse_Tracer::end_span_success( $llm_span, $text_response );

				return array(
					'success' => true,
					'message' => $text_response,
					'data'    => array(
						'iterations' => $iteration,
					),
				);
			}

			// Handle tool use
			if ( 'tool_use' === $response['stop_reason'] ) {
				// Extract tool calls from content
				$tool_calls = $this->extract_tool_calls( $response['content'] );

				// Add assistant's response to messages
				$messages[] = array(
					'role'    => 'assistant',
					'content' => $response['content'],
				);

				// Execute tools and collect results
				$tool_results = array();
				foreach ( $tool_calls as $tool_call ) {
					$result         = $this->execute_tool( $tool_call['name'], $tool_call['input'] );
					$tool_results[] = array(
						'type'        => 'tool_result',
						'tool_use_id' => $tool_call['id'],
						'content'     => wp_json_encode( $result ),
					);
				}

				// Add tool results to messages
				$messages[] = array(
					'role'    => 'user',
					'content' => $tool_results,
				);

				continue;
			}

			// Unexpected stop reason
			$error = new WP_Error(
				'unexpected_stop_reason',
				'Unexpected stop reason: ' . $response['stop_reason']
			);
			Jetpack_AI_POC_Langfuse_Tracer::end_span_error( $llm_span, $error->get_error_message() );
			return $error;
		}

		$error = new WP_Error(
			'max_iterations_exceeded',
			'Maximum iterations exceeded'
		);
		Jetpack_AI_POC_Langfuse_Tracer::end_span_error( $llm_span, $error->get_error_message() );
		return $error;
	}

	/**
	 * Call Claude API.
	 *
	 * @param array $messages Messages array.
	 * @param array $tools Tools array.
	 * @return array|WP_Error Response or error.
	 */
	private function call_claude_api( $messages, $tools ) {
		$body = array(
			'model'      => $this->model,
			'max_tokens' => 4096,
			'messages'   => $messages,
			'tools'      => $tools,
		);

		$response = wp_remote_post(
			$this->api_endpoint,
			array(
				'headers' => array(
					'Content-Type'      => 'application/json',
					'x-api-key'         => $this->api_key,
					'anthropic-version' => '2023-06-01',
				),
				'body'    => wp_json_encode( $body ),
				'timeout' => 60,
			)
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		$body        = wp_remote_retrieve_body( $response );
		$data        = json_decode( $body, true );

		if ( 200 !== $status_code ) {
			return new WP_Error(
				'api_error',
				isset( $data['error']['message'] ) ? $data['error']['message'] : 'API request failed',
				array( 'status' => $status_code )
			);
		}

		return $data;
	}

	/**
	 * Get available tools (WordPress abilities).
	 *
	 * Uses the official WordPress Abilities API to retrieve registered abilities.
	 *
	 * @return array Tools array formatted for Claude API.
	 */
	private function get_tools() {
		// Use the official WordPress Abilities API.
		$abilities = wp_get_abilities();
		$tools     = array();

		foreach ( $abilities as $ability ) {
			$tools[] = array(
				'name'         => str_replace( '/', '_', $ability->get_name() ),
				'description'  => $ability->get_description(),
				'input_schema' => $ability->get_input_schema(),
			);
		}

		return $tools;
	}

	/**
	 * Execute a tool (WordPress ability).
	 *
	 * Uses the official WordPress Abilities API to execute abilities.
	 *
	 * @param string $tool_name Tool name.
	 * @param array  $input Tool input.
	 * @return array Result.
	 */
	private function execute_tool( $tool_name, $input ) {
		// Start tool span for tracing.
		$tool_span = Jetpack_AI_POC_Langfuse_Tracer::start_tool_span( $tool_name, $input );

		// Convert tool name back to ability name.
		$ability_name = str_replace( '_', '/', $tool_name );

		// Get the ability using official API.
		$ability = wp_get_ability( $ability_name );

		if ( ! $ability ) {
			$error_result = array(
				'success' => false,
				'message' => 'Ability not found: ' . $ability_name,
			);
			Jetpack_AI_POC_Langfuse_Tracer::end_span_error( $tool_span, 'Ability not found: ' . $ability_name );
			return $error_result;
		}

		// Execute the ability.
		$result = $ability->execute( $input );

		// Handle WP_Error.
		if ( is_wp_error( $result ) ) {
			$error_result = array(
				'success' => false,
				'message' => $result->get_error_message(),
			);
			Jetpack_AI_POC_Langfuse_Tracer::end_span_error( $tool_span, $result->get_error_message() );
			return $error_result;
		}

		// End tool span with success.
		Jetpack_AI_POC_Langfuse_Tracer::end_span_success( $tool_span, $result );

		return $result;
	}

	/**
	 * Extract text content from response content array.
	 *
	 * @param array $content Content array.
	 * @return string Text content.
	 */
	private function extract_text_from_content( $content ) {
		$text = '';
		foreach ( $content as $block ) {
			if ( 'text' === $block['type'] ) {
				$text .= $block['text'];
			}
		}
		return $text;
	}

	/**
	 * Extract tool calls from response content array.
	 *
	 * @param array $content Content array.
	 * @return array Tool calls.
	 */
	private function extract_tool_calls( $content ) {
		$tool_calls = array();
		foreach ( $content as $block ) {
			if ( 'tool_use' === $block['type'] ) {
				$tool_calls[] = array(
					'id'    => $block['id'],
					'name'  => $block['name'],
					'input' => $block['input'],
				);
			}
		}
		return $tool_calls;
	}
}
