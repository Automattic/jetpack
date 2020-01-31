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
						'validate_callback' => function ( $param ) {
							return wp_http_validate_url( $param );
						},
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
	 * Follows 301/302 redirect for the passed URL, and returns the final destination and status code.
	 *
	 * @param WP_REST_Request $request The REST API request data.
	 * @return WP_REST_Response The REST API response.
	 */
	public function follow_redirect( $request ) {
		// Add a User-Agent header since the request is sometimes blocked without it.
		$response = wp_safe_remote_get(
			$request['url'],
			array(
				'headers' => array(
					'User-Agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:71.0) Gecko/20100101 Firefox/71.0',
				),
			)
		);

		if ( is_wp_error( $response ) ) {
			return rest_ensure_response(
				array(
					'url'    => '',
					'status' => $response->get_error_code(),
				)
			);
		}

		return rest_ensure_response(
			array(
				'url'    => $this->get_response_url( $response['http_response']->get_response_object() ),
				'status' => wp_remote_retrieve_response_code( $response ),
			)
		);
	}

	/**
	 * Retrieves the response schema, conforming to JSON Schema.
	 *
	 * @return array
	 */
	public function get_item_schema() {
		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'resolve-redirect',
			'type'       => 'object',
			'properties' => array(
				'url'    => array(
					'description' => __( 'The final destination of the URL being checked for redirects.', 'jetpack' ),
					'type'        => 'string',
				),
				'status' => array(
					'description' => __( 'The status code of the URL\'s response.', 'jetpack' ),
					'type'        => 'integer',
				),
			),
		);

		return $schema;
	}

	/**
	 * Finds the destination url from an http response.
	 *
	 * @param Requests_Response $response Response object.
	 * @return string                     Final url of the response.
	 */
	protected function get_response_url( Requests_Response $response ) {
		$history = $response->history;
		if ( ! $history ) {
			return $response->url;
		}

		$location = $history[0]->headers->getValues( 'location' );
		if ( ! $location ) {
			return $response->url;
		}

		return $location[0];
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Resolve_Redirect' );
