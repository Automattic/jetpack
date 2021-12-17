<?php
/**
 * REST API endpoint used with the OpenTable block.
 *
 * @package automattic/jetpack
 * @since 10.5.0
 */

/**
 * Endpoint acting as proxy for OpenTable restaurant search requests.
 * This seems necessary for now, as per https://github.com/Automattic/jetpack/issues/22006
 *
 * @since 10.5.0
 */
class WPCOM_REST_API_V2_Endpoint_Opentable extends WP_REST_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'opentable';
		// This endpoint *does not* need to connect directly to Jetpack sites.
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the route.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/search',
			array(
				'args'   => array(
					'name'        => array(
						'description'       => __( 'Name of restaurant to search for.', 'jetpack' ),
						'type'              => 'string',
						'required'          => true,
						'validate_callback' => function ( $param ) {
							return is_string( $param );
						},
					),
					'max_results' => array(
						'description'       => __( 'Maximum number of results to return', 'jetpack' ),
						'type'              => 'number',
						'required'          => true,
						'validate_callback' => function ( $param ) {
							return is_int( $param );
						},
					),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'search_restaurants' ),
					'permission_callback' => function () {
						return current_user_can( 'edit_posts' );
					},
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Query the OpenTable API for restaurants matching the passed name.
	 *
	 * @param WP_REST_Request $request The REST API request data.
	 * @return WP_REST_Response The REST API response.
	 */
	public function search_restaurants( $request ) {
		if ( empty( $request['name'] ) ) {
			return rest_ensure_response(
				array(
					'items'   => array(),
					'message' => esc_html__( 'No restaurant name provided.', 'jetpack' ),
					'status'  => 200,
				)
			);
		}

		$api_url = sprintf(
			'https://www.opentable.com/widget/reservation/restaurant-search?pageSize=%1$d&query=%2$s',
			(int) $request['max_results'],
			rawurlencode( $request['name'] )
		);

		// Add a User-Agent header since the request is sometimes blocked without it.
		$response = wp_remote_get(
			$api_url,
			array(
				'user-agent' => 'Mozilla/5.0 Chrome/96 Safari/537',
				'headers'    => array(
					'Accept' => 'application/json',
				),
			)
		);

		if ( is_wp_error( $response ) ) {
			return rest_ensure_response(
				array(
					'items'   => array(),
					'message' => $response->get_error_message(),
					'status'  => $response->get_error_code(),
				)
			);
		}

		$response_body = json_decode( wp_remote_retrieve_body( $response ) );
		if (
			empty( $response_body )
			|| empty( $response_body->items )
		) {
			return rest_ensure_response(
				array(
					'items'   => array(),
					'message' => esc_html__( 'No results found.', 'jetpack' ),
					'status'  => wp_remote_retrieve_response_code( $response ),
				)
			);
		}

		return rest_ensure_response(
			array(
				'items'  => $response_body->items,
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
			'title'      => 'opentable',
			'type'       => 'object',
			'properties' => array(
				'items'  => array(
					'description' => __( 'Array of restaurants that match our search term.', 'jetpack' ),
					'type'        => 'array',
				),
				'status' => array(
					'description' => __( 'The status code of the URL\'s response.', 'jetpack' ),
					'type'        => 'integer',
				),
			),
		);

		return $schema;
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Opentable' );
