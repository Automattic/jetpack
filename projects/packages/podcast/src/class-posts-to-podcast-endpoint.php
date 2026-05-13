<?php
/**
 * Local Jetpack-side REST endpoint for the Posts to Podcast feature.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast;

use Automattic\Jetpack\Connection\Client;
use Jetpack_Options;
use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Forwards `wp.apiFetch` calls from the wp-admin Settings tab to the wpcom-side
 * endpoint as the current user (the upstream endpoint requires user identity).
 */
class Posts_To_Podcast_Endpoint extends WP_REST_Controller {

	const SUPPORTED_LENGTHS       = array( 'short', 'medium', 'long' );
	const SUPPORTED_VOICE_PRESETS = array( 'witty', 'earnest', 'professional' );

	/**
	 * Wire up routes if the feature is enabled for this site.
	 */
	public static function init() {
		if ( ! Posts_To_Podcast_Helper::is_enabled() ) {
			return;
		}

		$instance = new self();
		add_action( 'rest_api_init', array( $instance, 'register_routes' ) );
	}

	/**
	 * Register the POST + GET routes.
	 */
	public function register_routes() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'posts-to-podcast';

		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'enqueue_generation' ),
					'permission_callback' => array( Posts_To_Podcast_Helper::class, 'get_status_permission_check' ),
					'args'                => array(
						'window'      => array(
							'type'        => 'object',
							'required'    => true,
							'description' => __( 'Either { unit: days|weeks|months, n: <positive int> } or { from, to } as ISO-8601 dates.', 'jetpack-podcast' ),
						),
						'length'      => array(
							'type'        => 'string',
							'required'    => true,
							'enum'        => self::SUPPORTED_LENGTHS,
							'description' => __( 'Length preset id.', 'jetpack-podcast' ),
						),
						'voicePreset' => array(
							'type'        => 'string',
							'required'    => true,
							'enum'        => self::SUPPORTED_VOICE_PRESETS,
							'description' => __( 'Voice preset id.', 'jetpack-podcast' ),
						),
					),
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
					'permission_callback' => array( Posts_To_Podcast_Helper::class, 'get_status_permission_check' ),
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
	 * Forward POST to the wpcom-side endpoint and return the queued job descriptor.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function enqueue_generation( WP_REST_Request $request ) {
		$blog_id = (int) Jetpack_Options::get_option( 'id' );
		if ( ! $blog_id ) {
			return new WP_Error( 'site-not-connected', __( 'Site is not connected to WordPress.com.', 'jetpack-podcast' ), array( 'status' => 400 ) );
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
			'2',
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
			return new WP_Error( 'site-not-connected', __( 'Site is not connected to WordPress.com.', 'jetpack-podcast' ), array( 'status' => 400 ) );
		}

		$job_id = (int) $request['job_id'];

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/posts-to-podcast/jobs/%d', $blog_id, $job_id ),
			'2',
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
	 * @param array|\WP_Error $response The raw response from Client::wpcom_json_api_request_as_user.
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
