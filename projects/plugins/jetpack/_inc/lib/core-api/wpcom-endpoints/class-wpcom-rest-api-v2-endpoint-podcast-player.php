<?php
/**
 * Podcast Player API
 *
 * @package automattic/jetpack
 * @since 8.4.0
 */

/**
 * Fetch podcast feeds and parse data for the Podcast Player block.
 *
 * @since 8.4.0
 */
class WPCOM_REST_API_V2_Endpoint_Podcast_Player extends WP_REST_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		if ( ! class_exists( 'Jetpack_Podcast_Helper' ) ) {
			jetpack_require_lib( 'class-jetpack-podcast-helper' );
		}

		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'podcast-player';
		// This endpoint *does not* need to connect directly to Jetpack sites.
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the route.
	 */
	public function register_routes() {
		// GET /sites/<blog_id>/podcast-player - Returns feed data.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_player_data' ),
					'permission_callback' => function () {
						return current_user_can( 'edit_posts' );
					},
					'args'                => array(
						'url'             => array(
							'description'       => __( 'The Podcast RSS feed URL.', 'jetpack' ),
							'type'              => 'string',
							'required'          => 'true',
							'validate_callback' => function ( $param ) {
								return wp_http_validate_url( $param );
							},
						),
						'guids'           => array(
							'description'       => __( 'A list of unique identifiers for fetching specific podcast episodes.', 'jetpack' ),
							'type'              => 'array',
							'required'          => 'false',
							'validate_callback' => function ( $guids ) {
								return is_array( $guids );
							},
							'sanitize_callback' => function ( $guids ) {
									return array_map( 'sanitize_text_field', $guids );
							},
						),
						'episode-options' => array(
							'description' => __( 'Whether we should return the episodes list for use in the selection UI', 'jetpack' ),
							'type'        => 'boolean',
							'required'    => 'false',
						),
					),
					'schema'              => array( $this, 'get_public_item_schema' ),
				),
			)
		);
	}

	/**
	 * Retreives data needed to display a podcast player from RSS feed.
	 *
	 * @param WP_REST_Request $request The REST API request data.
	 * @return WP_REST_Response The REST API response.
	 */
	public function get_player_data( $request ) {
		$helper = new Jetpack_Podcast_Helper( $request['url'] );

		$args = array();

		if ( isset( $request['guids'] ) ) {
			$args['guids'] = $request['guids'];
		}

		if ( isset( $request['episode-options'] ) && $request['episode-options'] ) {
			$args['episode-options'] = true;
		}

		$player_data = $helper->get_player_data( $args );

		if ( is_wp_error( $player_data ) ) {
			return rest_ensure_response( $player_data );
		}

		$player_data = $this->prepare_for_response( $player_data, $request );
		return rest_ensure_response( $player_data );
	}

	/**
	 * Filters out data based on ?_fields= request parameter
	 *
	 * @param array           $player_data Data for the player.
	 * @param WP_REST_Request $request The request.
	 * @return array filtered $player_data
	 */
	public function prepare_for_response( $player_data, $request ) {
		if ( ! is_callable( array( $this, 'get_fields_for_response' ) ) ) {
			return $player_data;
		}

		$fields = $this->get_fields_for_response( $request );

		$response_data = array();
		foreach ( $player_data as $field => $value ) {
			if ( in_array( $field, $fields, true ) ) {
				$response_data[ $field ] = $value;
			}
		}

		return $response_data;
	}

	/**
	 * Retrieves the response schema, conforming to JSON Schema.
	 *
	 * @return array
	 */
	public function get_item_schema() {
		return Jetpack_Podcast_Helper::get_player_data_schema();
	}
}
wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Podcast_Player' );
