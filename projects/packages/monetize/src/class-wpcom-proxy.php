<?php
/**
 * Local REST routes that forward the dashboard's WordPress.com API calls as the current user.
 *
 * @package automattic/jetpack-monetize
 */

namespace Automattic\Jetpack\Monetize;

use Automattic\Jetpack\Connection\Traits\WPCOM_REST_API_Proxy_Request;
use WP_REST_Request;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Registers `jetpack/v4/monetize/<api>/<path>` routes that each forward to the same `<api>/sites/<id>/<path>` on WordPress.com.
 *
 * The local path mirrors the upstream one, so the page's client only swaps the prefix: Simple sites call WordPress.com directly.
 *
 * @since $$next-version$$
 */
class WPCOM_Proxy {
	use WPCOM_REST_API_Proxy_Request;

	const REST_NAMESPACE = 'jetpack/v4';

	const REST_BASE = 'monetize';

	/**
	 * The WordPress.com APIs a route can forward to, with each one's base path and version.
	 *
	 * @var array<string, string[]>
	 */
	const APIS = array(
		'wpcom/v2'  => array( 'wpcom', 'v2' ),
		'rest/v1.1' => array( 'rest', '1.1' ),
	);

	/**
	 * Set up a proxy for one upstream path.
	 *
	 * @param string $api           A key of APIS.
	 * @param string $upstream_path Path under `/sites/<id>/`.
	 */
	private function __construct( $api, $upstream_path ) {
		list( $this->base_api_path, $this->version ) = self::APIS[ $api ];
		$this->rest_base                             = $upstream_path;
	}

	/**
	 * Register a route that forwards to the same path on WordPress.com.
	 *
	 * @param string       $api     A key of APIS.
	 * @param string       $path    Route pattern under `/sites/<id>/`, e.g. `memberships/product/(?P<id>\d+)`.
	 * @param string|array $methods HTTP methods the route accepts.
	 * @param array        $args    Route args: only these and `_locale` are forwarded, once validated and sanitized.
	 * @return bool Whether the route was registered.
	 */
	public static function register_route( $api, $path, $methods, array $args = array() ) {
		if ( ! isset( self::APIS[ $api ] ) ) {
			/* translators: %s is a WordPress.com API, such as wpcom/v2. */
			$message = sprintf( __( 'Unknown WordPress.com API "%s".', 'jetpack-monetize' ), $api );
			_doing_it_wrong( __METHOD__, esc_html( $message ), '$$next-version$$' );
			return false;
		}

		return register_rest_route(
			self::REST_NAMESPACE,
			'/' . self::REST_BASE . '/' . $api . '/' . $path,
			array(
				'methods'             => $methods,
				'callback'            => static function ( WP_REST_Request $request ) use ( $api ) {
					return self::forward( $api, $request );
				},
				'permission_callback' => array( Dashboard::class, 'can_manage' ),
				// apiFetch adds `_locale=user` to every request, so WordPress.com answers in the user's language.
				'args'                => $args + array(
					'_locale' => array(
						'type' => 'string',
						'enum' => array( 'user' ),
					),
				),
			)
		);
	}

	/**
	 * Forward a request to its upstream path as the current user.
	 *
	 * @param string          $api     A key of APIS.
	 * @param WP_REST_Request $request The request to one of this class's routes.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function forward( $api, WP_REST_Request $request ) {
		$prefix   = '/' . self::REST_NAMESPACE . '/' . self::REST_BASE . '/' . $api . '/';
		$upstream = substr( $request->get_route(), strlen( $prefix ) );

		return rest_ensure_response( ( new self( $api, $upstream ) )->proxy_request_to_wpcom_as_user( self::with_declared_args_only( $request ) ) );
	}

	/**
	 * A copy of the request that keeps only its route's declared args, with the values WordPress sanitized.
	 *
	 * The body goes out as JSON whatever its incoming encoding, since that is the only body the proxy sends.
	 *
	 * @param WP_REST_Request $request The request to one of this class's routes.
	 * @return WP_REST_Request
	 */
	private static function with_declared_args_only( WP_REST_Request $request ) {
		$declared  = $request->get_attributes()['args'] ?? array();
		$forwarded = new WP_REST_Request( $request->get_method(), $request->get_route() );
		$forwarded->set_query_params( array_intersect_key( $request->get_query_params(), $declared ) );

		$body = array_intersect_key( array_merge( $request->get_body_params(), (array) $request->get_json_params() ), $declared );

		// WordPress.com ignores a DELETE body when it checks the signature, so its body hash would fail the user token.
		if ( 'DELETE' === $request->get_method() ) {
			$forwarded->set_query_params( $forwarded->get_query_params() + $body );
			$body = array();
		}

		if ( $body ) {
			$forwarded->set_header( 'Content-Type', 'application/json' );
			$forwarded->set_body( (string) wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );
		}

		return $forwarded;
	}
}
