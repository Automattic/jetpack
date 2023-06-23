<?php
/**
 * Trait WPCOM_REST_API_Proxy_Request_Trait
 *
 * Used to proxy requests to wpcom servers.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Status\Visitor;

trait WPCOM_REST_API_Proxy_Request_Trait {

	/**
	 * Proxy request to wpcom servers for the site and user.
	 *
	 * @param WP_Rest_Request $request Request to proxy.
	 * @param string          $path Path to append to the rest base.
	 *
	 * @return mixed|WP_Error           Response from wpcom servers or an error.
	 */
	public function proxy_request_to_wpcom_as_user( $request, $path = '' ) {
		$blog_id      = \Jetpack_Options::get_option( 'id' );
		$path         = '/sites/' . rawurldecode( $blog_id ) . rawurldecode( $this->rest_base ) . ( $path ? '/' . rawurldecode( $path ) : '' );
		$query_params = $request->get_query_params();

		/*
		 * A rest_route parameter can be added when using plain permalinks.
		 * It is not necessary to pass them to WordPress.com,
		 * and may even cause issues with some endpoints.
		 * Let's remove it.
		 */
		if ( isset( $query_params['rest_route'] ) ) {
			unset( $query_params['rest_route'] );
		}
		$api_url = add_query_arg( $query_params, $path );

		$request_options = array(
			'headers' => array(
				'Content-Type'    => 'application/json',
				'X-Forwarded-For' => ( new Visitor() )->get_ip( true ),
			),
			'method'  => $request->get_method(),
		);

		$response = Client::wpcom_json_api_request_as_user( $api_url, $this->version, $request_options, $request->get_body(), $this->base_api_path );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$response_status = wp_remote_retrieve_response_code( $response );
		$response_body   = json_decode( wp_remote_retrieve_body( $response ) );

		if ( $response_status >= 400 ) {
			$code    = isset( $response_body->code ) ? $response_body->code : 'unknown_error';
			$message = isset( $response_body->message ) ? $response_body->message : __( 'An unknown error occurred.', 'jetpack' );

			return new WP_Error( $code, $message, array( 'status' => $response_status ) );
		}

		return $response_body;
	}
}
