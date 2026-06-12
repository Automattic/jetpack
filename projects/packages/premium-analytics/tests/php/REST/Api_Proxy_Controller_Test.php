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

	public function test_registers_data_route_with_read_and_write_methods() {
		$route = $this->data_route_key();
		$this->assertNotSame( '', $route, 'The agnostic data route should be registered.' );

		$methods = rest_get_server()->get_routes()[ $route ][0]['methods'];
		$this->assertArrayHasKey( 'GET', $methods );
		$this->assertArrayHasKey( 'POST', $methods );
	}

	public function test_data_route_uses_data_callbacks() {
		$handler = rest_get_server()->get_routes()[ $this->data_route_key() ][0];

		$this->assertSame( array( $this->controller, 'handle_data_request' ), $handler['callback'] );
		$this->assertSame( array( $this->controller, 'check_data_permission' ), $handler['permission_callback'] );
	}

	public function test_data_route_validates_endpoint_and_version() {
		$args = rest_get_server()->get_routes()[ $this->data_route_key() ][0]['args'];

		$this->assertSame( array( $this->controller, 'validate_data_endpoint' ), $args['endpoint']['validate_callback'] );
		$this->assertSame( array( $this->controller, 'validate_version' ), $args['version']['validate_callback'] );
		$this->assertSame( '2', $args['version']['default'] );
	}

	public function test_data_route_only_matches_allowed_prefixes() {
		// The route regex enumerates the allowed prefixes — a non-allowed prefix is absent.
		$route = $this->data_route_key();
		$this->assertStringContainsString( 'stats', $route );
		$this->assertStringContainsString( 'commercial', $route );
		$this->assertStringNotContainsString( 'posts', $route );
		$this->assertStringNotContainsString( 'media', $route );
	}

	public function test_data_permission_dispatches_by_endpoint() {
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

		// view_stats reaches the stats data but not WordAds.
		$this->assertTrue( $this->controller->check_data_permission( $this->build_data_request( 'GET', 'stats/top-posts' ) ) );
		$this->assertFalse( $this->controller->check_data_permission( $this->build_data_request( 'GET', 'wordads/earnings' ) ) );
		// WordPress routes case-insensitively — a mixed-case WordAds path must still hit the WordAds gate.
		$this->assertFalse( $this->controller->check_data_permission( $this->build_data_request( 'GET', 'WordAds/earnings' ) ) );
	}

	public function test_stats_permission_granted_for_view_stats_capability() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'jpa_viewer2',
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
	 * @dataProvider data_data_paths
	 *
	 * @param string $endpoint The validated endpoint.
	 * @param string $expected The expected WPCOM path (with %d for the site id).
	 */
	#[DataProvider( 'data_data_paths' )]
	public function test_build_data_path( string $endpoint, string $expected ) {
		$accessor = function ( string $e ) {
			// @phan-suppress-next-line PhanUndeclaredMethod -- rebound to the controller via Closure::call() below.
			return $this->build_data_path( $e );
		};

		$site_id = (int) \Jetpack_Options::get_option( 'id' );
		$this->assertSame( sprintf( $expected, $site_id ), $accessor->call( $this->controller, $endpoint ) );
	}

	/**
	 * @return array<string, string[]>
	 */
	public static function data_data_paths(): array {
		return array(
			'stats resource' => array( 'stats/top-posts', '/sites/%d/stats/top-posts' ),
			'wordads'        => array( 'wordads/earnings', '/sites/%d/wordads/earnings' ),
			'utm commas'     => array( 'stats/utm/utm_campaign,utm_source', '/sites/%d/stats/utm/utm_campaign,utm_source' ),
			'purchases'      => array( 'upgrades', '/upgrades?site=%d' ),
		);
	}

	/**
	 * @dataProvider data_write_endpoints
	 *
	 * @param string $endpoint The endpoint to check.
	 * @param bool   $allowed  Whether a non-GET method is permitted.
	 */
	#[DataProvider( 'data_write_endpoints' )]
	public function test_is_write_allowed( string $endpoint, bool $allowed ) {
		$accessor = function ( string $e ) {
			// @phan-suppress-next-line PhanUndeclaredMethod -- rebound to the controller via Closure::call() below.
			return $this->is_write_allowed( $e );
		};

		$this->assertSame( $allowed, $accessor->call( $this->controller, $endpoint ) );
	}

	/**
	 * @return array<string, array{0: string, 1: bool}>
	 */
	public static function data_write_endpoints(): array {
		return array(
			'dashboard modules' => array( 'jetpack-stats-dashboard/modules', true ),
			'module settings'   => array( 'jetpack-stats-dashboard/module-settings', true ),
			'commercial class.' => array( 'commercial-classification', true ),
			'spam new'          => array( 'stats/referrers/spam/new', true ),
			'spam delete'       => array( 'stats/referrers/spam/delete', true ),
			'mixed case write'  => array( 'JETPACK-STATS-DASHBOARD/modules', true ),
			'stats read'        => array( 'stats/top-posts', false ),
			'subscribers read'  => array( 'subscribers/counts', false ),
			'usage read'        => array( 'jetpack-stats/usage', false ),
			'wordads read'      => array( 'wordads/earnings', false ),
		);
	}

	public function test_write_to_read_only_endpoint_returns_405() {
		$response = $this->controller->handle_data_request( $this->build_data_request( 'POST', 'stats/top-posts' ) );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'rest_read_only', $response->get_error_code() );
		$this->assertSame( 405, $response->get_error_data()['status'] );
	}

	public function test_put_to_write_endpoint_returns_405() {
		// Only POST may mutate — PUT/PATCH on a write-allowed endpoint is still rejected locally.
		$response = $this->controller->handle_data_request( $this->build_data_request( 'PUT', 'jetpack-stats-dashboard/modules' ) );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'rest_read_only', $response->get_error_code() );
		$this->assertSame( 405, $response->get_error_data()['status'] );
	}

	public function test_post_to_write_endpoint_passes_the_method_gate() {
		// A POST to a write-allowed endpoint clears the gate and reaches the connection check.
		$response = $this->controller->handle_data_request( $this->build_data_request( 'POST', 'jetpack-stats-dashboard/modules' ) );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'no_connection', $response->get_error_code() );
	}

	public function test_forwarded_params_drop_caller_supplied_site() {
		// `site` is the proxy's own path-scoping param for `upgrades`; a caller must not set it.
		$request  = $this->build_data_request(
			'GET',
			'upgrades',
			array(
				'site'   => '999',
				'period' => 'year',
			)
		);
		$accessor = function ( WP_REST_Request $req ) {
			// @phan-suppress-next-line PhanUndeclaredMethod -- rebound to the controller via Closure::call() below.
			return $this->get_forwarded_params( $req );
		};

		$forwarded = $accessor->call( $this->controller, $request );
		$this->assertArrayNotHasKey( 'site', $forwarded );
		$this->assertArrayHasKey( 'period', $forwarded );
	}

	public function test_validate_data_endpoint_accepts_commas_and_rejects_traversal() {
		$this->assertTrue( $this->controller->validate_data_endpoint( 'stats/utm/utm_campaign,utm_source,utm_medium' ) );
		$this->assertTrue( $this->controller->validate_data_endpoint( 'stats/opens/emails/123/rate' ) );
		$this->assertFalse( $this->controller->validate_data_endpoint( 'stats/../../purchases' ) );
		$this->assertFalse( $this->controller->validate_data_endpoint( 'stats/a:b' ) );
	}

	/**
	 * @dataProvider data_versions
	 *
	 * @param string $version A version string.
	 * @param bool   $valid   Whether it should validate.
	 */
	#[DataProvider( 'data_versions' )]
	public function test_validate_version( string $version, bool $valid ) {
		$this->assertSame( $valid, $this->controller->validate_version( $version ) );
	}

	/**
	 * @return array<string, array{0: string, 1: bool}>
	 */
	public static function data_versions(): array {
		return array(
			'v2'        => array( '2', true ),
			'v1.1'      => array( '1.1', true ),
			'v1.2'      => array( '1.2', true ),
			'word'      => array( 'latest', false ),
			'injection' => array( '2;DROP', false ),
			'empty'     => array( '', false ),
		);
	}

	public function test_data_cache_key_varies_by_version() {
		$accessor = function ( string $path, string $version ) {
			// @phan-suppress-next-line PhanUndeclaredMethod -- rebound to the controller via Closure::call() below.
			return $this->cache_key_for( $path, $version, '2' === $version ? 'wpcom' : 'rest', array() );
		};

		$v2  = $accessor->call( $this->controller, '/sites/0/stats/top-posts', '2' );
		$v11 = $accessor->call( $this->controller, '/sites/0/stats/top-posts', '1.1' );
		$this->assertNotSame( $v2, $v11 );
	}

	/**
	 * Build an analytics proxy request with the endpoint capture and forwarded query params set.
	 *
	 * @param string $endpoint The analytics endpoint to proxy.
	 * @param array  $params   Forwarded query params.
	 *
	 * @return WP_REST_Request
	 */
	private function build_request( string $endpoint, array $params = array() ): WP_REST_Request {
		$request = new WP_REST_Request( 'GET', '/jetpack-premium-analytics/v1/proxy/' . $endpoint );
		// The capture is a route (URL) param in production, not a query param.
		$request->set_url_params( array( 'endpoint' => $endpoint ) );
		$request->set_query_params( $params );

		return $request;
	}

	/**
	 * Build a data proxy request with the endpoint capture set.
	 *
	 * @param string      $method   HTTP method.
	 * @param string      $endpoint The data endpoint to proxy.
	 * @param array       $params   Forwarded query params.
	 * @param string|null $version  WPCOM API version param, if any.
	 *
	 * @return WP_REST_Request
	 */
	private function build_data_request( string $method, string $endpoint, array $params = array(), ?string $version = null ): WP_REST_Request {
		$request = new WP_REST_Request( $method, '/jetpack-premium-analytics/v1/' . $endpoint );
		// The capture is a route (URL) param; `version` arrives as a query param.
		$request->set_url_params( array( 'endpoint' => $endpoint ) );
		if ( null !== $version ) {
			$params['version'] = $version;
		}
		$request->set_query_params( $params );

		return $request;
	}

	/**
	 * The registered route key of the agnostic data proxy.
	 *
	 * @return string
	 */
	private function data_route_key(): string {
		foreach ( array_keys( rest_get_server()->get_routes() ) as $key ) {
			if ( str_contains( $key, '(?P<endpoint>' ) && str_contains( $key, 'commercial' ) ) {
				return $key;
			}
		}

		return '';
	}

	/**
	 * Compute the controller's transient cache key for an analytics request (v2 / wpcom).
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
			return $this->cache_key_for( $wpcom_path, '2', 'wpcom', $this->get_forwarded_params( $req ) );
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
