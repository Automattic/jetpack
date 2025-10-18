<?php
/**
 * REST API Agent Endpoint for Jetpack AI POC.
 *
 * @package automattic/jetpack-ai-poc
 */

use NeuronAI\Chat\Messages\UserMessage;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class Jetpack_AI_POC_REST_Agent
 *
 * Handles REST API endpoint for AI agent interactions.
 */
class Jetpack_AI_POC_REST_Agent {

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register REST API routes.
	 */
	public function register_routes() {
		register_rest_route(
			'jetpack-ai-poc/v1',
			'/agent',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'handle_agent_request' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args'                => array(
					'prompt' => array(
						'required'          => true,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);
	}

	/**
	 * Handle agent request.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function handle_agent_request( $request ) {
		$prompt = $request->get_param( 'prompt' );

		// Check if API key is configured.
		if ( ! Jetpack_AI_POC_Admin_Settings::has_api_key() ) {
			return new WP_Error(
				'no_api_key',
				__( 'Anthropic API key not configured', 'jetpack-ai-poc' ),
				array( 'status' => 400 )
			);
		}

		$api_key = Jetpack_AI_POC_Admin_Settings::get_api_key();

		try {
			// Initialize Neuron AI agent with WordPress Abilities as tools.
			$agent = Jetpack_AI_POC_Agent::make()
				->with_credentials( $api_key );

			// Send the user's message to the agent.
			$response = $agent->chat( new UserMessage( $prompt ) );

			// Return the agent's response.
			return new WP_REST_Response(
				array(
					'success' => true,
					'message' => $response->getContent(),
				)
			);
		} catch ( Exception $e ) {
			return new WP_Error(
				'agent_error',
				sprintf(
					/* translators: %s: error message */
					__( 'Agent execution failed: %s', 'jetpack-ai-poc' ),
					$e->getMessage()
				),
				array( 'status' => 500 )
			);
		}
	}

	/**
	 * Check if user has permission to use the agent.
	 *
	 * @return bool
	 */
	public function check_permission() {
		return current_user_can( 'manage_options' );
	}
}
