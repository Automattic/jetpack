<?php
/**
 * REST API proxy endpoint for AI-powered content guidelines suggestions.
 *
 * Proxies requests to the wpcom endpoint that generates guidelines
 * using site content analysis.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Client;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class WPCOM_REST_API_V2_Endpoint_Agent_Guidelines_AI
 */
class WPCOM_REST_API_V2_Endpoint_Agent_Guidelines_AI extends WP_REST_Controller {
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
	public $rest_base = 'jetpack-ai/suggest-guidelines';

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->is_wpcom                     = true;
		$this->wpcom_is_wpcom_only_endpoint = true;

		add_action( 'rest_api_init', array( $this, 'maybe_register_routes' ) );
	}

	/**
	 * Register routes on `rest_api_init`, gating on the AI feature state.
	 *
	 * The Jetpack_AI_Helper check (which loads the helper and instantiates
	 * Status/Host classes) runs here rather than in the constructor so that code
	 * is only loaded when the REST API is actually in use, not on every
	 * front-end, cron, or login request.
	 */
	public function maybe_register_routes() {
		if ( ! class_exists( 'Jetpack_AI_Helper' ) ) {
			require_once JETPACK__PLUGIN_DIR . '_inc/lib/class-jetpack-ai-helper.php';
		}

		// Intentionally gated to Simple and Atomic sites only.
		// Self-hosted Jetpack support is deferred — we want to roll out
		// on WordPress.com platforms first before opening to all connected sites.
		if ( ! \Jetpack_AI_Helper::is_enabled() ) {
			return;
		}

		$this->register_routes();
	}

	/**
	 * Register routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'suggest_guidelines' ),
				'permission_callback' => array( $this, 'permission_callback' ),
				'args'                => array(
					'categories' => array(
						'description' => __( 'Categories to generate guidelines for.', 'jetpack' ),
						'type'        => 'object',
						'required'    => true,
					),
				),
			)
		);
	}

	/**
	 * Permission check — require manage_options.
	 *
	 * @return bool
	 */
	public function permission_callback() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Proxy the suggest-guidelines request to wpcom.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return mixed|WP_Error
	 */
	public function suggest_guidelines( $request ) {
		$blog_id = \Jetpack_Options::get_option( 'id' );

		$body = array(
			'categories' => $request->get_param( 'categories' ),
		);

		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%d/jetpack-ai/suggest-guidelines', $blog_id ) . '?force=wpcom',
			'2',
			array(
				'method'  => 'POST',
				'headers' => array( 'content-type' => 'application/json' ),
				'timeout' => 90,
			),
			wp_json_encode( $body, JSON_UNESCAPED_SLASHES ),
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		$body_str    = wp_remote_retrieve_body( $response );
		$data        = json_decode( $body_str, true );

		if ( $status_code !== 200 ) {
			$message = is_array( $data ) && isset( $data['message'] ) ? $data['message'] : __( 'Failed to generate guidelines.', 'jetpack' );
			$code    = is_array( $data ) && isset( $data['code'] ) ? $data['code'] : 'upstream_error';
			return new WP_Error( $code, $message, array( 'status' => $status_code ) );
		}

		if ( JSON_ERROR_NONE !== json_last_error() ) {
			return new WP_Error(
				'invalid_response',
				__( 'The guidelines service returned a malformed response.', 'jetpack' ),
				array( 'status' => 502 )
			);
		}

		return $data;
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Agent_Guidelines_AI' );
