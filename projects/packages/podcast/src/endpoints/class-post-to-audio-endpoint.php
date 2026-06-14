<?php
/**
 * Local Jetpack-side REST endpoint for the Post to Audio feature.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast;

use Automattic\Jetpack\Connection\Client;
use Jetpack_Options;
use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Forwards `apiFetch` calls from the block editor to the wpcom-side Post to
 * Audio endpoint as the current user (the upstream endpoint requires user
 * identity for per-post permission + quota attribution).
 *
 * Mirrors Posts_To_Podcast_Endpoint: thin proxy, no business logic. Argument
 * schemas are intentionally permissive (types only, no preset enums) — the
 * wpcom endpoint is the validating authority.
 */
class Post_To_Audio_Endpoint extends WP_REST_Controller {

	use Relay_Response;

	const REST_NAMESPACE = 'wpcom/v2';
	const REST_BASE      = 'post-to-audio';

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
	 * Permission callback shared by every route: any user who can edit posts.
	 * The wpcom endpoint re-checks `edit_post` on the specific target post.
	 *
	 * @return true|WP_Error
	 */
	public static function permission_check() {
		if ( ! current_user_can( 'edit_posts' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Sorry, you are not allowed to use this feature on this site.', 'jetpack-podcast' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Register feature-info, enqueue, job-status, and preview-text routes.
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
					'permission_callback' => array( __CLASS__, 'permission_check' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'enqueue_generation' ),
					'permission_callback' => array( __CLASS__, 'permission_check' ),
					'args'                => array(
						'postId'    => array(
							'type'     => 'integer',
							'required' => true,
						),
						'voice'     => array(
							'type'     => 'string',
							'required' => false,
						),
						'style'     => array(
							'type'     => 'string',
							'required' => false,
						),
						'pace'      => array(
							'type'     => 'string',
							'required' => false,
						),
						'music'     => array(
							'type'     => 'string',
							'required' => false,
						),
						'musicGain' => array(
							'type'     => 'number',
							'required' => false,
						),
						'text'      => array(
							'type'     => 'string',
							'required' => false,
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
					'permission_callback' => array( __CLASS__, 'permission_check' ),
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
			$this->rest_base . '/preview-text',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'preview_text' ),
					'permission_callback' => array( __CLASS__, 'permission_check' ),
					'args'                => array(
						'postId' => array(
							'type'     => 'integer',
							'required' => true,
						),
						'text'   => array(
							'type'     => 'string',
							'required' => false,
						),
					),
				),
			)
		);
	}

	/**
	 * GET — forward to the wpcom feature-info endpoint (quota, presets, active job).
	 *
	 * @return \WP_REST_Response|WP_Error
	 */
	public function read_feature_info() {
		$blog_id = $this->require_blog_id();
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/post-to-audio', $blog_id ),
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
	 * POST — forward an enqueue request and return the queued job descriptor.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return \WP_REST_Response|WP_Error
	 */
	public function enqueue_generation( WP_REST_Request $request ) {
		$blog_id = $this->require_blog_id();
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$body_payload = array(
			'postId' => (int) $request->get_param( 'postId' ),
		);

		foreach ( array( 'voice', 'style', 'pace', 'music', 'text' ) as $key ) {
			$value = $request->get_param( $key );
			if ( is_string( $value ) && '' !== $value ) {
				$body_payload[ $key ] = $value;
			}
		}

		$music_gain = $request->get_param( 'musicGain' );
		if ( null !== $music_gain && '' !== $music_gain ) {
			$body_payload['musicGain'] = (float) $music_gain;
		}

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/post-to-audio', $blog_id ),
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
	 * GET — forward to the wpcom polling endpoint and return the job record.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return \WP_REST_Response|WP_Error
	 */
	public function read_job_status( WP_REST_Request $request ) {
		$blog_id = $this->require_blog_id();
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$job_id = (int) $request['job_id'];

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/post-to-audio/jobs/%d', $blog_id, $job_id ),
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
	 * POST — forward a preview-text request (synchronous strip + chunk breakdown).
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return \WP_REST_Response|WP_Error
	 */
	public function preview_text( WP_REST_Request $request ) {
		$blog_id = $this->require_blog_id();
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$body_payload = array(
			'postId' => (int) $request->get_param( 'postId' ),
		);
		$text         = $request->get_param( 'text' );
		if ( is_string( $text ) && '' !== $text ) {
			$body_payload['text'] = $text;
		}

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/post-to-audio/preview-text', $blog_id ),
			'2',
			array(
				'method'  => 'POST',
				'headers' => array( 'content-type' => 'application/json' ),
				'timeout' => 15,
			),
			wp_json_encode( $body_payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ),
			'wpcom'
		);

		return $this->relay_response( $response );
	}

	/**
	 * Resolve the connected blog id, or a 400 error when the site isn't connected.
	 *
	 * @return int|WP_Error
	 */
	private function require_blog_id() {
		$blog_id = (int) Jetpack_Options::get_option( 'id' );
		if ( ! $blog_id ) {
			return new WP_Error(
				'site-not-connected',
				__( 'Site is not connected to WordPress.com.', 'jetpack-podcast' ),
				array( 'status' => 400 )
			);
		}

		return $blog_id;
	}
}
