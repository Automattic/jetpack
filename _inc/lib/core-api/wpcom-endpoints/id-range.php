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
				'description'         => 'An endpoint to retrieve the minimum and maximum ID from the database table corresponding to the given object type.',
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
					'batch_size'  => array(
						'type'    => 'integer',
						'default' => 1000
					)
				),
			),
		) );
	}

	public function permission_callback( $request ) {
		return true;
		return current_user_can( 'manage_posts' );
	}

	public function get_range( $request ) {
		global $wpdb;

		$results = array();

		$type        = $request->get_param( 'object_type' );
		$from        = $wpdb->{$type};
		$batch_size  = $request->get_param( 'batch_size' );
		$current_max = 0;
		$current_min = 1;

		$total = $wpdb->get_row(
			"SELECT MIN(ID) AS min, MAX(ID) AS max FROM $from ORDER BY ID ASC"
		);

		while ( $total->max > $current_max ) {
			$result = $wpdb->get_row(
				$wpdb->prepare(
					"SELECT MIN(ID) AS min, MAX(ID) AS max 
						FROM %s WHERE ID > %d
						ORDER BY ID ASC LIMIT %d",
					$from,
					$current_max,
					$batch_size
				)
			);
			if ( empty( $result->min ) && empty( $result->max ) ) {
				$current_max = (int) $total->max;
				$result      = (object) array( 'min' => $current_min, 'max' => $current_max );
			} else {
				$current_min = (int) $result->min;
				$current_max = (int) $result->max;
			}
			$results[] = $result;
		}

		return $results;
	}
}
