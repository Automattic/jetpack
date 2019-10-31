<?php

use Automattic\Jetpack\Connection\Client;

class WPCOM_REST_API_V2_Endpoint_Google_Sheets_Contact_Form_Integration extends WP_REST_Controller {

	/**
	 * Initialize endpoint.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = '/external-connections/google-sheets/';
		add_action( 'rest_api_init', [ $this, 'register_route' ] );
	}

	/**
	 * Register route to retrieve avatars of a12s
	 *
	 * The endpoint is https://public-api.wordpress.com/wpcom/v2/jetpack-about
	 */
	public function register_route() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			[
				[
					'methods'  => WP_REST_Server::READABLE,
					'callback' => [ $this, 'get_connection_status' ],
				],
				[
					'methods'  => WP_REST_SERVER::CREATABLE,
					'callback' => [ $this, 'create_sheet_connection' ],
					'args'     => array(
						'keyring_id' => array(
							'type'     => 'integer',
							'required' => true,
						),
						'subject'    => array(
							'type'     => 'string',
							'required' => true,
						),
					),
				],
			]
		);
	}

	/**
	 * Get the connection status of a site
	 */
	public function get_connection_status() {
		$site_id = Jetpack_Options::get_option( 'id' );

		if ( ! $site_id ) {
			return new WP_Error( 'site_id_missing' );
		}

		$response = Client::wpcom_json_api_request_as_user( sprintf( '/sites/%d/external-connections/google-sheets', $site_id ), '2', array(), null, 'wpcom' );

		return rest_ensure_response( json_decode( wp_remote_retrieve_body( $response ) ) );
	}

	public function create_sheet_connection( $request ) {
		$keyring_id = $request['keyring_id'];
		$subject    = $request['subject'];
		$site_id    = Jetpack_Options::get_option( 'id' );

		if ( ! $site_id ) {
			return new WP_Error( 'site_id_missing' );
		}

		if ( ! $keyring_id ) {
			return new WP_Error( 'keyring_id_missing' );
		}

		if ( ! $subject ) {
			return new WP_Error( 'subject_missing' );
		}

		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%d/external-connections/google-sheets', $site_id ),
			'2',
			array( 'method' => 'post' ),
			array(
				'keyring_id' => $keyring_id,
				'subject'    => $subject,
			),
			'wpcom'
		);

		$decoded_response = rest_ensure_response( json_decode( wp_remote_retrieve_body( $response ) ) );

		return 'thisisasheetname'; // $decoded_response;
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Google_Sheets_Contact_Form_Integration' );
