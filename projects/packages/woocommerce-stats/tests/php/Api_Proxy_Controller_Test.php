<?php
/**
 * Tests for the reports proxy.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_REST_Request;
use WP_REST_Server;

/**
 * The route reads WooCommerce reports from WordPress.com for a connected site.
 *
 * @covers \Automattic\Jetpack\WooCommerceStats\Api_Proxy_Controller
 */
#[CoversClass( Api_Proxy_Controller::class )]
class Api_Proxy_Controller_Test extends BaseTestCase {

	/**
	 * Requests that reached WordPress.com.
	 *
	 * @var array[]
	 */
	private $requests = array();

	/**
	 * What WordPress.com answers with.
	 *
	 * @var array|\WP_Error
	 */
	private $upstream;

	/**
	 * A connected site, an administrator, and a WordPress.com that answers 200.
	 */
	public function set_up() {
		parent::set_up();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		add_action( 'rest_api_init', array( Api_Proxy_Controller::class, 'init' ) );
		do_action( 'rest_api_init' );

		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		\Jetpack_Options::update_option( 'id', 4242 );
		\Jetpack_Options::update_option( 'blog_token', 'blog_token.secret' );
		( new Connection_Manager() )->reset_connection_status();

		$this->requests = array();
		$this->upstream = $this->upstream_response( 200, '{"orders":42}' );
		add_filter( 'pre_http_request', array( $this, 'answer_as_wordpress_com' ), 10, 3 );

		wp_set_current_user( $this->create_user( 'administrator' ) );
	}

