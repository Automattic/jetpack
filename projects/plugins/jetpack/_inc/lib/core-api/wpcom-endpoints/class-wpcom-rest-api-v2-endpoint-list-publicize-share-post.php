<?php
/**
 * Publicize: Share post
 *
 * Share the post.
 *
 * @package automattic/jetpack
 * @since
 */

use Automattic\Jetpack\Connection\Client;

require_once __DIR__ . '/publicize-connections.php';

/**
 * Publicize Share post class.
 */
class WPCOM_REST_API_V2_Endpoint_List_Publicize_Share_Post extends WP_REST_Controller {
	/**
	 * The constructor sets the route namespace and rest_base.
	 * It also adds the action that registers our API endpoint route.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = '/publicize/share';

		$this->wpcom_is_wpcom_only_endpoint = true;
		$this->is_wpcom                     = false;

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$this->is_wpcom = true;
		}

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * This is the function we reference in the add_action callback in the constructor.
	 * It registers the endpoint route: http://{$site}/wp-json/wpcom/v2/publicize/share/{$postId}
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/(?P<postId>[\d]+)',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'share_post' ),
				'permission_callback' => array( $this, 'permissions_check' ),
				'args'                => array(
					'postId'               => array(
						'description'       => __( 'The WordPress Post ID.', 'jetpack' ),
						'type'              => 'int',
						'required'          => 'true',
						'validate_callback' => function ( $param ) {
							return is_numeric( $param );
						},
					),
					'message'              => array(
						'description'       => __( 'The message to share.', 'jetpack' ),
						'type'              => 'string',
						'required'          => 'true',
						'validate_callback' => function ( $param ) {
							return is_string( $param );
						},
						'sanitize_callback' => 'sanitize_textarea_field',
					),
					'skippedConnectionIds' => array(
						'description'       => __( 'Array of external connection IDs to skip sharing.', 'jetpack' ),
						'type'              => 'array',
						'required'          => 'true',
						'validate_callback' => function ( $param ) {
							return is_array( $param );
						},
						'sanitize_callback' => function ( $param ) {
							return array_map( 'absint', $param );
						},
					),
				),
			)
		);
	}

	/**
	 * Ensure the user has proper permissions.
	 *
	 * @return WP_Error|boolean
	 */
	public function permissions_check() {
		if ( ! get_current_user_id() ) {
			return new WP_Error(
				'rest_cannot_view',
				__( 'Sorry, you cannot view this resource without a valid token for this blog.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}
		if ( ! current_user_can( 'publish_posts' ) ) {
			return new WP_Error( 'unauthorized', 'Your token must have permission to publish posts.', array( 'status' => 401 ) );
		}
		return true;
	}

	/**
	 * Share a post
	 *
	 * @param  WP_REST_Request $request Full details about the request.
	 * @return WP_Error|array The publicize results, including two arrays: `results` and `errors`
	 */
	public function share_post( $request ) {
		$post_id             = $request->get_param( 'postId' );
		$message             = trim( $request->get_param( 'message' ) );
		$skipped_connections = $request->get_param( 'skipped_connections' );

		if ( $this->is_wpcom ) {
			$post = get_post( $post_id );

			if ( empty( $post ) ) {
				return new WP_Error( 'not_found', 'Cannot find that post', array( 'status' => 404 ) );
			}
			if ( 'publish' !== $post->post_status ) {
				return new WP_Error( 'not_published', 'Cannot publicize an unpublished post', array( 'status' => 400 ) );
			}

			$publicize = publicize_init();
			$result    = $publicize->republicize_post( (int) $post_id, $message, $skipped_connections );
			if ( false === $result ) {
				return new WP_Error( 'not_found', 'Cannot find that post', array( 'status' => 404 ) );
			}

			return $result;
		} else {
			/*
			 * Publicize endpoint
			 * [POST] wpcom/v2/sites/<site-id>/posts/<post-id>/share
			 * body:
			 *   - message: string
			 *   - skipped_connections: array of connection ids to skip
			 */
			$url = sprintf(
				'/sites/%d/publicize/share/%d',
				Jetpack_Options::get_option( 'id' ),
				$post_id
			);

			$response = Client::wpcom_json_api_request_as_user(
				$url,
				'v2',
				array(
					'method' => 'POST',
				),
				array(
					'message'             => $message,
					'skipped_connections' => $skipped_connections,
				)
			);

			if ( is_wp_error( $response ) ) {
				return rest_ensure_response( $response );
			}

			return json_decode( wp_remote_retrieve_body( $response ), true );
		}
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_List_Publicize_Share_Post' );
