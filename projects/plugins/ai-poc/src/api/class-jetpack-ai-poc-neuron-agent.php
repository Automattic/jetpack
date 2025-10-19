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
				return $response;
			}

			// Check stop reason
			if ( 'end_turn' === $response['stop_reason'] ) {
				// Extract text response
				$text_response = $this->extract_text_from_content( $response['content'] );
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
			return new WP_Error(
				'unexpected_stop_reason',
				'Unexpected stop reason: ' . $response['stop_reason']
			);
		}

		return new WP_Error(
			'max_iterations_exceeded',
			'Maximum iterations exceeded'
		);
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
		// Convert tool name back to ability name.
		$ability_name = str_replace( '_', '/', $tool_name );

		// Get the ability using official API.
		$ability = wp_get_ability( $ability_name );

		if ( ! $ability ) {
			return array(
				'success' => false,
				'message' => 'Ability not found: ' . $ability_name,
			);
		}

		// Execute the ability.
		$result = $ability->execute( $input );

		// Handle WP_Error.
		if ( is_wp_error( $result ) ) {
			return array(
				'success' => false,
				'message' => $result->get_error_message(),
			);
		}

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
