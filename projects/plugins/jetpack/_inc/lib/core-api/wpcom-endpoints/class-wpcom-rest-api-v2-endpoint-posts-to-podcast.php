<?php
/**
 * Local Jetpack-side REST endpoint for the Posts to Podcast feature.
 *
 * The Jetpack admin form calls this local endpoint via wp.apiFetch; the endpoint
 * forwards the request to the wpcom-side endpoint at public-api.wordpress.com as
 * the current user via Connection\Client::wpcom_json_api_request_as_user. The
 * upstream endpoint requires `is_automattician()`, so the user-token form is
 * needed — a blog-token call has no user identity and would 401.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Client;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

if ( ! class_exists( 'Jetpack_Posts_To_Podcast_Helper' ) ) {
	require_once JETPACK__PLUGIN_DIR . '_inc/lib/class-jetpack-posts-to-podcast-helper.php';
}

/**
 * Class WPCOM_REST_API_V2_Endpoint_Posts_To_Podcast
 */
class WPCOM_REST_API_V2_Endpoint_Posts_To_Podcast extends WP_REST_Controller {

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
	public $rest_base = 'posts-to-podcast';

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->is_wpcom                     = true;
		$this->wpcom_is_wpcom_only_endpoint = false;

		if ( ! Jetpack_Posts_To_Podcast_Helper::is_enabled() ) {
			return;
		}

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'enqueue_generation' ),
					'permission_callback' => array( 'Jetpack_Posts_To_Podcast_Helper', 'get_status_permission_check' ),
					'args'                => $this->get_enqueue_args(),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/jobs/(?P<job_id>\d+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'read_job_status' ),
					'permission_callback' => array( 'Jetpack_Posts_To_Podcast_Helper', 'get_status_permission_check' ),
					'args'                => array(
						'job_id' => array(
							'type'     => 'integer',
							'required' => true,
						),
					),
				),
			)
		);
	}

	/**
	 * Argument schema for the POST route.
	 *
	 * @return array<string, array<string, mixed>>
	 */
	private function get_enqueue_args() {
		return array(
			'window'      => array(
				'type'        => 'object',
				'required'    => true,
				'description' => __( 'Either { unit: days|weeks|months, n: <positive int> } or { from, to } as ISO-8601 dates.', 'jetpack' ),
			),
			'length'      => array(
				'type'        => 'string',
				'required'    => true,
				'enum'        => wp_list_pluck( Jetpack_Posts_To_Podcast_Helper::get_length_presets(), 'id' ),
				'description' => __( 'Length preset id.', 'jetpack' ),
			),
			'voicePreset' => array(
				'type'        => 'string',
				'required'    => true,
				'enum'        => wp_list_pluck( Jetpack_Posts_To_Podcast_Helper::get_voice_presets(), 'id' ),
				'description' => __( 'Voice preset id.', 'jetpack' ),
			),
		);
	}

	/**
	 * Forward POST to the wpcom-side endpoint and return the queued job descriptor.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function enqueue_generation( WP_REST_Request $request ) {
		$blog_id = (int) Jetpack_Options::get_option( 'id' );
		if ( ! $blog_id ) {
			return new WP_Error( 'site-not-connected', __( 'Site is not connected to WordPress.com.', 'jetpack' ), array( 'status' => 400 ) );
		}

		$query = http_build_query(
			array(
				'window'      => $request->get_param( 'window' ),
				'length'      => $request->get_param( 'length' ),
				'voicePreset' => $request->get_param( 'voicePreset' ),
			),
			'',
			'&'
		);

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/posts-to-podcast?%s', $blog_id, $query ),
			2,
			array(
				'method'  => 'POST',
				'timeout' => 30,
			),
			null,
			'wpcom'
		);

		return $this->relay_response( $response );
	}

	/**
	 * Forward GET to the wpcom-side polling endpoint and return the job record.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function read_job_status( WP_REST_Request $request ) {
		$blog_id = (int) Jetpack_Options::get_option( 'id' );
		if ( ! $blog_id ) {
			return new WP_Error( 'site-not-connected', __( 'Site is not connected to WordPress.com.', 'jetpack' ), array( 'status' => 400 ) );
		}

		$job_id = (int) $request['job_id'];

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/posts-to-podcast/jobs/%d', $blog_id, $job_id ),
			2,
			array(
				'method'  => 'GET',
				'headers' => array( 'content-type' => 'application/json' ),
				'timeout' => 15,
			),
			null,
			'wpcom'
		);

		return $this->relay_response( $response );
	}

	/**
	 * Relay an upstream Connection\Client response back to the local REST client.
	 * Preserves the upstream HTTP status code so 202/4xx/5xx mappings flow through.
	 *
	 * @param array|WP_Error $response The raw response from Client::wpcom_json_api_request_as_blog.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	private function relay_response( $response ) {
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$code    = (int) wp_remote_retrieve_response_code( $response );
		$body    = wp_remote_retrieve_body( $response );
		$decoded = json_decode( $body, true );

		$rest_response = rest_ensure_response( null === $decoded ? $body : $decoded );
		if ( $code >= 100 && $code < 600 ) {
			$rest_response->set_status( $code );
		}
		return $rest_response;
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Posts_To_Podcast' );
