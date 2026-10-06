<?php
/**
 * The forward to WordPress.com behind the proxy trait.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Status\Visitor;
use WP_Error;

/**
 * Forwards a request to WordPress.com: resolves the token context, checks the connection, signs
 * and sends. It needs no route and no WP_REST_Request.
 *
 * @since $$next-version$$
 */
class Proxy_Request {

	/**
	 * Forward to a path under `/sites/<blog id>/`.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $site_path Path after `/sites/<blog id>/`.
	 * @param array  $args      See {@see to_path()}.
	 * @return array|WP_Error See {@see to_path()}. A site without a blog id gets the unauthorized error.
	 */
	public static function to_site( string $site_path, array $args = array() ) {
		$blog_id = (int) \Jetpack_Options::get_option( 'id' );
		if ( ! $blog_id ) {
			return self::unauthorized_error( $args );
		}

		return self::to_path( '/sites/' . $blog_id . '/' . ltrim( $site_path, '/' ), $args );
	}

	/**
	 * Forward to a WordPress.com path.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $path WordPress.com path, after the API base and version.
	 * @param array  $args {
	 *     Optional. How to forward.
	 *
	 *     @type string      $context                Sign as the current user ('user') or as the site ('blog'), or send unsigned ('none'). Default 'user'.
	 *     @type bool        $allow_fallback_to_blog Sign as the site when the current user is not connected. Default false.
	 *     @type string      $method                 HTTP method. Default 'GET'.
	 *     @type array       $query                  Query params. See {@see build_query()} for the ones that are not forwarded.
	 *     @type string|null $body                   Request body. Default null, which an empty string becomes too.
	 *     @type string      $version                WordPress.com API version. Default '2'.
	 *     @type string      $base_api_path          WordPress.com API base, 'wpcom' or 'rest'. Default 'wpcom'.
	 *     @type array       $request_options        Arguments for wp_remote_request(), merged over the defaults: the method, a JSON content type and, on a signed request, `X-Forwarded-For`.
	 *     @type array       $unauthorized_error     `code`, `message` and `status` of the error for a missing token. Default `rest_unauthorized`.
	 * }
	 * @return array|WP_Error `status` (int), `body` (string) and `headers` (lowercase names) as WordPress.com sent them,
	 *                        the unauthorized error when the token the context needs is missing, or `Client`'s own error.
	 */
	public static function to_path( string $path, array $args = array() ) {
		$context = $args['context'] ?? 'user';
		$manager = new Manager();

		if ( 'user' === $context && ! $manager->is_user_connected() ) {
			if ( empty( $args['allow_fallback_to_blog'] ) ) {
				return self::unauthorized_error( $args );
			}

			$context = 'blog';
		}

		if ( 'blog' === $context && ! $manager->is_connected() ) {
			return self::unauthorized_error( $args );
		}

		if ( ! in_array( $context, array( 'user', 'blog', 'none' ), true ) ) {
			return self::unauthorized_error( $args );
		}

		$query = self::build_query( (array) ( $args['query'] ?? array() ) );
		if ( '' !== $query ) {
			$path .= ( str_contains( $path, '?' ) ? '&' : '?' ) . $query;
		}

		return self::send( $path, $context, $args );
	}

	/**
	 * The typed presentation of a response: its decoded body, or a WP_Error for a status of 400 or more.
	 *
	 * @since $$next-version$$
	 *
	 * @param array|WP_Error $response What {@see to_path()} returned.
	 * @return mixed|WP_Error The decoded body, or an error with the upstream `code`, `message` and status.
	 */
	public static function decode( $response ) {
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$body = json_decode( $response['body'], true );

		if ( $response['status'] >= 400 ) {
			return new WP_Error(
				$body['code'] ?? 'unknown_error',
				$body['message'] ?? __( 'An unknown error occurred.', 'jetpack-connection' ),
				array( 'status' => $response['status'] )
			);
		}

		return $body;
	}

	/**
	 * Send the request the way the context asks and normalize the response.
	 *
	 * @param string $path    WordPress.com path, with its query string.
	 * @param string $context 'user', 'blog' or 'none', already resolved.
	 * @param array  $args    See {@see to_path()}.
	 * @return array|WP_Error
	 */
	private static function send( string $path, string $context, array $args ) {
		$version = (string) ( $args['version'] ?? '2' );
		$base    = (string) ( $args['base_api_path'] ?? 'wpcom' );
		$headers = array( 'Content-Type' => 'application/json' );

		// An empty body travels as null: `Client` hashes any string, and the signature rejects the hash of an empty one.
		$body = isset( $args['body'] ) && '' !== $args['body'] ? $args['body'] : null;

		if ( 'none' !== $context ) {
			$headers['X-Forwarded-For'] = ( new Visitor() )->get_ip( true );
		}

		$options = array_replace_recursive(
			array(
				'headers' => $headers,
				'method'  => strtoupper( (string) ( $args['method'] ?? 'GET' ) ),
			),
			(array) ( $args['request_options'] ?? array() )
		);

		if ( 'user' === $context ) {
			$response = Client::wpcom_json_api_request_as_user( $path, $version, $options, $body, $base );
		} elseif ( 'blog' === $context ) {
			$response = Client::wpcom_json_api_request_as_blog( $path, $version, $options, $body, $base );
		} else {
			$request = Client::validate_args_for_wpcom_json_api_request( $path, $version, $options, $base );
			$url     = $request['url'];
			unset( $request['url'] );
			$request['body'] = $body;

			$response = wp_remote_request( $url, $request );
		}

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$response_headers = array();
		foreach ( wp_remote_retrieve_headers( $response ) as $name => $value ) {
			$response_headers[ strtolower( $name ) ] = $value;
		}

		return array(
			'status'  => (int) wp_remote_retrieve_response_code( $response ),
			'body'    => (string) wp_remote_retrieve_body( $response ),
			'headers' => $response_headers,
		);
	}

	/**
	 * Query string for the params to forward, without `_method` and without unsafe keys.
	 *
	 * `Client` rebuilds the URL with add_query_arg(), which writes each key decoded: a key holding
	 * `%`, `&` or `=` would reach WordPress.com as another param, a method override included.
	 *
	 * @param array $query Query params.
	 * @return string
	 */
	private static function build_query( array $query ): string {
		unset( $query['_method'] );

		return http_build_query( self::with_safe_keys( $query ), '', '&' );
	}

	/**
	 * Drop, at every depth, the params whose key is not made of letters, digits, `_` and `-`.
	 *
	 * @param array $params Query params.
	 * @return array
	 */
	private static function with_safe_keys( array $params ): array {
		$safe = array();

		foreach ( $params as $key => $value ) {
			if ( ! preg_match( '/^[A-Za-z0-9_-]+$/', (string) $key ) ) {
				continue;
			}

			$safe[ $key ] = is_array( $value ) ? self::with_safe_keys( $value ) : $value;
		}

		return $safe;
	}

	/**
	 * The error for a missing token: the caller's `unauthorized_error` over the default.
	 *
	 * @param array $args See {@see to_path()}.
	 * @return WP_Error
	 */
	private static function unauthorized_error( array $args ): WP_Error {
		$error = (array) ( $args['unauthorized_error'] ?? array() );

		return new WP_Error(
			$error['code'] ?? 'rest_unauthorized',
			$error['message'] ?? __( 'Please connect your user account to WordPress.com', 'jetpack-connection' ),
			array( 'status' => $error['status'] ?? rest_authorization_required_code() )
		);
	}
}
