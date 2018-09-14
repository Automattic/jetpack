<?php

class WPCOM_REST_API_V2_Endpoint_Ping {

	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	public function register_routes() {
		register_rest_route( 'wpcom/v2', '/ping', array(
			array(
				'methods'  => WP_REST_Server::READABLE,
				'callback' => array( $this, 'get_data' ),
			),
		) );
	}

	public function get_data( $request ) {
		sleep(3);
		return array( 'end' => time() );
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Ping' );
