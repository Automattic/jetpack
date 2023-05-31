<?php
/**
 * REST API endpoint for the Jetpack AI blocks.
 *
 * @package automattic/jetpack
 * @since 11.8
 */

/**
 * Class WPCOM_REST_API_V2_Endpoint_AI
 */
class WPCOM_REST_API_V2_Endpoint_AI extends WP_REST_Controller {
	/**
	 * Namespace prefix.
	 *
	 * @var string
	 */
	public $namespace = 'wpcom/v2';

	/**
	 * Endpoint base route.
	 *
	 * @var string
	 */
	public $rest_base = 'jetpack-ai';

	/**
	 * WPCOM_REST_API_V2_Endpoint_AI constructor.
	 */
	public function __construct() {
		$this->is_wpcom                     = true;
		$this->wpcom_is_wpcom_only_endpoint = true;

		if ( ! class_exists( 'Jetpack_AI_Helper' ) ) {
			require_once JETPACK__PLUGIN_DIR . '_inc/lib/class-jetpack-ai-helper.php';
		}

		// Register routes that don't require Jetpack AI to be enabled.
		add_action( 'rest_api_init', array( $this, 'register_basic_routes' ) );

		if ( ! \Jetpack_AI_Helper::is_enabled() ) {
			return;
		}

		// Register routes that require Jetpack AI to be enabled.
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/completions',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'request_gpt_completion' ),
					'permission_callback' => array( 'Jetpack_AI_Helper', 'get_status_permission_check' ),
				),
				'args' => array(
					'content'    => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_textarea_field',
					),
					'post_id'    => array(
						'required' => false,
						'type'     => 'integer',
					),
					'skip_cache' => array(
						'required'    => false,
						'type'        => 'boolean',
						'description' => 'Whether to skip the cache and make a new request',
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/images/generations',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'request_dalle_generation' ),
					'permission_callback' => array( 'Jetpack_AI_Helper', 'get_status_permission_check' ),
				),
				'args' => array(
					'prompt'  => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_textarea_field',
					),
					'post_id' => array(
						'required' => false,
						'type'     => 'integer',
					),
				),
			)
		);
	}

	/**
	 * Register routes that don't require Jetpack AI to be enabled.
	 */
	public function register_basic_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/ai-assistant-feature',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'request_get_ai_assistance_feature' ),
					'permission_callback' => array( 'Jetpack_AI_Helper', 'get_status_permission_check' ),
				),
			)
		);
	}

	/**
	 * Get completions for a given text.
	 *
	 * @param  WP_REST_Request $request The request.
	 */
	public function request_gpt_completion( $request ) {
		return Jetpack_AI_Helper::get_gpt_completion( $request['content'], $request['post_id'], $request['skip_cache'] );
	}

	/**
	 * Get image generations for a given prompt.
	 *
	 * @param  WP_REST_Request $request The request.
	 */
	public function request_dalle_generation( $request ) {
		return Jetpack_AI_Helper::get_dalle_generation( $request['prompt'], $request['post_id'] );
	}

	/**
	 * Collect and provide relevat data about the AI feature,
	 * such as the number of requests made.
	 */
	public function request_get_ai_assistance_feature() {
		return Jetpack_AI_Helper::get_ai_assistance_feature();
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_AI' );
