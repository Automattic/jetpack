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
	 * Compute the controller's transient cache key for a request.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return string
	 */
	private function cache_key( WP_REST_Request $request ): string {
		$accessor = function ( WP_REST_Request $req ) {
			// @phan-suppress-next-line PhanUndeclaredMethod -- rebound to the controller via Closure::call() below.
			return $this->get_cache_key( $req );
		};

		return $accessor->call( $this->controller, $request );
	}

	/**
	 * Invoke the controller's private cache_and_build_response().
	 *
	 * @param array  $http_response Raw HTTP response array.
	 * @param string $cache_key     Transient key.
	 *
	 * @return WP_REST_Response|\WP_Error
	 */
	private function cache_and_build_response( array $http_response, string $cache_key ) {
		$accessor = function ( array $resp, string $key ) {
			return $this->cache_and_build_response( $resp, $key );
		};

		return $accessor->call( $this->controller, $http_response, $cache_key );
	}
}
