<?php
/**
 * REST API endpoint for the Jetpack AI blocks.
 *
 * @package automattic/jetpack
 * @since 11.8
 */

use Automattic\Jetpack\Connection\Client;

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

		if ( Jetpack_AI_Helper::is_ai_chat_enabled() ) {
			add_action( 'rest_api_init', array( $this, 'register_ai_chat_routes' ) );
		}

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
	 * Register routes for the AI Chat block.
	 * Relies on a site connection and Jetpack Search.
	 */
	public function register_ai_chat_routes() {
		register_rest_route(
			$this->namespace,
			'/jetpack-search/ai/search',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'request_chat_with_site' ),
					'permission_callback' => '__return_true',
				),
				'args' => array(
					'query'         => array(
						'description'       => 'Your question to the site',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'answer_prompt' => array(
						'description'       => 'Answer prompt override',
						'required'          => false,
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/jetpack-search/ai/rank',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'rank_response' ),
					'permission_callback' => '__return_true',
				),
				'args' => array(
					'cache_key' => array(
						'description'       => 'Cache key of your response',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'comment'   => array(
						'description'       => 'Optional feedback',
						'required'          => false,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'rank'      => array(
						'description'       => 'How do you rank this response',
						'required'          => false,
						'sanitize_callback' => 'sanitize_text_field',
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
	 * Get a response from chatting with the site.
	 * Uses Jetpack Search.
	 *
	 * @param  WP_REST_Request $request The request.
	 * @return mixed
	 */
	public function request_chat_with_site( $request ) {
		$question = $request->get_param( 'query' );
		$blog_id  = \Jetpack_Options::get_option( 'id' );
		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%d/jetpack-search/ai/search', $blog_id ) . '?force=wpcom',
			2,
			array(
				'method'  => 'GET',
				'headers' => array( 'content-type' => 'application/json' ),
				'timeout' => MINUTE_IN_SECONDS,
			),
			array(
				'query'         => $question,
				/**
				 * Filter for an answer prompt override.
				 * Example: "Talk like a cowboy."
				 *
				 * @param string $prompt_override The prompt override string.
				 *
				 * @since 12.6
				 */
				'answer_prompt' => apply_filters( 'jetpack_ai_chat_answer_prompt', false ),
			),
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$data = json_decode( wp_remote_retrieve_body( $response ) );

		if ( empty( $data->cache_key ) ) {
			return new WP_Error( 'invalid_ask_response', __( 'Invalid response from the server.', 'jetpack' ), 400 );
		}

		return $data;
	}

	/**
	 * Rank a response from chatting with the site.
	 *
	 * @param  WP_REST_Request $request The request.
	 * @return mixed
	 */
	public function rank_response( $request ) {
		$rank      = $request->get_param( 'rank' );
		$comment   = $request->get_param( 'comment' );
		$cache_key = $request->get_param( 'cache_key' );

		if ( strpos( $cache_key, 'jp-search-ai-' ) !== 0 ) {
			return new WP_Error( 'invalid_cache_key', __( 'Invalid cached context for the answer feedback.', 'jetpack' ), 400 );
		}

		$blog_id  = \Jetpack_Options::get_option( 'id' );
		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%d/jetpack-search/ai/rank', $blog_id ) . '?force=wpcom',
			2,
			array(
				'method'  => 'GET',
				'headers' => array( 'content-type' => 'application/json' ),
				'timeout' => 30,
			),
			array(
				'rank'      => $rank,
				'comment'   => $comment,
				'cache_key' => $cache_key,
			),
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$data = json_decode( wp_remote_retrieve_body( $response ) );

		if ( 'ok' !== $data ) {
			return new WP_Error( 'invalid_feedback_response', __( 'Invalid response from the server.', 'jetpack' ), 400 );
		}

		return $data;
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
