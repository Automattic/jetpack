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
	 * Transient prefix for cached reads, unique to the consumer. Reads are not cached while it is empty.
	 *
	 * Set it in the constructor: PHP refuses a class that redeclares a trait property with another default.
	 *
	 * @since $$next-version$$
	 *
	 * @var string
	 */
	protected $cache_prefix = '';

	/**
	 * Seconds a GET answered with a status below 400 stays cached.
	 *
	 * @since $$next-version$$
	 *
	 * @var int
	 */
	protected $cache_duration_success = 0;

	/**
	 * Seconds a GET answered with a status of 400 or more stays cached.
	 *
	 * @since $$next-version$$
	 *
	 * @var int
	 */
	protected $cache_duration_error = 0;

	/**
	 * Proxy request to wpcom servers on behalf of a user or using the Site-level Connection (blog token).
	 *
	 * @param WP_REST_Request $request Request to proxy.
	 * @param string          $path Path to append to the rest base.
	 * @param string          $context Whether the request should be proxied on behalf of the current user or using the Site-level Connection, aka 'blog' token. Can be Either 'user' or 'blog'. Defaults to 'user'.
	 * @param bool            $allow_fallback_to_blog If the $context is 'user', whether we should fallback to using the Site-level Connection in case the current user is not connected.
	 * @param array           $request_options Request options to pass to wp_remote_request. A `cache` entry overrides the cache properties
	 *                                         for this call (`prefix`, `success`, `error`, `bypass`), and `false` turns the cache off.
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

		$cache = $this->cache_args( $request_options['cache'] ?? array() );
		unset( $request_options['cache'] );

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
				'cache'                  => $cache,
			)
		);

		return Proxy_Request::decode( $response );
	}

	/**
	 * The cache properties as the `cache` argument of Proxy_Request, with a call's overrides on top.
	 *
	 * @param array|false $overrides The `cache` entry of the call's request options.
	 * @return array An empty array turns the cache off.
	 */
	private function cache_args( $overrides ) {
		if ( false === $overrides ) {
			return array();
		}

		return array_merge(
			array(
				'prefix'  => $this->cache_prefix,
				'success' => $this->cache_duration_success,
				'error'   => $this->cache_duration_error,
			),
			(array) $overrides
		);
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