	/**
	 * Drop the connection, the route and the user.
	 */
	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'answer_as_wordpress_com' ) );
		remove_action( 'rest_api_init', array( Api_Proxy_Controller::class, 'init' ) );

		\Jetpack_Options::delete_option( 'blog_token' );
		\Jetpack_Options::delete_option( 'id' );
		( new Connection_Manager() )->reset_connection_status();
		Constants::clear_constants();
		wp_set_current_user( 0 );

		global $wp_rest_server;
		$wp_rest_server = null;

		parent::tear_down();
	}

	public function test_forwards_a_report_signed_with_the_blog_token() {
		$response = $this->get_report(
			'orders/by-date',
			array(
				'from'     => '2026-01-01',
				'interval' => 'day',
			)
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 42, $response->get_data()->orders );
		$this->assertCount( 1, $this->requests );
		$this->assertStringStartsWith(
			'https://public-api.wordpress.com/wpcom/v2/sites/4242/analytics/reports/orders/by-date?from=2026-01-01&interval=day&',
			$this->requests[0]['url']
		);
		$this->assertSame( 'GET', $this->requests[0]['args']['method'] );
		$this->assertStringStartsWith( 'X_JETPACK token="blog_token:', $this->requests[0]['args']['headers']['Authorization'] );
	}

	/**
	 * @dataProvider data_readers
	 *
	 * @param string|null $role   Role of the reader, null when logged out.
	 * @param string|null $cap    Capability added to the reader.
	 * @param int         $status Expected status.
	 */
	#[DataProvider( 'data_readers' )]
	public function test_serves_only_readers_of_store_reports( $role, $cap, $status ) {
		wp_set_current_user( null === $role ? 0 : $this->create_user( $role, $cap ) );

		$this->assertSame( $status, $this->get_report()->get_status() );
		$this->assertCount( 200 === $status ? 1 : 0, $this->requests );
	}

	/**
	 * @return array<string, array{0: string|null, 1: string|null, 2: int}>
	 */
	public static function data_readers() {
		return array(
			'logged out'    => array( null, null, 401 ),
			'stats reader'  => array( 'subscriber', 'view_stats', 403 ),
			'shop manager'  => array( 'subscriber', 'view_woocommerce_reports', 200 ),
			'administrator' => array( 'administrator', null, 200 ),
		);
	}

	/**
	 * @dataProvider data_paths_outside_the_reports
	 *
	 * @param string $path   Path below `proxy/v2/`.
	 * @param array  $params Query params.
	 * @param int    $status Expected status.
	 */
	#[DataProvider( 'data_paths_outside_the_reports' )]
	public function test_reaches_nothing_but_the_reports( $path, $params, $status ) {
		$response = $this->dispatch( 'GET', $path, $params );

		$this->assertSame( $status, $response->get_status() );
		$this->assertSame( array(), $this->requests );
	}

	/**
	 * @return array<string, array{0: string, 1: array, 2: int}>
	 */
	public static function data_paths_outside_the_reports() {
		return array(
			'another analytics path'   => array( 'analytics/sync-status', array(), 404 ),
			'another endpoint group'   => array( 'stats/top-posts', array(), 404 ),
			'the reports root'         => array( 'analytics/reports', array(), 404 ),
			'a traversal'              => array( 'analytics/reports/../../stats/top-posts', array(), 400 ),
			'a shadowed route capture' => array( 'analytics/reports/orders', array( 'endpoint' => 'stats/top-posts' ), 400 ),
		);
	}

	public function test_does_not_route_writes() {
		$this->assertSame( 404, $this->dispatch( 'POST', 'analytics/reports/orders' )->get_status() );
		$this->assertSame( array(), $this->requests );
	}

	public function test_answers_no_connection_on_a_site_without_one() {
		\Jetpack_Options::delete_option( 'blog_token' );
		( new Connection_Manager() )->reset_connection_status();

		$response = $this->get_report();

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( 'no_connection', $response->get_data()['code'] );
		$this->assertSame( array(), $this->requests );
	}

	public function test_caches_a_report_by_path_and_params() {
		$params = array(
			'from'     => '2026-01-01',
			'interval' => 'day',
		);

		$this->get_report( 'orders/by-date', $params );
		$cached = $this->get_report( 'orders/by-date', array_reverse( $params, true ) );

		$this->assertCount( 1, $this->requests );
		$this->assertSame( 42, $cached->get_data()->orders );

		$this->get_report( 'orders/by-date', array( 'interval' => 'week' ) + $params );
		$this->get_report( 'products', $params );
		$this->get_report( 'orders/by-date', $params + array( 'force_refresh' => '1' ) );

		$this->assertCount( 4, $this->requests );
		$this->assertStringNotContainsString( 'force_refresh', $this->requests[3]['url'] );
	}

	public function test_passes_an_upstream_error_through_without_caching_it() {
		$this->upstream = $this->upstream_response( 400, '{"code":"invalid_interval","message":"Bad interval."}' );

		$response = $this->get_report();
		$this->get_report();

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'invalid_interval', $response->get_data()->code );
		$this->assertCount( 2, $this->requests );
	}

	public function test_keeps_the_cause_of_a_failed_request() {
		$this->upstream = new \WP_Error( 'http_request_failed', 'Operation timed out.' );

		$response = $this->get_report();

		$this->assertSame( 500, $response->get_status() );
		$this->assertSame( 'http_request_failed', $response->get_data()['code'] );
	}

	public function test_does_not_cache_an_unreadable_response() {
		$this->upstream = $this->upstream_response( 200, '<html>Bad gateway</html>' );

		$response = $this->get_report();
		$this->get_report();

		$this->assertSame( 502, $response->get_status() );
		$this->assertSame( 'api_error', $response->get_data()['code'] );
		$this->assertCount( 2, $this->requests );
	}

	public function test_passes_the_pagination_headers_back() {
		$this->upstream = $this->upstream_response(
			200,
			'[]',
			array(
				'x-wp-total' => '42',
				'x-other'    => 'dropped',
			)
		);

		$this->assertSame( array( 'x-wp-total' => '42' ), $this->get_report()->get_headers() );
	}

	/**
	 * Answer a request to WordPress.com, and record it.
	 *
	 * @param mixed  $pre  Short-circuit value.
	 * @param array  $args Request arguments.
	 * @param string $url  Request URL.
	 * @return array|\WP_Error
	 */
	public function answer_as_wordpress_com( $pre, $args, $url ) {
		$this->requests[] = array(
			'url'  => $url,
			'args' => $args,
		);

		return $this->upstream;
	}

	/**
	 * A response of WordPress.com, as the HTTP API returns it.
	 *
	 * @param int    $status  Status code.
	 * @param string $body    Body.
	 * @param array  $headers Headers.
	 * @return array
	 */
	private function upstream_response( $status, $body, array $headers = array() ) {
		return array(
			'response' => array( 'code' => $status ),
			'body'     => $body,
			'headers'  => $headers,
		);
	}

	/**
	 * Read a report through the route.
	 *
	 * @param string $report Path below `analytics/reports/`.
	 * @param array  $params Query params.
	 * @return \WP_REST_Response
	 */
	private function get_report( $report = 'orders/by-date', array $params = array() ) {
		return $this->dispatch( 'GET', 'analytics/reports/' . $report, $params );
	}

	/**
	 * Dispatch a request to a path below `proxy/v2/`.
	 *
	 * @param string $method HTTP method.
	 * @param string $path   Path below `proxy/v2/`.
	 * @param array  $params Query params.
	 * @return \WP_REST_Response
	 */
	private function dispatch( $method, $path, array $params = array() ) {
		$request = new WP_REST_Request( $method, '/' . Api_Proxy_Controller::REST_NAMESPACE . '/proxy/v2/' . $path );
		$request->set_query_params( $params );

		return rest_get_server()->dispatch( $request );
	}

	/**
	 * Create a user, with an extra capability when given.
	 *
	 * @param string      $role Role.
	 * @param string|null $cap  Capability to add.
	 * @return int
	 */
	private function create_user( $role, $cap = null ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'reader_' . wp_rand(),
				'user_pass'  => 'password',
				'role'       => $role,
			)
		);

		if ( null !== $cap ) {
			( new \WP_User( $user_id ) )->add_cap( $cap );
		}

		return $user_id;
	}
}
