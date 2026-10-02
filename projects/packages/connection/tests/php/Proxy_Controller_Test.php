<?php
/**
 * Tests for Proxy_Controller.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Drives the proxy through a synthetic prefix table, from the REST server down to the HTTP layer.
 *
 * @covers \Automattic\Jetpack\Connection\Proxy_Controller
 */
#[CoversClass( Proxy_Controller::class )]
class Proxy_Controller_Test extends BaseTestCase {

	const REST_NAMESPACE = 'jetpack-test/v1';
	const CACHE_PREFIX   = 'jetpack_test_proxy_';

	/**
	 * The prefix table under test: a plain group with a write, a cache-busting group, a
	 * pattern-constrained group, a site-less group, and an entry missing its capability.
	 */
	const PREFIX_CONFIG = array(
		'stats'   => array(
			'capability' => 'view_stats',
			'writes'     => array( 'stats/referrers/spam/' ),
		),
		'reports' => array(
			'capability' => 'view_reports',
			'writes'     => array( 'reports/settings' ),
			'cache_bust' => true,
		),
		'videos'  => array(
			'capability' => 'view_stats',
			'pattern'    => '[0-9]+/(?:plays|views)',
		),
		'account' => array(
			'capability' => 'manage_options',
			'path'       => '/me/account?site=%d',
		),
		'broken'  => array(),
	);

	/**
	 * Controller under test.
	 *
	 * @var Proxy_Controller
	 */
	private $controller;

	/**
	 * Outbound requests seen by the HTTP stub, as `url` and `args` pairs.
	 *
	 * @var array<int, array{url: string, args: array}>
	 */
	private $http_calls = array();

	/**
	 * What the HTTP stub answers with.
	 *
	 * @var array|WP_Error
	 */
	private $http_response;

	/**
	 * Set up a REST server, a connected site, an HTTP stub and the controller.
	 */
	public function set_up() {
		parent::set_up();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();

		wp_set_current_user( $this->create_user( 'administrator' ) );

		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		\Jetpack_Options::update_option( 'id', 4242 );
		\Jetpack_Options::update_option( 'blog_token', 'blog_token.secret' );
		( new Manager() )->reset_connection_status();

		$this->http_calls    = array();
		$this->http_response = $this->build_http_response( 200, array( 'ok' => true ) );
		add_filter( 'pre_http_request', array( $this, 'stub_http_request' ), 10, 3 );

		$this->controller = new Proxy_Controller(
			self::REST_NAMESPACE,
			self::PREFIX_CONFIG,
			self::CACHE_PREFIX,
			array( 'api_timeout' => 7 )
		);
		$this->controller->register_hooks();
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
		( new Manager() )->reset_connection_status();
		Constants::clear_single_constant( 'JETPACK__WPCOM_JSON_API_BASE' );

		global $wp_rest_server;
		$wp_rest_server = null;

		wp_set_current_user( 0 );

		parent::tear_down();
	}

	/**
	 * Records the outbound request and answers with the staged response.
	 *
	 * @param mixed  $pre  Short-circuit value.
	 * @param array  $args Request args.
	 * @param string $url  Request URL.
	 * @return array|WP_Error
	 */
	public function stub_http_request( $pre, $args, $url ) {
		$this->http_calls[] = array(
			'url'  => $url,
			'args' => $args,
		);

		return $this->http_response;
	}

