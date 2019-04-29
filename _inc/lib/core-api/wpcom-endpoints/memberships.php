<?php

/**
 * Memberships: API to communicate with "product" database.
 *
 * @since 7.2
 */


class WPCOM_REST_API_V2_Endpoint_Memberships extends WP_REST_Controller {
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'memberships';
		$this->wpcom_is_wpcom_only_endpoint = true;
		$this->wpcom_is_site_specific_endpoint = true;
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Called automatically on `rest_api_init()`.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/status',
			array(
				array(
					'methods'  => WP_REST_Server::READABLE,
					'callback' => array( $this, 'get_status' ),
				),
			)
		);
	}
	public function get_status() {
		$connected_account_id = Jetpack_Memberships::get_connected_account_id();
		$connect_url = '';
		if ( ( defined( 'IS_WPCOM' ) && IS_WPCOM ) ) {
			require_lib( 'memberships' );
			$blog_id = get_current_blog_id();
			if ( ! $connected_account_id ) {
				$connect_url = get_memberships_connected_account_redirect( get_current_user_id() );
			}
			$products = get_memberships_plans( $blog_id );
		} else {
			$blog_id = Jetpack_Options::get_option( 'id' );
			$response = Jetpack_Client::wpcom_json_api_request_as_user(
				"/sites/$blog_id/{$this->rest_base}/status",
				'v2',
				array(),
				null
			);
			if ( is_wp_error( $response ) ) {
				return new WP_Error( 'wpcom_connection_error', 'Could not connect to WP.com', 404 );
			}
			$data = isset( $response['body'] ) ? json_decode( $response['body'], true ) : null;
			if ( ! $connected_account_id ) {
				$connect_url = $data['connect_url'];
			}
			$products = $data['products'];
		}
		return array(
			'connected_account_id' => $connected_account_id,
			'connect_url' => $connect_url,
			'products' => $products,
		);
	}
}
wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Memberships' );
