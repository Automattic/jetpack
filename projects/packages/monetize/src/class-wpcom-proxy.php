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
	 * @param array        $args    Route args, to validate what is forwarded.
	 * @return bool Whether the route was registered.
	 */
	public static function register_route( $api, $path, $methods, array $args = array() ) {
		if ( ! isset( self::APIS[ $api ] ) ) {
			_doing_it_wrong( __METHOD__, esc_html( sprintf( 'Unknown WordPress.com API "%s".', $api ) ), '$$next-version$$' );
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
				'args'                => $args,
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

		return rest_ensure_response( ( new self( $api, $upstream ) )->proxy_request_to_wpcom_as_user( $request ) );
	}
}
