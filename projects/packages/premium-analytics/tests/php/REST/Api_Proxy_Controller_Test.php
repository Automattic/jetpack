<?php
/**
 * Tests for Api_Proxy_Controller.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\REST;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\REST\Api_Proxy_Controller
 */
#[CoversClass( Api_Proxy_Controller::class )]
class Api_Proxy_Controller_Test extends BaseTestCase {

	private const ROUTE = '/jetpack-premium-analytics/v1/proxy/(?P<endpoint>.*)';

	/**
	 * Controller under test.
	 *
	 * @var Api_Proxy_Controller
	 */
	private $controller;

	/**
	 * Set up the controller and a fresh REST server.
	 */
	public function set_up() {
		parent::set_up();
		$this->controller = new Api_Proxy_Controller();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		add_action( 'rest_api_init', array( $this->controller, 'register_routes' ) );
		do_action( 'rest_api_init' );
	}

	public function test_registers_proxy_route_under_package_namespace() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( self::ROUTE, $routes );
	}

	public function test_route_uses_the_controllers_permission_callback() {
		$route = rest_get_server()->get_routes()[ self::ROUTE ][0];
		$this->assertSame( array( $this->controller, 'check_permission' ), $route['permission_callback'] );
	}

	public function test_permission_denied_without_manage_options() {
		wp_set_current_user( 0 );
		$this->assertFalse( $this->controller->check_permission() );
	}

	public function test_permission_granted_for_administrator() {
		$admin_id = wp_insert_user(
			array(
				'user_login' => 'jpa_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $admin_id );
		$this->assertTrue( $this->controller->check_permission() );
	}

	public function test_returns_403_error_when_not_connected() {
		$response = $this->controller->handle_proxy_request( $this->build_request( 'reports/totals' ) );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'no_connection', $response->get_error_code() );
		$this->assertSame( 403, $response->get_error_data()['status'] );
	}

	public function test_cache_hit_serves_stored_payload_without_a_connection() {
		$request = $this->build_request( 'reports/totals', array( 'period' => 'week' ) );
		$payload = array(
			'data'    => (object) array( 'orders' => 42 ),
			'status'  => 200,
			'headers' => array( 'x-wp-total' => '42' ),
		);
		set_transient( $this->cache_key( $request ), $payload, MINUTE_IN_SECONDS );

		$response = $this->controller->handle_proxy_request( $request );

		$this->assertInstanceOf( WP_REST_Response::class, $response );
		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 42, $response->get_data()->orders );
		$this->assertSame( '42', $response->get_headers()['x-wp-total'] );
	}

	public function test_cache_key_ignores_query_param_order_but_not_values() {
		$a = $this->build_request(
			'reports/totals',
			array(
				'period' => 'week',
				'fields' => 'orders',
			)
		);
		$b = $this->build_request(
			'reports/totals',
			array(
				'fields' => 'orders',
				'period' => 'week',
			)
		);
		$c = $this->build_request( 'reports/totals', array( 'period' => 'month' ) );

		$this->assertSame( $this->cache_key( $a ), $this->cache_key( $b ) );
		$this->assertNotSame( $this->cache_key( $a ), $this->cache_key( $c ) );
	}

	public function test_cache_key_ignores_wordpress_routing_params() {
		$bare    = $this->build_request( 'reports/totals', array( 'period' => 'week' ) );
		$routing = $this->build_request(
			'reports/totals',
			array(
				'period'     => 'week',
				'rest_route' => '/jetpack-premium-analytics/v1/proxy/reports/totals',
				'_locale'    => 'user',
			)
		);

		$this->assertSame( $this->cache_key( $bare ), $this->cache_key( $routing ) );
	}

	public function test_validate_endpoint_accepts_a_relative_sub_path() {
		$this->assertTrue( $this->controller->validate_endpoint( 'reports/totals' ) );
	}

	/**
	 * @dataProvider data_invalid_endpoints
	 *
	 * @param string $endpoint An endpoint that must be rejected.
	 */
	#[DataProvider( 'data_invalid_endpoints' )]
	public function test_validate_endpoint_rejects_traversal_and_scheme( string $endpoint ) {
		$this->assertFalse( $this->controller->validate_endpoint( $endpoint ) );
	}

	/**
	 * Endpoints that would escape the `/analytics/` prefix.
	 *
	 * @return array<string, string[]>
	 */
	public static function data_invalid_endpoints(): array {
		return array(
			'parent traversal' => array( '../../sites/1/posts' ),
			'absolute path'    => array( '/sites/1/posts' ),
			'scheme injection' => array( 'http://evil.test/' ),
			'disallowed char'  => array( 'reports totals' ),
			'empty'            => array( '' ),
		);
	}

	public function test_undecodable_200_body_returns_502_and_is_not_cached() {
		$request  = $this->build_request( 'reports/totals' );
		$response = $this->cache_and_build_response(
			array(
				'response' => array( 'code' => 200 ),
				'body'     => '<html>not json</html>',
				'headers'  => array(),
			),
			$this->cache_key( $request )
		);

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'api_error', $response->get_error_code() );
		$this->assertSame( 502, $response->get_error_data()['status'] );
		$this->assertFalse( get_transient( $this->cache_key( $request ) ) );
	}

	/**
	 * The Stats routes that should be registered under the package namespace.
	 *
	 * @return array<string, array{0: string, 1: string[]}>
	 */
	public static function data_stats_routes(): array {
		$ns = '/jetpack-premium-analytics/v1/';

		return array(
			'site stats'         => array( $ns . 'stats', array( 'GET' ) ),
			'stats resource'     => array( $ns . 'stats/(?P<subpath>.+)', array( 'GET', 'POST' ) ),
			'subscribers counts' => array( $ns . 'subscribers/counts', array( 'GET' ) ),
			'never published'    => array( $ns . 'site-has-never-published-post', array( 'GET' ) ),
			'plan usage'         => array( $ns . 'jetpack-stats/usage', array( 'GET' ) ),
			'dashboard modules'  => array( $ns . 'jetpack-stats-dashboard/modules', array( 'GET', 'POST' ) ),
			'module settings'    => array( $ns . 'jetpack-stats-dashboard/module-settings', array( 'GET', 'POST' ) ),
			'commercial class.'  => array( $ns . 'commercial-classification', array( 'POST' ) ),
			'wordads'            => array( $ns . 'wordads/(?P<subpath>earnings|stats)', array( 'GET' ) ),
			'purchases'          => array( $ns . 'purchases', array( 'GET' ) ),
		);
	}

	/**
	 * @dataProvider data_stats_routes
	 *
	 * @param string   $route            The expected route pattern.
	 * @param string[] $expected_methods The HTTP methods the route must accept.
	 */
	#[DataProvider( 'data_stats_routes' )]
	public function test_registers_stats_route( string $route, array $expected_methods ) {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( $route, $routes );

		$methods = $routes[ $route ][0]['methods'];
		foreach ( $expected_methods as $method ) {
			$this->assertArrayHasKey( $method, $methods );
		}
	}

	public function test_stats_routes_use_the_stats_permission_callback() {
		$route = rest_get_server()->get_routes()['/jetpack-premium-analytics/v1/stats'][0];
		$this->assertSame( array( $this->controller, 'check_stats_permission' ), $route['permission_callback'] );
	}

	public function test_wordads_route_uses_the_wordads_permission_callback() {
		$route = rest_get_server()->get_routes()['/jetpack-premium-analytics/v1/wordads/(?P<subpath>earnings|stats)'][0];
		$this->assertSame( array( $this->controller, 'check_wordads_permission' ), $route['permission_callback'] );
	}

	public function test_stats_permission_granted_for_view_stats_capability() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'jpa_viewer',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);
		$user    = new \WP_User( $user_id );
		$user->add_cap( 'view_stats' );
		wp_set_current_user( $user_id );

		$this->assertTrue( $this->controller->check_stats_permission() );
		$this->assertFalse( $this->controller->check_wordads_permission() );
	}

	public function test_permissions_denied_for_anonymous_user() {
		wp_set_current_user( 0 );
		$this->assertFalse( $this->controller->check_stats_permission() );
		$this->assertFalse( $this->controller->check_wordads_permission() );
	}

	/**
	 * @dataProvider data_stats_paths
	 *
	 * @param array<string, mixed> $route    The route description to resolve.
	 * @param string               $subpath  The matched `subpath` capture, if any.
	 * @param string               $expected The expected WPCOM path.
	 */
	#[DataProvider( 'data_stats_paths' )]
	public function test_build_stats_path( array $route, string $subpath, string $expected ) {
		$request = new WP_REST_Request( 'GET', '/' );
		if ( '' !== $subpath ) {
			$request->set_param( 'subpath', $subpath );
		}

		$accessor = function ( WP_REST_Request $req, array $r ) {
			// @phan-suppress-next-line PhanUndeclaredMethod -- rebound to the controller via Closure::call() below.
			return $this->build_stats_path( $req, $r );
		};

		$site_id  = (int) \Jetpack_Options::get_option( 'id' );
		$resolved = $accessor->call( $this->controller, $request, $route );

		$this->assertSame( sprintf( $expected, $site_id ), $resolved );
	}

	/**
	 * @return array<string, array{0: array<string, mixed>, 1: string, 2: string}>
	 */
	public static function data_stats_paths(): array {
		return array(
			'wildcard subpath' => array( array( 'wpcom' => 'stats/%s' ), 'top-posts', '/sites/%d/stats/top-posts' ),
			'wordads subpath'  => array( array( 'wpcom' => 'wordads/%s' ), 'earnings', '/sites/%d/wordads/earnings' ),
			'static path'      => array( array( 'wpcom' => 'subscribers/counts' ), '', '/sites/%d/subscribers/counts' ),
			'build override'   => array(
				array(
					'build' => static function ( int $id ): string {
						return sprintf( '/upgrades?site=%d', $id );
					},
				),
				'',
				'/upgrades?site=%d',
			),
		);
	}

	public function test_response_with_null_cache_key_is_not_cached() {
		$response = $this->cache_and_build_response(
			array(
				'response' => array( 'code' => 200 ),
				'body'     => wp_json_encode( array( 'ok' => true ), JSON_UNESCAPED_SLASHES ),
				'headers'  => array(),
			),
			null
		);

		$this->assertInstanceOf( WP_REST_Response::class, $response );
		$this->assertSame( 200, $response->get_status() );
	}

	public function test_stats_wildcard_route_validates_subpath() {
		$route = rest_get_server()->get_routes()['/jetpack-premium-analytics/v1/stats/(?P<subpath>.+)'][0];
		$this->assertSame(
			array( $this->controller, 'validate_subpath' ),
			$route['args']['subpath']['validate_callback']
		);
	}

	public function test_validate_subpath_accepts_real_stats_subpaths() {
		$this->assertTrue( $this->controller->validate_subpath( 'top-posts' ) );
		$this->assertTrue( $this->controller->validate_subpath( 'post/123' ) );
		$this->assertTrue( $this->controller->validate_subpath( 'opens/emails/123/rate' ) );
		// UTM params arrive comma-separated — must be allowed.
		$this->assertTrue( $this->controller->validate_subpath( 'utm/utm_campaign,utm_source,utm_medium' ) );
	}

	/**
	 * @dataProvider data_invalid_subpaths
	 *
	 * @param string $subpath A subpath that must be rejected.
	 */
	#[DataProvider( 'data_invalid_subpaths' )]
	public function test_validate_subpath_rejects_traversal_and_absolute( string $subpath ) {
		$this->assertFalse( $this->controller->validate_subpath( $subpath ) );
	}

	/**
	 * @return array<string, string[]>
	 */
	public static function data_invalid_subpaths(): array {
		return array(
			'parent traversal' => array( '../../purchases' ),
			'absolute path'    => array( '/sites/1/purchases' ),
			'scheme injection' => array( 'http://evil.test/' ),
			'empty'            => array( '' ),
		);
	}

	/**
	 * Build a proxy request with the endpoint capture and forwarded query params set.
	 *
	 * @param string $endpoint The analytics endpoint to proxy.
	 * @param array  $params   Forwarded query params.
	 *
	 * @return WP_REST_Request
	 */
	private function build_request( string $endpoint, array $params = array() ): WP_REST_Request {
		$request = new WP_REST_Request( 'GET', '/jetpack-premium-analytics/v1/proxy/' . $endpoint );
		$request->set_param( 'endpoint', $endpoint );
		$request->set_query_params( $params );

		return $request;
	}

	/**
	 * Compute the controller's transient cache key for an analytics request.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return string
	 */
	private function cache_key( WP_REST_Request $request ): string {
		$path = sprintf(
			'/sites/%d/analytics/%s',
			(int) \Jetpack_Options::get_option( 'id' ),
			(string) $request->get_param( 'endpoint' )
		);

		$accessor = function ( WP_REST_Request $req, string $wpcom_path ) {
			// @phan-suppress-next-line PhanUndeclaredMethod -- rebound to the controller via Closure::call() below.
			return $this->get_cache_key( $req, $wpcom_path );
		};

		return $accessor->call( $this->controller, $request, $path );
	}

	/**
	 * Invoke the controller's private cache_and_build_response().
	 *
	 * @param array       $http_response Raw HTTP response array.
	 * @param string|null $cache_key     Transient key, or null to skip caching.
	 *
	 * @return WP_REST_Response|\WP_Error
	 */
	private function cache_and_build_response( array $http_response, ?string $cache_key ) {
		$accessor = function ( array $resp, ?string $key ) {
			return $this->cache_and_build_response( $resp, $key );
		};

		return $accessor->call( $this->controller, $http_response, $cache_key );
	}
}
