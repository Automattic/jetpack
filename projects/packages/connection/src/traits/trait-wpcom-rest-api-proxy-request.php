<?php
/**
 * Trait WPCOM_REST_API_Proxy_Request
 *
 * Used to proxy requests to wpcom servers.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection\Traits;

use Automattic\Jetpack\Connection\Proxy_Request;
use WP_Error;
use WP_REST_Request;

trait WPCOM_REST_API_Proxy_Request {

	/**
	 * Base path for the API.
	 *
	 * @var string
	 */
	protected $base_api_path;

	/**
	 * Version of the API.
	 *
	 * @var string
	 */
	protected $version;

	/**
	 * The base of the controller's route.
	 *
	 * @var string
	 */
	protected $rest_base;

	/**
	 * Proxy request to wpcom servers on behalf of a user or using the Site-level Connection (blog token).
	 *
	 * @param WP_REST_Request $request Request to proxy.
	 * @param string          $path Path to append to the rest base.
	 * @param string          $context Whether the request should be proxied on behalf of the current user or using the Site-level Connection, aka 'blog' token. Can be Either 'user' or 'blog'. Defaults to 'user'.
	 * @param bool            $allow_fallback_to_blog If the $context is 'user', whether we should fallback to using the Site-level Connection in case the current user is not connected.
	 * @param array           $request_options Request options to pass to wp_remote_request.
	 *
	 * @return mixed|WP_Error           Response from wpcom servers or an error.
	 */
	public function proxy_request_to_wpcom( $request, $path = '', $context = 'user', $allow_fallback_to_blog = false, $request_options = array() ) {
		$site_path    = rawurldecode( ltrim( $this->rest_base, '/' ) ) . ( $path ? '/' . rawurldecode( ltrim( $path, '/' ) ) : '' );
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

		$response = Proxy_Request::to_site(
			$site_path,
			array(
				'context'                => $context,
				'allow_fallback_to_blog' => false !== $allow_fallback_to_blog,
				'method'                 => $request->get_method(),
				'query'                  => $query_params,
				'body'                   => $request->get_body(),
				'version'                => $this->version,
				'base_api_path'          => $this->base_api_path,
				'request_options'        => $request_options,
			)
		);

		return Proxy_Request::decode( $response );
	}

	/**
	 * Proxy request to wpcom servers on behalf of a user.
	 *
	 * @param WP_REST_Request $request Request to proxy.
	 * @param string          $path Path to append to the rest base.
	 * @param array           $request_options Request options to pass to wp_remote_request.
	 *
	 * @return mixed|WP_Error           Response from wpcom servers or an error.
	 */
	public function proxy_request_to_wpcom_as_user( $request, $path = '', $request_options = array() ) {
		return $this->proxy_request_to_wpcom( $request, $path, 'user', false, $request_options );
	}

	/**
	 * Proxy request to wpcom servers using the Site-level Connection (blog token).
	 *
	 * @param WP_REST_Request $request Request to proxy.
	 * @param string          $path Path to append to the rest base.
	 * @param array           $request_options Request options to pass to wp_remote_request.
	 *
	 * @return mixed|WP_Error           Response from wpcom servers or an error.
	 */
	public function proxy_request_to_wpcom_as_blog( $request, $path = '', $request_options = array() ) {
		return $this->proxy_request_to_wpcom( $request, $path, 'blog', false, $request_options );
	}
}