	/**
	 * Builds a raw HTTP response with a JSON body.
	 *
	 * @param int          $status  Response status.
	 * @param array|string $body    Body, encoded as JSON unless it is a string.
	 * @param array        $headers Response headers.
	 * @return array
	 */
	private function build_http_response( $status, $body, array $headers = array() ) {
		return array(
			'response' => array( 'code' => $status ),
			'body'     => is_string( $body ) ? $body : wp_json_encode( $body, JSON_UNESCAPED_SLASHES ),
			'headers'  => $headers,
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
	 * @param string $version  WordPress.com API version.
	 * @param string $method   HTTP method.
	 * @param string $body     Request body, for writes.
	 * @return \WP_REST_Response
	 */
	private function dispatch( $endpoint, array $params = array(), $version = '1.1', $method = 'GET', $body = '' ) {
		$request = new WP_REST_Request( $method, '/' . self::REST_NAMESPACE . '/proxy/v' . $version . '/' . $endpoint );
		$request->set_query_params( $params );
		if ( '' !== $body ) {
			$request->set_header( 'Content-Type', 'application/json' );
			$request->set_body( $body );
		}

		return rest_get_server()->dispatch( $request );
	}

	/**
	 * Reads the query params of an outbound request, without the ones the signature adds.
	 *
	 * @param string $url Request URL.
	 * @return array
	 */
	private function get_forwarded_query( $url ) {
		parse_str( (string) wp_parse_url( $url, PHP_URL_QUERY ), $query );

		return array_diff_key( $query, array_flip( array( 'token', 'timestamp', 'nonce', 'body-hash', 'signature' ) ) );
	}

	/**
	 * The registered route key, found by its structural markers.
	 *
	 * @return string
	 */
	private function route_key() {
		foreach ( array_keys( rest_get_server()->get_routes() ) as $key ) {
			if ( str_starts_with( $key, '/' . self::REST_NAMESPACE . '/proxy/v' ) ) {
				return $key;
			}
		}

		return '';
	}

	/**
	 * The transient key a param-less read of an endpoint caches under.
	 *
	 * @param string $endpoint Endpoint, relative to the site.
	 * @param string $version  WordPress.com API version.
	 * @return string
	 */
	private function read_cache_key( $endpoint, $version = '1.1' ) {
		$accessor = function ( string $e, string $v ) {
			// @phan-suppress-next-line PhanUndeclaredMethod -- rebound to the controller via Closure::call() below.
			return $this->cache_key_for( $this->build_data_path( $e ), $v, $this->base_for_version( $v ), array() );
		};

		return $accessor->call( $this->controller, $endpoint, $version );
	}

	public function test_route_is_registered_for_reads_and_writes_with_the_controller_callbacks() {
		$route = $this->route_key();
		$this->assertNotSame( '', $route );

		$handler = rest_get_server()->get_routes()[ $route ][0];
		$this->assertArrayHasKey( 'GET', $handler['methods'] );
		$this->assertArrayHasKey( 'POST', $handler['methods'] );
		$this->assertSame( array( $this->controller, 'handle_data_request' ), $handler['callback'] );
		$this->assertSame( array( $this->controller, 'check_data_permission' ), $handler['permission_callback'] );
		$this->assertSame( array( $this->controller, 'validate_data_endpoint' ), $handler['args']['endpoint']['validate_callback'] );
		$this->assertSame( array( $this->controller, 'validate_version' ), $handler['args']['version']['validate_callback'] );
	}

	public function test_route_regex_carries_the_prefix_table() {
		$route = $this->route_key();

		$this->assertStringContainsString( '(?P<version>', $route );
		$this->assertStringContainsString( 'stats(?:/.*)?', $route );
		$this->assertStringContainsString( 'videos/[0-9]+/(?:plays|views)', $route );
		$this->assertStringNotContainsString( 'media', $route );
	}

	/**
	 * @dataProvider data_endpoints
	 *
	 * @param string $endpoint Endpoint, relative to the site.
	 * @param bool   $allowed  Whether the proxy forwards it.
	 */
	#[DataProvider( 'data_endpoints' )]
	public function test_validate_data_endpoint( string $endpoint, bool $allowed ) {
		$this->assertSame( $allowed, $this->controller->validate_data_endpoint( $endpoint ) );
	}

	/**
	 * @return array<string, array{0: string, 1: bool}>
	 */
	public static function data_endpoints(): array {
		return array(
			'prefix alone'              => array( 'stats', true ),
			'sub-path'                  => array( 'stats/top-posts', true ),
			'deep sub-path with commas' => array( 'stats/utm/utm_campaign,utm_source', true ),
			'mixed case prefix'         => array( 'Stats/top-posts', true ),
			'pattern match'             => array( 'videos/45/plays', true ),
			'pattern match, slash'      => array( 'videos/45/plays/', true ),
			'pattern miss, no id'       => array( 'videos/plays', false ),
			'pattern miss, extra'       => array( 'videos/45/plays/extra', false ),
			'pattern miss, slug'        => array( 'videos/intro/plays', false ),
			'site-less group'           => array( 'account', true ),
			'site-less group, slash'    => array( 'account/', true ),
			'site-less group, sub-path' => array( 'account/billing', false ),
			'entry without capability'  => array( 'broken/anything', true ),
			'unknown prefix'            => array( 'media', false ),
			'prefix extension'          => array( 'statsfoo', false ),
			'traversal'                 => array( 'stats/../../me/settings', false ),
			'scheme'                    => array( 'stats/a:b', false ),
			'foreign namespace'         => array( 'wp/v2/users', false ),
			'empty'                     => array( '', false ),
		);
	}

	/**
	 * @dataProvider data_versions
	 *
	 * @param string $version Version.
	 * @param bool   $valid   Whether it validates.
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
			'word'      => array( 'latest', false ),
			'injection' => array( '2;DROP', false ),
			'empty'     => array( '', false ),
		);
	}

	/**
	 * @dataProvider data_unrouted_endpoints
	 *
	 * @param string $endpoint Endpoint, relative to the site.
	 */
	#[DataProvider( 'data_unrouted_endpoints' )]
	public function test_endpoint_outside_the_table_is_not_routed( string $endpoint ) {
		$response = $this->dispatch( $endpoint );

		$this->assertSame( 404, $response->get_status() );
		$this->assertSame( array(), $this->http_calls );
	}

	/**
	 * @return array<string, string[]>
	 */
	public static function data_unrouted_endpoints(): array {
		return array(
			'unknown prefix'    => array( 'media' ),
			'prefix extension'  => array( 'statsfoo' ),
			'pattern miss'      => array( 'videos/45' ),
			'foreign namespace' => array( 'wp/v2/users' ),
			'raw sites path'    => array( 'sites/1/options' ),
		);
	}

	public function test_shadowed_endpoint_is_rejected_before_forwarding() {
		foreach ( array( 'me/settings', 'videos/45', 'wp/v2/users' ) as $shadow ) {
			$response = $this->dispatch( 'stats/top-posts', array( 'endpoint' => $shadow ) );

			$this->assertSame( 400, $response->get_status(), "shadow $shadow must be rejected" );
		}
		$this->assertSame( array(), $this->http_calls );
	}

	public function test_permission_follows_the_prefix_capability_or_manage_options() {
		$viewer = $this->create_user( 'subscriber', 'view_stats' );

		wp_set_current_user( $viewer );
		$this->assertTrue( $this->controller->check_data_permission( $this->build_request( 'stats/top-posts' ) ) );
		$this->assertTrue( $this->controller->check_data_permission( $this->build_request( 'videos/45/plays' ) ) );
		$this->assertFalse( $this->controller->check_data_permission( $this->build_request( 'reports/totals' ) ) );
		$this->assertFalse( $this->controller->check_data_permission( $this->build_request( 'account' ) ) );

		wp_set_current_user( $this->create_user( 'administrator' ) );
		$this->assertTrue( $this->controller->check_data_permission( $this->build_request( 'reports/totals' ) ) );
		$this->assertTrue( $this->controller->check_data_permission( $this->build_request( 'account' ) ) );
	}

	public function test_entry_without_a_capability_admits_only_administrators() {
		wp_set_current_user( $this->create_user( 'subscriber', 'view_stats' ) );
		$this->assertFalse( $this->controller->check_data_permission( $this->build_request( 'broken/anything' ) ) );

		wp_set_current_user( $this->create_user( 'administrator' ) );
		$this->assertTrue( $this->controller->check_data_permission( $this->build_request( 'broken/anything' ) ) );
	}

	public function test_permission_is_denied_outside_the_table_even_to_administrators() {
		wp_set_current_user( $this->create_user( 'administrator' ) );

		$this->assertFalse( $this->controller->check_data_permission( $this->build_request( 'media' ) ) );
		$this->assertFalse( $this->controller->check_data_permission( $this->build_request( 'wp/v2/users' ) ) );
	}

	public function test_permission_is_denied_to_a_logged_out_request() {
		wp_set_current_user( 0 );

		$response = $this->dispatch( 'stats/top-posts' );

		$this->assertSame( 401, $response->get_status() );
		$this->assertSame( array(), $this->http_calls );
	}

	public function test_unconnected_site_gets_no_connection_before_any_request() {
		\Jetpack_Options::delete_option( 'blog_token' );
		( new Manager() )->reset_connection_status();

		$response = $this->dispatch( 'stats/top-posts' );

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( 'no_connection', $response->get_data()['code'] );
		$this->assertSame( array(), $this->http_calls );
	}

	public function test_read_is_forwarded_signed_as_the_blog_with_its_params() {
		$this->http_response = $this->build_http_response( 200, array( 'period' => 'day' ) );

		$response = $this->dispatch(
			'stats/top-posts',
			array(
				'period' => 'day',
				'num'    => 7,
			)
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'day', $response->get_data()->period );

		$this->assertCount( 1, $this->http_calls );
		$url = $this->http_calls[0]['url'];
		$this->assertStringStartsWith( 'https://public-api.wordpress.com/rest/v1.1/sites/4242/stats/top-posts?', $url );
		$this->assertSame(
			array(
				'period' => 'day',
				'num'    => '7',
			),
			$this->get_forwarded_query( $url )
		);
		$this->assertStringStartsWith( 'X_JETPACK ', $this->http_calls[0]['args']['headers']['Authorization'] );
		$this->assertSame( 7, $this->http_calls[0]['args']['timeout'] );
	}

	public function test_control_and_routing_params_are_not_forwarded() {
		$this->dispatch(
			'stats/top-posts',
			array(
				'period'        => 'day',
				'rest_route'    => '/jetpack-test/v1/proxy/v1.1/stats/top-posts',
				'_locale'       => 'user',
				'site'          => '999',
				'version'       => '9',
				'force_refresh' => 1,
			)
		);

		$this->assertCount( 1, $this->http_calls );
		$this->assertSame( array( 'period' => 'day' ), $this->get_forwarded_query( $this->http_calls[0]['url'] ) );
	}

	public function test_version_two_is_forwarded_to_the_wpcom_base() {
		$this->dispatch( 'stats/top-posts', array(), '2' );

		$this->assertCount( 1, $this->http_calls );
		$this->assertStringStartsWith( 'https://public-api.wordpress.com/wpcom/v2/sites/4242/stats/top-posts', $this->http_calls[0]['url'] );
	}

	public function test_site_less_group_is_forwarded_to_its_own_path() {
		$this->dispatch( 'account', array( 'fields' => 'ID' ) );

		$this->assertCount( 1, $this->http_calls );
		$this->assertStringStartsWith( 'https://public-api.wordpress.com/rest/v1.1/me/account?site=4242&fields=ID', $this->http_calls[0]['url'] );
	}

	public function test_successful_read_is_cached_regardless_of_param_order() {
		$this->http_response = $this->build_http_response( 200, array( 'period' => 'day' ) );

		$this->dispatch(
			'stats/top-posts',
			array(
				'period' => 'day',
				'num'    => 7,
			)
		);
		$response = $this->dispatch(
			'stats/top-posts',
			array(
				'_locale' => 'user',
				'num'     => 7,
				'period'  => 'day',
			)
		);

		$this->assertCount( 1, $this->http_calls );
		$this->assertSame( 'day', $response->get_data()->period );
	}

	public function test_cached_read_is_served_without_a_connection() {
		$this->dispatch( 'stats/top-posts' );

		\Jetpack_Options::delete_option( 'blog_token' );
		( new Manager() )->reset_connection_status();

		$response = $this->dispatch( 'stats/top-posts' );

		$this->assertSame( 200, $response->get_status() );
		$this->assertCount( 1, $this->http_calls );
	}

	public function test_cache_entries_differ_by_params_endpoint_and_version() {
		$this->dispatch( 'stats/top-posts', array( 'num' => 7 ) );
		$this->dispatch( 'stats/top-posts', array( 'num' => 30 ) );
		$this->dispatch( 'stats/referrers', array( 'num' => 7 ) );
		$this->dispatch( 'stats/top-posts', array( 'num' => 7 ), '2' );

		$this->assertCount( 4, $this->http_calls );
	}

	public function test_force_refresh_neither_reads_nor_writes_the_cache() {
		$this->dispatch( 'stats/top-posts', array( 'force_refresh' => 1 ) );
		// Nothing was cached by the forced read, so this one reaches WordPress.com.
		$this->dispatch( 'stats/top-posts' );
		// Cached now, and the forced read still reaches WordPress.com.
		$this->dispatch( 'stats/top-posts', array( 'force_refresh' => 1 ) );

		$this->assertCount( 3, $this->http_calls );
	}

	public function test_upstream_error_keeps_its_status_and_body_and_is_not_cached() {
		$this->http_response = $this->build_http_response(
			404,
			array(
				'error'   => 'unknown_blog',
				'message' => 'Unknown blog',
			)
		);

		$response = $this->dispatch( 'stats/top-posts' );
		$this->dispatch( 'stats/top-posts' );

		$this->assertSame( 404, $response->get_status() );
		$this->assertSame( 'unknown_blog', $response->get_data()->error );
		$this->assertCount( 2, $this->http_calls );
	}

	public function test_unreadable_200_body_is_a_502_and_is_not_cached() {
		$this->http_response = $this->build_http_response( 200, '<html>not json</html>' );

		$response = $this->dispatch( 'stats/top-posts' );
		$this->dispatch( 'stats/top-posts' );

		$this->assertSame( 502, $response->get_status() );
		$this->assertSame( 'api_error', $response->get_data()['code'] );
		$this->assertCount( 2, $this->http_calls );
	}

	public function test_transport_error_is_an_api_error() {
		$this->http_response = new WP_Error( 'http_request_failed', 'boom' );

		$response = $this->dispatch( 'stats/top-posts' );

		$this->assertSame( 500, $response->get_status() );
		$this->assertSame( 'api_error', $response->get_data()['code'] );
	}

	public function test_empty_object_survives_the_round_trip_and_the_cache() {
		$this->http_response = $this->build_http_response( 200, '{"days":{}}' );

		$first  = $this->dispatch( 'stats/top-posts' );
		$cached = $this->dispatch( 'stats/top-posts' );

		$this->assertSame( '{"days":{}}', wp_json_encode( $first->get_data(), JSON_UNESCAPED_SLASHES ) );
		$this->assertSame( '{"days":{}}', wp_json_encode( $cached->get_data(), JSON_UNESCAPED_SLASHES ) );
	}

	public function test_write_to_a_read_only_endpoint_is_rejected_locally() {
		$response = $this->dispatch( 'stats/top-posts', array(), '1.1', 'POST', '{"a":1}' );

		$this->assertSame( 405, $response->get_status() );
		$this->assertSame( 'rest_read_only', $response->get_data()['code'] );
		$this->assertSame( array(), $this->http_calls );
	}

	public function test_only_post_may_write() {
		$response = $this->dispatch( 'reports/settings', array(), '2', 'PUT', '{"a":1}' );

		$this->assertSame( 405, $response->get_status() );
		$this->assertSame( array(), $this->http_calls );
	}

	public function test_write_is_forwarded_with_its_body_and_is_not_cached() {
		$this->http_response = $this->build_http_response( 200, array( 'saved' => true ) );

		$response = $this->dispatch( 'reports/settings', array(), '2', 'POST', '{"a":1}' );
		$this->dispatch( 'reports/settings', array(), '2', 'POST', '{"a":1}' );

		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( $response->get_data()->saved );
		$this->assertCount( 2, $this->http_calls );
		$this->assertSame( 'POST', $this->http_calls[0]['args']['method'] );
		$this->assertSame( '{"a":1}', $this->http_calls[0]['args']['body'] );
		$this->assertSame( 'application/json', $this->http_calls[0]['args']['headers']['Content-Type'] );
		$this->assertStringStartsWith( 'https://public-api.wordpress.com/wpcom/v2/sites/4242/reports/settings', $this->http_calls[0]['url'] );
	}

	public function test_write_matchers_cover_a_sub_tree_or_an_exact_endpoint() {
		$accessor = function ( string $e ) {
			// @phan-suppress-next-line PhanUndeclaredMethod -- rebound to the controller via Closure::call() below.
			return $this->is_write_allowed( $e );
		};

		$this->assertTrue( $accessor->call( $this->controller, 'stats/referrers/spam/new' ) );
		$this->assertTrue( $accessor->call( $this->controller, 'STATS/referrers/spam/delete' ) );
		$this->assertTrue( $accessor->call( $this->controller, 'reports/settings' ) );
		$this->assertFalse( $accessor->call( $this->controller, 'reports/settings/extra' ) );
		$this->assertFalse( $accessor->call( $this->controller, 'stats/referrers/spam' ) );
		$this->assertFalse( $accessor->call( $this->controller, 'stats/top-posts' ) );
	}

	public function test_successful_write_busts_the_read_cache_of_a_cache_bust_group() {
		$read_key = $this->read_cache_key( 'reports/settings', '2' );
		set_transient( $read_key, array( 'data' => 'stale' ), MINUTE_IN_SECONDS );

		$this->dispatch( 'reports/settings', array(), '2', 'POST', '{"a":1}' );

		$this->assertFalse( get_transient( $read_key ) );
	}

	/**
	 * @dataProvider data_non_busting_writes
	 *
	 * @param string $endpoint Endpoint of the write.
	 * @param int    $status   The WordPress.com response status.
	 */
	#[DataProvider( 'data_non_busting_writes' )]
	public function test_read_cache_survives_a_write_that_must_not_bust( string $endpoint, int $status ) {
		$this->http_response = $this->build_http_response( $status, array() );
		$read_key            = $this->read_cache_key( $endpoint, '2' );
		set_transient( $read_key, array( 'data' => 'keep' ), MINUTE_IN_SECONDS );

		$this->dispatch( $endpoint, array(), '2', 'POST', '{"a":1}' );

		$this->assertNotFalse( get_transient( $read_key ) );
	}

	/**
	 * @return array<string, array{0: string, 1: int}>
	 */
	public static function data_non_busting_writes(): array {
		return array(
			'group not opted in' => array( 'stats/referrers/spam/new', 200 ),
			'failed write'       => array( 'reports/settings', 500 ),
		);
	}

	public function test_cache_prefix_joins_the_transient_cleanup() {
		$this->assertSame(
			array( 'other_prefix_', self::CACHE_PREFIX ),
			$this->controller->register_transient_cleanup_prefix( array( 'other_prefix_' ) )
		);
		$this->assertSame( 'not-an-array', $this->controller->register_transient_cleanup_prefix( 'not-an-array' ) );
		$this->assertContains( self::CACHE_PREFIX, apply_filters( 'jetpack_stats_transient_cleanup_prefixes', array() ) );
		$this->assertStringStartsWith( self::CACHE_PREFIX, $this->read_cache_key( 'stats/top-posts' ) );
	}

	public function test_no_response_header_is_forwarded_by_default() {
		$this->http_response = $this->build_http_response( 200, array(), array( 'x-wp-total' => '42' ) );

		$response = $this->dispatch( 'stats/top-posts' );

		$this->assertArrayNotHasKey( 'x-wp-total', $response->get_headers() );
	}

	public function test_a_product_extends_the_transport_body_and_header_seams() {
		$controller = new class( self::REST_NAMESPACE, self::PREFIX_CONFIG, self::CACHE_PREFIX ) extends Proxy_Controller {
			/**
			 * Routes one group through another transport.
			 *
			 * @param WP_REST_Request      $request    Request object.
			 * @param string               $wpcom_path WordPress.com path.
			 * @param array<string, mixed> $opts       Forwarding opts.
			 * @return array|WP_Error
			 */
			protected function request( WP_REST_Request $request, string $wpcom_path, array $opts ) {
				if ( 'videos' === explode( '/', ltrim( $wpcom_path, '/' ) )[2] ) {
					return array(
						'response' => array( 'code' => 200 ),
						'body'     => '{"transport":"custom"}',
						'headers'  => array( 'x-wp-total' => '1' ),
					);
				}

				return parent::request( $request, $wpcom_path, $opts );
			}

			/**
			 * Rewrites every write body.
			 *
			 * @param string               $body The incoming request body.
			 * @param array<string, mixed> $opts Forwarding opts.
			 * @return string
			 */
			protected function prepare_body( string $body, array $opts ): string { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- The seam's signature.
				return '{"rewritten":true}';
			}

			/**
			 * Forwards the pagination total.
			 *
			 * @param mixed $headers Response headers.
			 * @return array<string, string>
			 */
			protected function extract_forwarded_headers( $headers ): array {
				return isset( $headers['x-wp-total'] ) ? array( 'x-wp-total' => (string) $headers['x-wp-total'] ) : array();
			}
		};

		$custom = $controller->handle_data_request( $this->build_request( 'videos/45/plays' ) );
		$this->assertSame( 'custom', $custom->get_data()->transport );
		$this->assertSame( '1', $custom->get_headers()['x-wp-total'] );
		$this->assertSame( array(), $this->http_calls );

		$write = $this->build_request( 'reports/settings', array(), '2', 'POST' );
		$write->set_body( '{"a":1}' );
		$controller->handle_data_request( $write );
		$this->assertSame( '{"rewritten":true}', $this->http_calls[0]['args']['body'] );
	}

	/**
	 * Build a request with the route captures set, as the server does when it matches the route.
	 *
	 * @param string $endpoint The endpoint to proxy.
	 * @param array  $params   Forwarded query params.
	 * @param string $version  WordPress.com API version.
	 * @param string $method   HTTP method.
	 * @return WP_REST_Request
	 */
	private function build_request( string $endpoint, array $params = array(), string $version = '1.1', string $method = 'GET' ): WP_REST_Request {
		$request = new WP_REST_Request( $method, '/' . self::REST_NAMESPACE . '/proxy/v' . $version . '/' . $endpoint );
		$request->set_url_params(
			array(
				'endpoint' => $endpoint,
				'version'  => $version,
			)
		);
		$request->set_query_params( $params );

		return $request;
	}
}
