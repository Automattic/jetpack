<?php
/**
 * Trait WPCOM_REST_API_Proxy_Request_Trait
 *
 * Used to proxy requests to wpcom servers.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Status\Visitor;

trait WPCOM_REST_API_Proxy_Request_Trait {

	/**
	 * Proxy request to wpcom servers on behalf of a user or using the Site-level Connection (blog token).
	 *
	 * @param WP_Rest_Request $request Request to proxy.
	 * @param string          $path Path to append to the rest base.
	 * @param string          $context Whether the request should be proxied on behalf of the current user or using the Site-level Connection, aka 'blog' token. Can be Either 'user' or 'blog'. Defaults to 'user'.
	 * @param bool            $allow_fallback_to_blog If the $context is 'user', whether we should fallback to using the Site-level Connection in case the current user is not connected.
	 *
	 * @return mixed|WP_Error           Response from wpcom servers or an error.
	 */
	public function proxy_request_to_wpcom( $request, $path = '', $context = 'user', $allow_fallback_to_blog = false ) {
		$blog_id      = \Jetpack_Options::get_option( 'id' );
		$path         = '/sites/' . rawurldecode( $blog_id ) . '/' . rawurldecode( ltrim( $this->rest_base, '/' ) ) . ( $path ? '/' . rawurldecode( ltrim( $path, '/' ) ) : '' );
		$query_params = $request->get_query_params();
		$manager      = new Manager();

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

		// If no body is present, passing it as $request->get_body() will cause an error.
		$body = $request->get_body() ? $request->get_body() : null;

		$response = new WP_Error(
			'rest_unauthorized',
			__( 'Please connect your user account to WordPress.com', 'jetpack' ),
			array( 'status' => rest_authorization_required_code() )
		);

		if ( 'user' === $context ) {
			if ( ! $manager->is_user_connected() ) {
				if ( false === $allow_fallback_to_blog ) {
					return $response;
				}

				$context = 'blog';
			} else {
				$response = Client::wpcom_json_api_request_as_user( $api_url, $this->version, $request_options, $body, $this->base_api_path );
			}
		}

		if ( 'blog' === $context ) {
			if ( ! $manager->is_connected() ) {
				return $response;
			}

			$response = Client::wpcom_json_api_request_as_blog( $api_url, $this->version, $request_options, $body, $this->base_api_path );
		}

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$response_status = wp_remote_retrieve_response_code( $response );
		$response_body   = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( $response_status >= 400 ) {
			$code    = isset( $response_body['code'] ) ? $response_body['code'] : 'unknown_error';
			$message = isset( $response_body['message'] ) ? $response_body['message'] : __( 'An unknown error occurred.', 'jetpack' );

			return new WP_Error( $code, $message, array( 'status' => $response_status ) );
		}

		return $response_body;
	}

	/**
	 * Proxy request to wpcom servers on behalf of a user.
	 *
	 * @param WP_Rest_Request $request Request to proxy.
	 * @param string          $path Path to append to the rest base.
	 *
	 * @return mixed|WP_Error           Response from wpcom servers or an error.
	 */
	public function proxy_request_to_wpcom_as_user( $request, $path = '' ) {
		return $this->proxy_request_to_wpcom( $request, $path, 'user' );
	}

	/**
	 * Proxy request to wpcom servers using the Site-level Connection (blog token).
	 *
	 * @param WP_Rest_Request $request Request to proxy.
	 * @param string          $path Path to append to the rest base.
	 *
	 * @return mixed|WP_Error           Response from wpcom servers or an error.
	 */
	public function proxy_request_to_wpcom_as_blog( $request, $path = '' ) {
		return $this->proxy_request_to_wpcom( $request, $path, 'blog' );
	}
}
