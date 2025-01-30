<?php
/**
 * Publicize: Share post
 *
 * This file is synced from the Jetpack monorepo to WPCOM.
 *
 * @package automattic/jetpack
 * @since
 */

use Automattic\Jetpack\Connection\Client;

require_once __DIR__ . '/publicize-connections.php';

/**
 * Publicize: Share post class.
 */
class WPCOM_REST_API_V2_Endpoint_Publicize_Share_Post extends WP_REST_Controller {
	/**
	 * The constructor sets the route namespace, rest_base, and registers our API route and endpoint.
	 * Additionally, we check if we're executing this file on WPCOM or Jetpack.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';

		// $wpcom_is_wpcom_only_endpoint = true keeps WPCOM from trying to loop back to the Jetpack endpoint.
		$this->wpcom_is_wpcom_only_endpoint = true;

		// Determine if this endpoint is running on WPCOM or not.
		$this->is_wpcom = false;
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$this->is_wpcom = true;
		}

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * This file is synced from Jetpack to WPCOM and this method creates a slightly different route for both sites.
	 * Jetpack route: http://{$site}/wp-json/wpcom/v2/posts/{$postId}/publicize
	 * WPCOM route: https://public-api.wordpress.com/wpcom/v2/sites/{$siteId}/posts/{$postId}/publicize
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/posts/(?P<postId>\d+)/publicize',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'share_post' ),
				'permission_callback' => array( $this, 'permissions_check' ),
				'args'                => array(
					'message'             => array(
						'description'       => __( 'The message to share.', 'jetpack' ),
						'type'              => 'string',
						'required'          => true,
						'validate_callback' => function ( $param ) {
							return is_string( $param );
						},
						'sanitize_callback' => 'sanitize_textarea_field',
					),
					'skipped_connections' => array(
						'description'       => __( 'Array of external connection IDs to skip sharing.', 'jetpack' ),
						'type'              => 'array',
						'required'          => false,
						'validate_callback' => function ( $param ) {
							return is_array( $param );
						},
						'sanitize_callback' => function ( $param ) {
							return array_map( 'absint', $param );
						},
					),
					'async'               => array(
						'description' => __( 'Whether to share the post asynchronously.', 'jetpack' ),
						'type'        => 'boolean',
						'default'     => false,
					),
				),
			),
			// override = true because this API route was commandeered from the file
			// wp-content/rest-api-plugins/endpoints/sites-publicize.php on WPCOM.
			true
		);
	}

	/**
	 * Ensure the user has proper tokens and permissions to publish posts on this blog.
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
	 * If this method callback is executed on WPCOM, we share the post using republicize_post(). If this method callback
	 * is executed on a Jetpack site, we make an API call to WPCOM using wpcom_json_api_request_as_user() and return
	 * the results. In both cases, this file and method are executed, as this file is synced from Jetpack to WPCOM.
	 *
	 * @param  WP_REST_Request $request Full details about the request.
	 * @return WP_Error|array The publicize results, including two arrays: `results` and `errors`
	 */
	public function share_post( $request ) {
		$post_id             = $request->get_param( 'postId' );
		$message             = trim( $request->get_param( 'message' ) );
		$skip_connection_ids = $request->get_param( 'skipped_connections' );
		$async               = (bool) $request->get_param( 'async' );

		if ( $this->is_wpcom ) {
			$post = get_post( $post_id );

			if ( empty( $post ) ) {
				return new WP_Error( 'not_found', 'Cannot find that post', array( 'status' => 404 ) );
			}
			if ( 'publish' !== $post->post_status ) {
				return new WP_Error( 'not_published', 'Cannot share an unpublished post', array( 'status' => 400 ) );
			}

			$publicize = publicize_init();
			$result    = $publicize->republicize_post( (int) $post_id, $message, $skip_connection_ids, true, ! $async, get_current_user_id() );
			if ( false === $result ) {
				return new WP_Error( 'not_found', 'Cannot find that post', array( 'status' => 404 ) );
			}

			return $result;
		} else {
			$response = $this->proxy_request( $post_id, $message, $skip_connection_ids, $async );
			if ( is_wp_error( $response ) ) {
				return rest_ensure_response( $response );
			}

			return json_decode( wp_remote_retrieve_body( $response ), true );
		}
	}

	/**
	 * Passes the request on to the WPCOM endpoint, and returns the result.
	 *
	 * @param int    $post_id             The post ID being shared.
	 * @param string $message             The custom message to be used.
	 * @param array  $skip_connection_ids An array of connection IDs where the post shouldn't be shared.
	 * @param bool   $async               Whether to share the post asynchronously.
	 *
	 * @return array|WP_Error $response Response data, else WP_Error on failure.
	 */
	public function proxy_request( $post_id, $message, $skip_connection_ids, $async = false ) {
		/*
		 * Publicize endpoint on WPCOM:
		 * [POST] wpcom/v2/sites/{$siteId}/posts/{$postId}/publicize
		 * body:
		 *   - message: string
		 *   - skipped_connections: array of connection ids to skip
		 */
		$url = sprintf(
			'/sites/%d/posts/%d/publicize',
			Jetpack_Options::get_option( 'id' ),
			$post_id
		);

		return Client::wpcom_json_api_request_as_user(
			$url,
			'v2',
			array(
				'method' => 'POST',
			),
			array(
				'message'             => $message,
				'skipped_connections' => $skip_connection_ids,
				'async'               => $async,
			)
		);
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Publicize_Share_Post' );
