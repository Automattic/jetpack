<?php
/**
 * File: class-wp-rest-comments-likes.php
 *
 * Provides REST API endpoints for creating and deleting comment likes.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Class WP_REST_Comments_Likes.
 *
 * Handles endpoints for creating a new like and deleting a like.
 */
class WP_REST_Comment_Like extends WP_REST_Controller {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'rest/v1.1';
	}

	/**
	 * Register available routes.
	 */
	public function register_routes() {
		// Endpoint for creating a new like.
		register_rest_route(
			$this->namespace,
			'/comments/(?P<comment_id>\d+)/likes/new',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'new_like' ),
					'permission_callback' => array( $this, 'permission_callback' ),
					'args'                => array(
						'_locale' => array(
							'required' => false,
							'type'     => 'string',
						),
					),
				),
			)
		);

		// Endpoint for deleting the current user's like.
		register_rest_route(
			$this->namespace,
			'/comments/(?P<comment_id>\d+)/likes/mine/delete',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE, // DELETE method.
					'callback'            => array( $this, 'delete_like' ),
					'permission_callback' => array( $this, 'permission_callback' ),
				),
			)
		);
	}

	/**
	 * Permission callback.
	 *
	 * @return bool
	 */
	public function permission_callback(): bool {
		return current_user_can( 'moderate_comments' );
	}

	/**
	 * Callback for the new like endpoint.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_Error|WP_REST_Response
	 */
	public function new_like( WP_REST_Request $request ) {
		$comment_id = $request->get_param( 'comment_id' );
		$blog_id    = \Jetpack_Options::get_option( 'id' );

		// Call WPCom remote API to record a new like.
		$response = \Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_user(
			"/sites/$blog_id/comments/$comment_id/likes/new",
			'v1.1',
			array( 'method' => 'POST' ),
			null,
			'rest'
		);

		return $this->ensure_response( $response );
	}

	/**
	 * Callback for the delete like endpoint.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_Error|WP_REST_Response
	 */
	public function delete_like( WP_REST_Request $request ) {
		$comment_id = $request->get_param( 'comment_id' );
		$blog_id    = \Jetpack_Options::get_option( 'id' );

		// Call a remote API to delete the current user's like.
		$response = \Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_user(
			"/sites/$blog_id/comments/$comment_id/likes/mine/delete",
			'v1.1',
			array( 'method' => 'POST' ), // Using POST here; adjust to DELETE if supported.
			null,
			'rest'
		);

		return $this->ensure_response( $response );
	}

	/**
	 * Ensures a valid rest response.
	 *
	 * @param array|WP_Error $response The remote response object.
	 *
	 * @return WP_Error|WP_REST_Response
	 */
	private function ensure_response( $response ) {
		if ( ! $response || is_wp_error( $response ) ) {
			return $response;
		}

		$body = wp_remote_retrieve_body( $response );

		if ( ! $body ) {
			return new WP_Error( 'unknown_response', 'Empty response', 500 );
		}

		$response = json_decode( $body, true );

		// Return the response from the server.
		return rest_ensure_response( $response );
	}
}
