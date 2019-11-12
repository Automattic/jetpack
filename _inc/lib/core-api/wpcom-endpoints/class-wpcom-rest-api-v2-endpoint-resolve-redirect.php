<?php
/**
 * REST API endpoint for resolving URL redirects.
 *
 * @package Jetpack
 * @since 8.0.0
 */

/**
 * Resolve URL redirects.
 *
 * @since 8.0.0
 */
class WPCOM_REST_API_V2_Endpoint_Resolve_Redirect extends WP_REST_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'resolve-redirect';
		// This endpoint *does not* need to connect directly to Jetpack sites.
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the route.
	 */
	public function register_routes() {
		// GET /sites/<blog_id>/resolve-redirect/<url> - Follow 301/302 redirects on a URL, and return the final destination.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<url>.+)',
			array(
				'args'   => array(
					'url' => array(
						'description'       => __( 'The URL to check for redirects.', 'jetpack' ),
						'type'              => 'string',
						'required'          => 'true',
						'validate_callback' => 'wp_http_validate_url',
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'follow_redirect' ),
					'permission_callback' => 'is_user_logged_in',
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Follows 301/302 redirect for the passed URL, and returns the final destination.
	 *
	 * @param WP_REST_Request $request The REST API request data.
	 * @return WP_REST_Response The REST API response.
	 */
	public function follow_redirect( $request ) {
		$response = wp_safe_remote_get( $request['url'] );
		if ( is_wp_error( $response ) ) {
			return rest_ensure_response( '' );
		}

		$history = $response['http_response']->get_response_object()->history;
		if ( ! $history ) {
			return response_ensure_response( $request['url'] );
		}

		$location = $history[0]->headers->getValues( 'location' );
		if ( ! $location ) {
			return response_ensure_response( $request['url'] );
		}

		return rest_ensure_response( $location[0] );
	}

	/**
	 * Retrieves the comment's schema, conforming to JSON Schema.
	 *
	 * @return array
	 */
	public function get_item_schema() {
		$schema = array(
			'$schema'     => 'http://json-schema.org/draft-04/schema#',
			'title'       => 'resolve-redirect',
			'type'        => 'string',
			'description' => __( 'The final destination of the URL being checked for redirects.', 'jetpack' ),
		);

		return $schema;
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Resolve_Redirect' );
