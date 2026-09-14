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
 * Forwards `wp.apiFetch` calls from the wp-admin Create tab to the wpcom-side
 * endpoint as the current user (the upstream endpoint requires user identity).
 */
class Posts_To_Podcast_Endpoint extends WP_REST_Controller {

	use Relay_Response;

	const SUPPORTED_LENGTHS                     = array( 'short', 'medium', 'long' );
	const SUPPORTED_VOICE_PRESETS               = array( 'witty', 'earnest', 'professional' );
	const REST_NAMESPACE                        = 'wpcom/v2';
	const REST_BASE                             = 'posts-to-podcast';
	const POST_PUBLISH_PROMO_DISMISS_REST_ROUTE = 'post-publish-promo/dismiss';

	/**
	 * Whether `init()` has wired its hooks.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Wire up routes. Idempotent.
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		$instance = new self();
		add_action( 'rest_api_init', array( $instance, 'register_routes' ) );
	}

	/**
	 * Get the REST API path used by apiFetch for post-publish promo dismissal.
	 *
	 * @return string
	 */
	public static function get_post_publish_promo_dismiss_rest_path() {
		return '/' . self::REST_NAMESPACE . '/' . self::REST_BASE . '/' . self::POST_PUBLISH_PROMO_DISMISS_REST_ROUTE;
	}

	/**
	 * Register feature info, enqueue, job-status, and promo dismissal routes.
	 */
	public function register_routes() {
		$this->namespace = self::REST_NAMESPACE;
		$this->rest_base = self::REST_BASE;

		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'read_feature_info' ),
					'permission_callback' => array( Posts_To_Podcast_Helper::class, 'get_status_permission_check' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'enqueue_generation' ),
					'permission_callback' => array( Posts_To_Podcast_Helper::class, 'get_status_permission_check' ),
					'args'                => array(
						'window'      => array(
							'type'        => 'object',
							'required'    => false,
							'description' => __( 'Either { unit: days|weeks|months, n: <positive int> } or { from, to } as ISO-8601 dates. Required when postIds is omitted.', 'jetpack-podcast' ),
						),
						'postIds'     => array(
							'type'        => 'array',
							'required'    => false,
							'items'       => array( 'type' => 'integer' ),
							'maxItems'    => 25,
							'description' => __( 'Explicit list of published post IDs to draw from (up to 25). Required when window is omitted.', 'jetpack-podcast' ),
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
						'prompt'      => array(
							'type'        => 'string',
							'required'    => false,
							'description' => __( 'Optional free-form instructions appended to the generation prompt.', 'jetpack-podcast' ),
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

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/episodes',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'read_episodes' ),
					'permission_callback' => array( Posts_To_Podcast_Helper::class, 'get_status_permission_check' ),
					'args'                => array(
						'page'     => array(
							'type'    => 'integer',
							'default' => 1,
							'minimum' => 1,
						),
						'per_page' => array(
							'type'    => 'integer',
							'default' => 5,
							'minimum' => 1,
							'maximum' => 50,
						),
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/' . self::POST_PUBLISH_PROMO_DISMISS_REST_ROUTE,
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'dismiss_post_publish_promo' ),
				'permission_callback' => function () {
					return current_user_can( 'edit_posts' );
				},
			)
		);
	}

	/**
	 * Return the generated episodes the current user can edit, newest first.
	 * See `Posts_To_Podcast_Helper::get_episodes()` for the envelope shape.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response
	 */
	public function read_episodes( WP_REST_Request $request ) {
		return rest_ensure_response(
			Posts_To_Podcast_Helper::get_episodes(
				(int) $request->get_param( 'page' ),
				(int) $request->get_param( 'per_page' )
			)
		);
	}

	/**
	 * Persist post-publish promo dismissal for the current user and site.
	 *
	 * @return WP_REST_Response
	 */
	public function dismiss_post_publish_promo() {
		update_user_option( get_current_user_id(), Create_AI_Podcast_Page::POST_PUBLISH_PROMO_DISMISSED_OPTION, 1 );

		return rest_ensure_response(
			array(
				'dismissed' => true,
			)
		);
	}

	/**
	 * Forward GET to the wpcom-side endpoint and return feature info
	 * (remaining credits, plan, supported presets).
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function read_feature_info() {
		$blog_id = (int) Jetpack_Options::get_option( 'id' );
		if ( ! $blog_id ) {
			return new WP_Error( 'site-not-connected', __( 'Site is not connected to WordPress.com.', 'jetpack-podcast' ), array( 'status' => 400 ) );
		}

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/posts-to-podcast', $blog_id ),
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

		$body_payload = array(
			'length'      => $request->get_param( 'length' ),
			'voicePreset' => $request->get_param( 'voicePreset' ),
		);

		$window = $request->get_param( 'window' );
		if ( null !== $window ) {
			$body_payload['window'] = $window;
		}

		$post_ids = $request->get_param( 'postIds' );
		if ( is_array( $post_ids ) && ! empty( $post_ids ) ) {
			$body_payload['postIds'] = array_values( array_map( 'intval', $post_ids ) );
		}

		$prompt = $request->get_param( 'prompt' );
		if ( is_string( $prompt ) && '' !== $prompt ) {
			$body_payload['prompt'] = $prompt;
		}

		if ( ! isset( $body_payload['window'] ) && ! isset( $body_payload['postIds'] ) ) {
			return new WP_Error( 'missing-source', __( 'One of window or postIds is required.', 'jetpack-podcast' ), array( 'status' => 400 ) );
		}

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/posts-to-podcast', $blog_id ),
			'2',
			array(
				'method'  => 'POST',
				'headers' => array( 'content-type' => 'application/json' ),
				'timeout' => 30,
			),
			wp_json_encode( $body_payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ),
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
}
