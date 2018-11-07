<?php

class WPCOM_REST_API_V2_Endpoint_Gutenberg {
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	public function register_routes() {
		register_rest_route( 'wpcom/v2', '/sites/(?P<site>[a-zA-Z0-9\.\-]+)/gutenberg', array(
			array(
				'methods'  => WP_REST_Server::CREATABLE,
				'callback' => array( $this, 'set_editor' ),
			),
		) );
	}

	public function set_editor( $data ) {
		$site_slug = $data[ 'site' ];
		$request = Jetpack_Client::wpcom_json_api_request_as_user(
			"/sites/${site_slug}/gutenberg?platform=web&editor=classic",
			'2',
			array(
				'editor'   => $data[ 'editor' ],
				'platform' => $data[ 'platform' ],
				'method'   => 'POST',
				'headers'  => array(
					'X-Forwarded-For' => Jetpack::current_user_ip( true ),
				),

			)
		);

		$body = wp_remote_retrieve_body( $request );
		if ( 200 === wp_remote_retrieve_response_code( $request ) ) {
			$data = $body;
		} else {
			// something went wrong so we'll just return the response without caching
			return $body;
		}

		return $data;
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Gutenberg' );
