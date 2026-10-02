<?php
/**
 * Tests for the Ads configuration of the shared WordPress.com proxy.
 *
 * @package automattic/jetpack-ads
 */

namespace Automattic\Jetpack\WordAds;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_REST_Request;
use WP_REST_Server;

/**
 * The mechanics are tested in the `jetpack-wpcom-proxy` package; these tests cover what Ads
 * declares: the route, the allowlist, the capability and the cache prefix.
 *
 * @covers \Automattic\Jetpack\WordAds\Api_Proxy_Controller
 */
#[CoversClass( Api_Proxy_Controller::class )]
class Api_Proxy_Controller_Test extends BaseTestCase {

	/**
	 * URLs of the outbound requests seen by the HTTP stub.
	 *
	 * @var string[]
	 */
	private $http_urls = array();

	/**
	 * Set up a REST server, a connected site and an HTTP stub.
	 */
	public function set_up() {
		parent::set_up();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();

		wp_set_current_user( $this->create_user( 'administrator' ) );

		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		\Jetpack_Options::update_option( 'id', 4242 );
		\Jetpack_Options::update_option( 'blog_token', 'blog_token.secret' );
		( new Connection_Manager() )->reset_connection_status();

		$this->http_urls = array();
		add_filter( 'pre_http_request', array( $this, 'stub_http_request' ), 10, 3 );

		Api_Proxy_Controller::init();
		do_action( 'rest_api_init' );
	}

	/**
	 * Clean up after tests.
	 */
	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'stub_http_request' ), 10 );
		remove_all_filters( 'jetpack_stats_transient_cleanup_prefixes' );

		\Jetpack_Options::delete_option( 'blog_token' );
		\Jetpack_Options::delete_option( 'id' );
		( new Connection_Manager() )->reset_connection_status();
		Constants::clear_single_constant( 'JETPACK__WPCOM_JSON_API_BASE' );

		global $wp_rest_server;
		$wp_rest_server = null;

		wp_set_current_user( 0 );

		parent::tear_down();
	}

	/**
	 * Records the outbound request URL and answers with an empty report.
	 *
	 * @param mixed  $pre  Short-circuit value.
	 * @param array  $args Request args.
	 * @param string $url  Request URL.
	 * @return array
	 */
	public function stub_http_request( $pre, $args, $url ) {
		$this->http_urls[] = $url;

		return array(
			'response' => array( 'code' => 200 ),
			'body'     => '{"earnings":{}}',
			'headers'  => array(),
		);
	}

	/**
	 * Creates a user with a role and, optionally, an extra capability.
	 *
	 * @param string      $role       User role.
	 * @param string|null $capability Capability to grant on top of the role.
	 * @return int The user ID.
	 */
	private function create_user( $role, $capability = null ) {
		static $count = 0;

		$user_id = wp_insert_user(
			array(
				'user_login' => 'proxy_user_' . ( ++$count ),
				'user_pass'  => 'password',
				'role'       => $role,
			)
		);

		if ( null !== $capability ) {
			( new \WP_User( $user_id ) )->add_cap( $capability );
		}

		return $user_id;
	}

	/**
	 * Dispatches a request to the proxy.
	 *
	 * @param string $endpoint Endpoint, relative to the site.
	 * @param array  $params   Query params.
	 * @param string $method   HTTP method.
	 * @return \WP_REST_Response
	 */
	private function dispatch( $endpoint, array $params = array(), $method = 'GET' ) {
		$request = new WP_REST_Request( $method, '/jetpack/v4/wordads/proxy/v1.1/' . $endpoint );
		$request->set_query_params( $params );

		return rest_get_server()->dispatch( $request );
	}

	public function test_route_is_registered_under_the_wordads_namespace() {
		$routes = preg_grep( '#^/jetpack/v4/wordads/proxy/v#', array_keys( rest_get_server()->get_routes() ) );

		$this->assertCount( 1, $routes );
	}

	/**
	 * @dataProvider data_endpoints
	 *
	 * @param string $endpoint Endpoint, relative to the site.
	 * @param int    $status   Expected response status.
	 */
	#[DataProvider( 'data_endpoints' )]
	public function test_table_exposes_the_earnings_and_stats_reports_only( string $endpoint, int $status ) {
		$this->assertSame( $status, $this->dispatch( $endpoint )->get_status() );
	}

	/**
	 * @return array<string, array{0: string, 1: int}>
	 */
	public static function data_endpoints(): array {
		return array(
			'earnings'          => array( 'wordads/earnings', 200 ),
			'stats'             => array( 'wordads/stats', 200 ),
			'settings'          => array( 'wordads/settings', 404 ),
			'status'            => array( 'wordads/status', 404 ),
			'prefix alone'      => array( 'wordads', 404 ),
			'earnings sub-path' => array( 'wordads/earnings/extra', 404 ),
			'another resource'  => array( 'stats/top-posts', 404 ),
		);
	}

	public function test_table_declares_no_write() {
		$response = $this->dispatch( 'wordads/earnings', array(), 'POST' );

		$this->assertSame( 405, $response->get_status() );
		$this->assertSame( array(), $this->http_urls );
	}

	public function test_forwards_to_the_connected_site() {
		$this->dispatch( 'wordads/earnings' );
		$this->dispatch(
			'wordads/stats',
			array(
				'unit'     => 'day',
				'quantity' => 7,
			)
		);

		$this->assertCount( 2, $this->http_urls );
		$this->assertStringStartsWith( 'https://public-api.wordpress.com/rest/v1.1/sites/4242/wordads/earnings', $this->http_urls[0] );
		$this->assertStringStartsWith( 'https://public-api.wordpress.com/rest/v1.1/sites/4242/wordads/stats?unit=day&quantity=7', $this->http_urls[1] );
	}

	public function test_repeated_read_is_served_from_the_cache() {
		$this->dispatch( 'wordads/earnings' );
		$this->assertCount( 1, $this->http_urls );

		$this->dispatch( 'wordads/earnings' );
		$this->assertCount( 1, $this->http_urls );
	}

	public function test_only_administrators_read_the_reports() {
		wp_set_current_user( $this->create_user( 'editor', 'view_stats' ) );
		$this->assertSame( 403, $this->dispatch( 'wordads/earnings' )->get_status() );

		wp_set_current_user( 0 );
		$this->assertSame( 401, $this->dispatch( 'wordads/earnings' )->get_status() );

		$this->assertSame( array(), $this->http_urls );
	}

	public function test_cache_prefix_joins_the_transient_cleanup() {
		$this->assertContains( Api_Proxy_Controller::CACHE_PREFIX, apply_filters( 'jetpack_stats_transient_cleanup_prefixes', array() ) );

		$this->assertSame(
			array( 'other_prefix_', Api_Proxy_Controller::CACHE_PREFIX ),
			Api_Proxy_Controller::register_transient_cleanup_prefix( array( 'other_prefix_' ) )
		);
		$this->assertSame( 'not-an-array', Api_Proxy_Controller::register_transient_cleanup_prefix( 'not-an-array' ) );
	}
}
