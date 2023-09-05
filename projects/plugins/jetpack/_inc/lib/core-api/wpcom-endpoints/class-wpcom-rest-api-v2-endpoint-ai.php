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

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/transcriptions',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'get_transcriptions' ),
				'permission_callback' => array( 'Jetpack_AI_Helper', 'get_status_permission_check' ),
				'args'                => array(
					'tmp_file'        => array(
						'description'       => 'Temporary file containing the audio to be transcribed. It can be a base64 encoded string or a file path.',
						'type'              => array( 'string', 'object' ),
						'validate_callback' => function ( $param ) {
							return is_string( $param ) || is_object( $param );
						},
					),
					'response_format' => array(
						'required'    => false,
						'description' => 'The format of the response: "json", "text", "srt", "verbose_json", or "vtt".',
						'type'        => 'string',
						'default'     => 'json',
						'enum'        => array( 'json', 'text', 'srt', 'verbose_json', 'vtt' ),
					),
					'prompt'          => array(
						'type'        => 'string',
						'required'    => false,
						'description' => 'An optional text to guide the model\'s style or continue a previous audio segment. The prompt should match the audio language.',
					),
					'model'           => array(
						'type'        => 'string',
						'required'    => false,
						'description' => 'ID of the model to use. Only whisper-1 is currently available.',
						'default'     => 'whisper-1',
						'enum'        => array( 'whisper-1' ),
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

	/**
	 * Get transcriptions for a given audio file.
	 *
	 * @param  WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_transcriptions( $request ) {
		// Pick the endpoint option args
		$options = $request->get_params();

		// Try to get temporary file from request file params.
		$files    = $request->get_file_params();
		$tmp_file = isset( $files['tmp_file'] ) && ! empty( $files['tmp_file'] ) ? $files['tmp_file'] : null;

		if ( ! $tmp_file ) {
			// Temporary file not found in request file params, try to get it from request json params.
			$json_params = $request->get_json_params();
			$file_64     = isset( $json_params['tmp_file'] ) ? $json_params['tmp_file'] : null;
			$tmp_file    = base64_decode( $file_64 ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode
		}

		// Repopulate $options with the file
		$options['file'] = $tmp_file;

		if ( ! $tmp_file ) {
			return new WP_Error( 'no_file', 'No file provided' );
		}

		return Jetpack_AI_Helper::get_open_ai_audio_transcription( $tmp_file, $options );
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_AI' );
