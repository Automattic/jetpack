<?php
/**
 * Base REST controller for endpoints that read directly from the WordPress.com public API.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\REST;

use Automattic\Jetpack\Constants;
use WP_Error;
use WP_REST_Controller;

/**
 * Shared plumbing for dashboard endpoints that fetch from `public-api.wordpress.com` over an
 * unauthenticated `wp_remote_get`, rather than the blog-token proxy ({@see Api_Proxy_Controller}).
 *
 * These endpoints exist because their WPCOM counterparts behave differently per API version
 * (e.g. `force=wpcom`) and don't fit the agnostic proxy's `/sites/<id>/<path>` shape. Subclasses
 * register their own route and call {@see request_public_api()} with the target path, version, and
 * request params.
 */
abstract class Public_Api_Controller extends WP_REST_Controller {

	/**
	 * Timeout for the outbound public-api request, in seconds.
	 *
	 * @var int
	 */
	private const API_TIMEOUT = 5;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'jetpack-premium-analytics/v1';
	}

	/**
	 * Stats access: an administrator or any user who can view stats.
	 *
	 * @return bool
	 */
	public function check_permission(): bool {
		return current_user_can( 'manage_options' ) || current_user_can( 'view_stats' );
	}

	/**
	 * Fetch a path from the WordPress.com public API and normalize the result.
	 *
	 * Mirrors `stats-admin`: transport errors pass through as-is, a non-200 becomes a `WP_Error`
	 * carrying the remote status and message, and a 200 returns the decoded body.
	 *
	 * @param string               $path          WPCOM path under the version base (e.g. `sites/123/posts`).
	 * @param string               $version       WPCOM API version (e.g. `1.1`, `1.2`).
	 * @param array<string, mixed> $params        Request params to forward as the query string.
	 * @param string[]             $keys_to_unset Param keys to drop before building the query.
	 *
	 * @return mixed|WP_Error Decoded response body, or a WP_Error on transport/remote failure.
	 */
	protected function request_public_api( string $path, string $version, array $params, array $keys_to_unset = array() ) {
		$url = sprintf(
			'%s/rest/v%s/%s?%s',
			Constants::get_constant( 'JETPACK__WPCOM_JSON_API_BASE' ),
			$version,
			$path,
			$this->build_query( $params, $keys_to_unset )
		);

		$response = wp_remote_get( $url, array( 'timeout' => self::API_TIMEOUT ) );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$code = wp_remote_retrieve_response_code( $response );
		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( 200 !== $code ) {
			return new WP_Error(
				isset( $body['error'] ) ? 'remote-error-' . $body['error'] : 'remote-error',
				$body['message'] ?? 'unknown remote error',
				array( 'status' => $code )
			);
		}

		return $body;
	}

	/**
	 * Build a query string from request params, dropping WordPress routing noise and the given keys.
	 *
	 * @param array<string, mixed> $params        Request params.
	 * @param string[]             $keys_to_unset Param keys to drop (e.g. route-only params).
	 *
	 * @return string
	 */
	private function build_query( array $params, array $keys_to_unset = array() ): string {
		unset( $params['rest_route'] );
		foreach ( $keys_to_unset as $key ) {
			unset( $params[ $key ] );
		}

		return http_build_query( $params );
	}
}
