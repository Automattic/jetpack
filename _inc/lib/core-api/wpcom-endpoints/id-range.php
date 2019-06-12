<?php

class WPCOM_REST_API_V2_Endpoint_Id_Range {
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	public function register_routes() {
		register_rest_route( 'wpcom/v2', '/id-range', array(
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_range' ),
				'permission_callback' => array( $this, 'permission_callback' ),
				'args'                => array(
					'object_type' => array(
						'type'    => 'string',
						'default' => 'posts',
						'enum'    => array(
							'posts',
							'comments',
							'users'
						)
					),
					'limit'       => array(
						'type'    => 'integer',
						'default' => 1000
					),
					'starting_id' => array(
						'type'    => 'integer',
						'default' => 0,
					)
				),
			),
		) );
	}

	public function permission_callback( $request ) {
		return current_user_can( 'manage_posts' );
	}

	public function get_range( $request ) {
		global $wpdb;

		$type        = $request->get_param( 'object_type' );
		$from        = $wpdb->{$type};
		$limit       = $request->get_param( 'limit' );
		$starting_id = $request->get_param( 'starting_id' );

		$results = $wpdb->get_results(
			"SELECT MIN(ID) AS min, MAX(ID) AS max FROM $from
					WHERE ID > $starting_id
 					ORDER BY ID ASC LIMIT $limit"
		);

		return $results;
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Id_Range' );
