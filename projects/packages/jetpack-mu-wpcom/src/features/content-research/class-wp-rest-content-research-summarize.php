<?php
/**
 * WP_REST_Content_Research_Summarize file.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\FSE;

use Automattic\Jetpack\Connection\Client;

/**
 * Class WP_REST_Content_Research_Summarize.
 *
 * Handles the /wpcom/v2/content-research/summarize endpoint.
 * Sends research results to wp-orchestrator for AI synthesis.
 */
class WP_REST_Content_Research_Summarize extends \WP_REST_Controller {

	/**
	 * WP_REST_Content_Research_Summarize constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'content-research/summarize';
	}

	/**
	 * Register available routes.
	 */
	public function register_rest_route() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'summarize' ),
				'permission_callback' => 'is_user_logged_in',
				'args'                => array(
					'topic'   => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'results' => array(
						'type'     => 'array',
						'required' => true,
						'items'    => array(
							'type' => 'object',
						),
					),
				),
			)
		);
	}

	/**
	 * Build the prompt for the AI summarization.
	 *
	 * @param string $topic   The research topic.
	 * @param array  $results The research results.
	 * @return string The formatted prompt.
	 */
	private function build_prompt( string $topic, array $results ): string {
		$formatted_results = '';
		foreach ( $results as $result ) {
			$source = strtoupper( $result['source'] ?? 'unknown' );
			$title  = $result['title'] ?? '';
			$url    = $result['url'] ?? '';

			$formatted_results .= "[$source] $title ($url)\n";

			if ( ! empty( $result['excerpt'] ) ) {
				$formatted_results .= '  ' . $result['excerpt'] . "\n";
			}
			if ( ! empty( $result['engagement'] ) ) {
				$upvotes            = $result['engagement']['upvotes'] ?? 0;
				$comments           = $result['engagement']['comments'] ?? 0;
				$formatted_results .= "  Engagement: {$upvotes} upvotes, {$comments} comments\n";
			}
			if ( ! empty( $result['odds'] ) ) {
				$formatted_results .= "  Odds: {$result['odds']}\n";
			}
			$formatted_results .= "\n";
		}

		return "You are a research assistant helping a blogger write a post about: \"$topic\"\n\n"
			. "Here are recent results from across the web:\n\n"
			. $formatted_results
			. "Please provide:\n"
			. "1. A concise summary of the current discourse around this topic (2-3 paragraphs)\n"
			. "2. Key findings (3-5 bullet points)\n"
			. "3. Suggested angles for a blog post (2-3 ideas)\n\n"
			. 'Respond in JSON format with keys: summary, key_findings (array of strings), suggested_angles (array of strings).';
	}

	/**
	 * Summarize research results via wp-orchestrator.
	 *
	 * @param \WP_REST_Request $request The incoming request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function summarize( \WP_REST_Request $request ) {
		$topic   = $request->get_param( 'topic' );
		$results = $request->get_param( 'results' );

		$prompt = $this->build_prompt( $topic, $results );

		$response = Client::wpcom_json_api_request_as_user(
			'/odie/chat/content-research',
			'v2',
			array( 'method' => 'POST' ),
			array(
				'message' => $prompt,
			)
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $code ) {
			return new \WP_Error(
				'summarize_failed',
				'Failed to generate summary.',
				array( 'status' => $code )
			);
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		// Try to extract structured data from the AI response.
		$ai_message = $body['messages'][0]['content'] ?? $body['message'] ?? '';

		// Attempt to parse JSON from the AI response.
		$parsed = json_decode( $ai_message, true );
		if ( json_last_error() === JSON_ERROR_NONE && is_array( $parsed ) ) {
			return rest_ensure_response(
				array(
					'summary'          => $parsed['summary'] ?? $ai_message,
					'key_findings'     => $parsed['key_findings'] ?? array(),
					'suggested_angles' => $parsed['suggested_angles'] ?? array(),
				)
			);
		}

		// Fallback: return the raw message as summary.
		return rest_ensure_response(
			array(
				'summary'          => $ai_message,
				'key_findings'     => array(),
				'suggested_angles' => array(),
			)
		);
	}
}
