<?php
/**
 * Tests for the VideoPress Api_Proxy_Controller.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Tests for the `/jetpack/v4/videopress/proxy/v<version>/<endpoint>` route.
 *
 * @covers \Automattic\Jetpack\VideoPress\Api_Proxy_Controller
 */
#[CoversClass( Api_Proxy_Controller::class )]
class Api_Proxy_Controller_Test extends BaseTestCase {

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
	 * Set up a REST server, a connected site and an HTTP stub.
	 */
	public function setUp(): void {
		parent::setUp();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();

		wp_set_current_user( $this->create_user( 'administrator' ) );

		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		\Jetpack_Options::update_option( 'id', 4242 );
		\Jetpack_Options::update_option( 'blog_token', 'blog_token.secret' );
		( new Connection_Manager() )->reset_connection_status();

		$this->http_calls    = array();
		$this->http_response = $this->build_http_response( 200, array( 'days' => array() ) );
		add_filter( 'pre_http_request', array( $this, 'stub_http_request' ), 10, 3 );

		Api_Proxy_Controller::init();
		do_action( 'rest_api_init' );
	}

	/**
	 * Clean up after tests.
	 */
	public function tearDown(): void {
		remove_filter( 'pre_http_request', array( $this, 'stub_http_request' ), 10 );

		\Jetpack_Options::delete_option( 'blog_token' );
		\Jetpack_Options::delete_option( 'id' );
		( new Connection_Manager() )->reset_connection_status();
		Constants::clear_single_constant( 'JETPACK__WPCOM_JSON_API_BASE' );

		global $wp_rest_server;
		$wp_rest_server = null;

		wp_set_current_user( 0 );

		parent::tearDown();
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
	 * @param int          $status Response status.
	 * @param array|string $body   Body, encoded as JSON unless it is a string.
	 * @return array
	 */
	private function build_http_response( $status, $body ) {
		return array(
			'response' => array( 'code' => $status ),
			'body'     => is_string( $body ) ? $body : wp_json_encode( $body, JSON_UNESCAPED_SLASHES ),
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
	 * Dispatches a GET request to the proxy.
	 *
	 * @param string $endpoint Endpoint, relative to the site.
	 * @param array  $params   Query params.
	 * @param string $version  WordPress.com API version.
	 * @return \WP_REST_Response
	 */
	private function get_from_proxy( $endpoint, array $params = array(), $version = '1.1' ) {
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/videopress/proxy/v' . $version . '/' . $endpoint );
		$request->set_query_params( $params );

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
	 * Test that the route is registered for reads only.
	 */
	public function test_route_is_registered_as_read_only() {
		$routes = array_filter(
			rest_get_server()->get_routes(),
			function ( $route ) {
				return str_starts_with( $route, '/jetpack/v4/videopress/proxy/v' );
			},
			ARRAY_FILTER_USE_KEY
		);

		$this->assertCount( 1, $routes );
		$handlers = reset( $routes );
		$this->assertIsArray( $handlers );
		$this->assertSame( array( 'GET' => true ), $handlers[0]['methods'] );
	}

	/**
	 * Test the endpoint allowlist.
	 *
	 * @dataProvider data_endpoints
	 *
	 * @param string $endpoint Endpoint, relative to the site.
	 * @param bool   $allowed  Whether the proxy forwards it.
	 */
	#[DataProvider( 'data_endpoints' )]
	public function test_validate_endpoint( $endpoint, $allowed ) {
		$this->assertSame( $allowed, Api_Proxy_Controller::validate_endpoint( $endpoint ) );
	}

	/**
	 * Data provider for the endpoint allowlist.
	 *
	 * @return array<string, array{0: string, 1: bool}>
	 */
	public static function data_endpoints() {
		return array(
			'video plays'           => array( 'stats/video-plays', true ),
			'single video'          => array( 'stats/video/45', true ),
			'site stats'            => array( 'stats', false ),
			'another stats report'  => array( 'stats/top-posts', false ),
			'single video, no id'   => array( 'stats/video', false ),
			'single video, slug'    => array( 'stats/video/intro', false ),
			'single video sub-path' => array( 'stats/video/45/extra', false ),
			'trailing slash'        => array( 'stats/video-plays/', false ),
			'trailing newline'      => array( "stats/video-plays\n", false ),
			'mixed case'            => array( 'Stats/Video-Plays', false ),
			'path traversal'        => array( 'stats/video-plays/../../posts', false ),
			'another resource'      => array( 'posts/45', false ),
			'user namespace'        => array( 'me/settings', false ),
			'empty'                 => array( '', false ),
		);
	}

	/**
	 * Test the API version format.
	 *
	 * @dataProvider data_versions
	 *
	 * @param string $version Version.
	 * @param bool   $valid   Whether it validates.
	 */
	#[DataProvider( 'data_versions' )]
	public function test_validate_version( $version, $valid ) {
		$this->assertSame( $valid, Api_Proxy_Controller::validate_version( $version ) );
	}

	/**
	 * Data provider for the API version format.
	 *
	 * @return array<string, array{0: string, 1: bool}>
	 */
	public static function data_versions() {
		return array(
			'v1.1'      => array( '1.1', true ),
			'v2'        => array( '2', true ),
			'word'      => array( 'latest', false ),
			'injection' => array( '2;DROP', false ),
			'newline'   => array( "1.1\n", false ),
			'empty'     => array( '', false ),
		);
	}

	/**
	 * Test that an endpoint outside the allowlist does not route.
	 *
	 * @dataProvider data_unrouted_endpoints
	 *
	 * @param string $endpoint Endpoint, relative to the site.
	 */
	#[DataProvider( 'data_unrouted_endpoints' )]
	public function test_endpoint_outside_the_allowlist_is_not_routed( $endpoint ) {
		$response = $this->get_from_proxy( $endpoint );

		$this->assertSame( 404, $response->get_status() );
		$this->assertSame( array(), $this->http_calls );
	}

	/**
	 * Data provider for the endpoints that must not route.
	 *
	 * @return array<string, string[]>
	 */
	public static function data_unrouted_endpoints() {
		return array(
			'site stats'            => array( 'stats' ),
			'another stats report'  => array( 'stats/top-posts' ),
			'prefix extension'      => array( 'stats/video-plays-extra' ),
			'single video sub-path' => array( 'stats/video/45/extra' ),
			'another resource'      => array( 'posts/45' ),
			'user namespace'        => array( 'me/settings' ),
		);
	}

	/**
	 * Test that a query param cannot point the proxy outside the allowlist.
	 */
	public function test_shadowed_endpoint_is_rejected() {
		$response = $this->get_from_proxy( 'stats/video-plays', array( 'endpoint' => 'me/settings' ) );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( array(), $this->http_calls );
	}

	/**
	 * Test that a logged-out request is rejected.
	 */
	public function test_logged_out_request_is_rejected() {
		wp_set_current_user( 0 );

		$response = $this->get_from_proxy( 'stats/video-plays' );

		$this->assertSame( 401, $response->get_status() );
		$this->assertSame( array(), $this->http_calls );
	}

	/**
	 * Test that a user holding neither capability is rejected.
	 */
	public function test_user_without_the_capability_is_rejected() {
		wp_set_current_user( $this->create_user( 'editor' ) );

		$response = $this->get_from_proxy( 'stats/video-plays' );

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( array(), $this->http_calls );
	}

	/**
	 * Test that the endpoint's capability reads it, without `manage_options`.
	 */
	public function test_user_with_the_capability_reads_the_endpoint() {
		wp_set_current_user( $this->create_user( 'subscriber', 'view_stats' ) );

		$response = $this->get_from_proxy( 'stats/video-plays' );

		$this->assertSame( 200, $response->get_status() );
	}

	/**
	 * Test that the permission fails closed outside the allowlist, administrators included.
	 */
	public function test_permission_is_denied_outside_the_allowlist() {
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/videopress/proxy/v1.1/stats/top-posts' );
		$request->set_url_params( array( 'endpoint' => 'stats/top-posts' ) );

		$this->assertFalse( Api_Proxy_Controller::check_permission( $request ) );
	}

	/**
	 * Test that a site without a connection gets an error before any request.
	 */
	public function test_disconnected_site_returns_error() {
		\Jetpack_Options::delete_option( 'blog_token' );
		( new Connection_Manager() )->reset_connection_status();

		$response = $this->get_from_proxy( 'stats/video-plays' );

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( 'no_connection', $response->get_data()['code'] );
		$this->assertSame( array(), $this->http_calls );
	}

	/**
	 * Test that the request reaches the site's endpoint with its query params, signed.
	 */
	public function test_forwards_the_request_signed_as_the_blog() {
		$this->http_response = $this->build_http_response( 200, array( 'period' => 'day' ) );

		$response = $this->get_from_proxy(
			'stats/video-plays',
			array(
				'period'         => 'day',
				'start_date'     => '2026-09-01',
				'date'           => '2026-09-07',
				'max'            => 10,
				'summarize'      => 1,
				'complete_stats' => 1,
			)
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'day', $response->get_data()->period );

		$this->assertCount( 1, $this->http_calls );
		$url = $this->http_calls[0]['url'];
		$this->assertStringStartsWith( 'https://public-api.wordpress.com/rest/v1.1/sites/4242/stats/video-plays?', $url );

		$this->assertSame(
			array(
				'period'         => 'day',
				'start_date'     => '2026-09-01',
				'date'           => '2026-09-07',
				'max'            => '10',
				'summarize'      => '1',
				'complete_stats' => '1',
			),
			$this->get_forwarded_query( $url )
		);

		$this->assertStringStartsWith( 'X_JETPACK ', $this->http_calls[0]['args']['headers']['Authorization'] );
	}

	/**
	 * Test that the single video endpoint is forwarded with its video ID.
	 */
	public function test_forwards_the_single_video_endpoint() {
		$this->get_from_proxy( 'stats/video/45', array( 'statType' => 'all' ) );

		$this->assertCount( 1, $this->http_calls );
		$this->assertStringStartsWith(
			'https://public-api.wordpress.com/rest/v1.1/sites/4242/stats/video/45?statType=all',
			$this->http_calls[0]['url']
		);
	}

	/**
	 * Test that the API version picks the WordPress.com base.
	 */
	public function test_version_two_is_forwarded_to_the_wpcom_base() {
		$this->get_from_proxy( 'stats/video-plays', array(), '2' );

		$this->assertCount( 1, $this->http_calls );
		$this->assertStringStartsWith(
			'https://public-api.wordpress.com/wpcom/v2/sites/4242/stats/video-plays',
			$this->http_calls[0]['url']
		);
	}

	/**
	 * Test that routing params and the proxy's own params are not forwarded.
	 */
	public function test_control_params_are_not_forwarded() {
		$this->get_from_proxy(
			'stats/video-plays',
			array(
				'period'        => 'day',
				'rest_route'    => '/jetpack/v4/videopress/proxy/v1.1/stats/video-plays',
				'_locale'       => 'user',
				'version'       => '1.1',
				'force_refresh' => 1,
			)
		);

		$this->assertCount( 1, $this->http_calls );
		$this->assertSame( array( 'period' => 'day' ), $this->get_forwarded_query( $this->http_calls[0]['url'] ) );
	}

	/**
	 * Test that a successful response is served from the cache the second time.
	 */
	public function test_successful_response_is_cached() {
		$this->http_response = $this->build_http_response( 200, array( 'period' => 'day' ) );

		$this->get_from_proxy(
			'stats/video-plays',
			array(
				'period' => 'day',
				'num'    => 7,
			)
		);
		// Same params in another order, plus a routing param: the same cache entry.
		$response = $this->get_from_proxy(
			'stats/video-plays',
			array(
				'_locale' => 'user',
				'num'     => 7,
				'period'  => 'day',
			)
		);

		$this->assertCount( 1, $this->http_calls );
		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'day', $response->get_data()->period );
	}

	/**
	 * Test that the cache serves a site that lost its connection.
	 */
	public function test_cached_response_is_served_without_a_connection() {
		$this->get_from_proxy( 'stats/video-plays' );

		\Jetpack_Options::delete_option( 'blog_token' );
		( new Connection_Manager() )->reset_connection_status();

		$response = $this->get_from_proxy( 'stats/video-plays' );

		$this->assertSame( 200, $response->get_status() );
		$this->assertCount( 1, $this->http_calls );
	}

	/**
	 * Test that the cache tells requests apart by params, endpoint and version.
	 */
	public function test_cache_entries_do_not_collide() {
		$this->get_from_proxy( 'stats/video-plays', array( 'num' => 7 ) );
		$this->get_from_proxy( 'stats/video-plays', array( 'num' => 30 ) );
		$this->get_from_proxy( 'stats/video/45', array( 'num' => 7 ) );
		$this->get_from_proxy( 'stats/video/46', array( 'num' => 7 ) );
		$this->get_from_proxy( 'stats/video-plays', array( 'num' => 7 ), '2' );

		$this->assertCount( 5, $this->http_calls );
	}

	/**
	 * Test that `force_refresh` neither reads nor writes the cache.
	 */
	public function test_force_refresh_bypasses_the_cache() {
		$this->get_from_proxy( 'stats/video-plays' );
		$this->get_from_proxy( 'stats/video-plays', array( 'force_refresh' => 1 ) );
		$this->get_from_proxy( 'stats/video-plays', array( 'force_refresh' => 1 ) );

		$this->assertCount( 3, $this->http_calls );
	}

	/**
	 * Test that an error from WordPress.com keeps its status and body, and is not cached.
	 */
	public function test_upstream_error_is_passed_through_and_not_cached() {
		$this->http_response = $this->build_http_response(
			404,
			array(
				'error'   => 'invalid_blog',
				'message' => 'This blog does not have the Stats module enabled',
			)
		);

		$response = $this->get_from_proxy( 'stats/video-plays' );
		$this->get_from_proxy( 'stats/video-plays' );

		$this->assertSame( 404, $response->get_status() );
		$this->assertSame( 'invalid_blog', $response->get_data()->error );
		$this->assertCount( 2, $this->http_calls );
	}

	/**
	 * Test that a successful response with an unreadable body is an error, and is not cached.
	 */
	public function test_unreadable_body_is_an_error_and_not_cached() {
		$this->http_response = $this->build_http_response( 200, '<html>not json</html>' );

		$response = $this->get_from_proxy( 'stats/video-plays' );
		$this->get_from_proxy( 'stats/video-plays' );

		$this->assertSame( 502, $response->get_status() );
		$this->assertSame( 'api_error', $response->get_data()['code'] );
		$this->assertCount( 2, $this->http_calls );
	}

	/**
	 * Test that a failed request is an error.
	 */
	public function test_transport_error_is_an_error() {
		$this->http_response = new WP_Error( 'http_request_failed', 'boom' );

		$response = $this->get_from_proxy( 'stats/video-plays' );

		$this->assertSame( 500, $response->get_status() );
		$this->assertSame( 'api_error', $response->get_data()['code'] );
	}

	/**
	 * Test that an empty object in the response stays an object.
	 */
	public function test_empty_object_is_not_turned_into_a_list() {
		$this->http_response = $this->build_http_response( 200, '{"days":{}}' );

		$first  = $this->get_from_proxy( 'stats/video-plays' );
		$cached = $this->get_from_proxy( 'stats/video-plays' );

		$this->assertSame( '{"days":{}}', wp_json_encode( $first->get_data(), JSON_UNESCAPED_SLASHES ) );
		$this->assertSame( '{"days":{}}', wp_json_encode( $cached->get_data(), JSON_UNESCAPED_SLASHES ) );
	}

	/**
	 * Test that the cache prefix joins the transient cleanup list.
	 */
	public function test_cache_prefix_joins_the_transient_cleanup() {
		$this->assertSame(
			array( 'other_prefix_', Api_Proxy_Controller::CACHE_PREFIX ),
			Api_Proxy_Controller::register_transient_cleanup_prefix( array( 'other_prefix_' ) )
		);
		$this->assertSame(
			'not-an-array',
			Api_Proxy_Controller::register_transient_cleanup_prefix( 'not-an-array' )
		);
	}
}
