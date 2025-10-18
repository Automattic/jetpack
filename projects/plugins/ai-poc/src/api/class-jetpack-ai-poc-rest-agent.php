<?php
/**
 * REST API Agent Endpoint for Jetpack AI POC.
 *
 * @package automattic/jetpack-ai-poc
 */

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

		// Check if API key is configured
		if ( ! Jetpack_AI_POC_Admin_Settings::has_api_key() ) {
			return new WP_Error(
				'no_api_key',
				'Anthropic API key not configured',
				array( 'status' => 400 )
			);
		}

		$api_key = Jetpack_AI_POC_Admin_Settings::get_api_key();

		// Initialize Neuron AI agent
		$agent = new Jetpack_AI_POC_Neuron_Agent( $api_key );

		// Execute the agent with the user prompt
		$result = $agent->execute( $prompt );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return new WP_REST_Response( $result );
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
