<?php
/**
 * Tests for Proxy_Request and the WPCOM_REST_API_Proxy_Request trait built on it.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Connection\Traits\WPCOM_REST_API_Proxy_Request;
use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\CoversTrait;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_Error;
use WP_REST_Request;

/**
 * Drives the forward directly and through a bare object using the trait, down to the HTTP layer.
 *
 * @covers \Automattic\Jetpack\Connection\Proxy_Request
 * @covers \Automattic\Jetpack\Connection\Traits\WPCOM_REST_API_Proxy_Request
 */
#[CoversClass( Proxy_Request::class )]
#[CoversTrait( WPCOM_REST_API_Proxy_Request::class )]
class Proxy_Request_Test extends BaseTestCase {

	const BLOG_ID = 4242;

	/**
	 * Object using the trait, configured like a v1.1 `publicize/connections` controller.
	 *
	 * @var object
	 */
	private $host;

	/**
	 * Current user, an administrator.
	 *
	 * @var int
	 */
	private $user_id;

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
	 * Set up a connected site, a logged-in user, an HTTP stub and the host.
	 */
	public function set_up() {
		parent::set_up();

		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		\Jetpack_Options::update_option( 'id', self::BLOG_ID );
		\Jetpack_Options::update_option( 'blog_token', 'blog_token.secret' );
		( new Manager() )->reset_connection_status();

		$this->user_id = wp_insert_user(
			array(
				'user_login' => 'proxy_request_user_' . wp_rand(),
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $this->user_id );
		$_SERVER['REMOTE_ADDR'] = '203.0.113.9';

		$this->http_calls    = array();
		$this->http_response = $this->build_http_response( 200, array( 'ok' => true ) );
		add_filter( 'pre_http_request', array( $this, 'stub_http_request' ), 10, 3 );

		$this->host = $this->make_host( 'publicize/connections', '1.1', 'rest' );
	}

	/**
	 * Clean up after tests.
	 */
	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'stub_http_request' ), 10 );

		\Jetpack_Options::delete_option( 'user_tokens' );
		\Jetpack_Options::delete_option( 'blog_token' );
		\Jetpack_Options::delete_option( 'id' );
		( new Manager() )->reset_connection_status();
		Constants::clear_single_constant( 'JETPACK__WPCOM_JSON_API_BASE' );

		unset( $_SERVER['REMOTE_ADDR'] );
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
	 * Upstream statuses the forward must hand back as they came.
	 *
	 * @return array<string, array{int}>
	 */
	public static function data_statuses() {
		return array(
			'success' => array( 200 ),
			'error'   => array( 404 ),
		);
	}

	/**
	 * @dataProvider data_statuses
	 *
	 * @param int $status Upstream status.
	 */
	#[DataProvider( 'data_statuses' )]
	public function test_to_path_returns_the_status_body_and_headers_as_sent( int $status ) {
		$this->http_response = $this->build_http_response( $status, array( 'code' => 'x' ), array( 'X-WP-Total' => '7' ) );

		$result = Proxy_Request::to_path( '/sites/4242/stats', array( 'context' => 'blog' ) );

		$this->assertSame(
			array(
				'status'  => $status,
				'body'    => '{"code":"x"}',
				'headers' => array( 'x-wp-total' => '7' ),
			),
			$result
		);
	}

	public function test_to_path_args_shape_the_outbound_request() {
		Proxy_Request::to_path(
			'/sites/4242/stats',
			array(
				'context'         => 'blog',
				'method'          => 'post',
				'query'           => array( 'period' => 'day' ),
				'body'            => '{"a":1}',
				'version'         => '1.1',
				'base_api_path'   => 'rest',
				'request_options' => array(
					'timeout' => 120,
					'headers' => array( 'Content-Type' => 'text/plain' ),
				),
			)
		);

		$call = $this->http_calls[0];
		$this->assertSame( '/rest/v1.1/sites/4242/stats', wp_parse_url( $call['url'], PHP_URL_PATH ) );
		$this->assertSame( array( 'period' => 'day' ), $this->get_forwarded_query( $call['url'] ) );
		$this->assertSame( 'POST', $call['args']['method'] );
		$this->assertSame( 120, $call['args']['timeout'] );
		$this->assertSame( '{"a":1}', $call['args']['body'] );
		$this->assertSame( 'text/plain', $call['args']['headers']['Content-Type'] );
		$this->assertSame( '203.0.113.9', $call['args']['headers']['X-Forwarded-For'] );
	}

	public function test_an_unsigned_request_needs_no_connection_and_carries_no_token_or_visitor_ip() {
		\Jetpack_Options::delete_option( 'blog_token' );
		( new Manager() )->reset_connection_status();

		$result = Proxy_Request::to_site(
			'posts/7/likes',
			array(
				'context'       => 'none',
				'version'       => '1.1',
				'base_api_path' => 'rest',
			)
		);

		$this->assertSame( 200, $result['status'] );
		$call = $this->http_calls[0];
		$this->assertSame( 'https://public-api.wordpress.com/rest/v1.1/sites/4242/posts/7/likes', $call['url'] );
		$this->assertSame( 'GET', $call['args']['method'] );
		$this->assertArrayNotHasKey( 'Authorization', $call['args']['headers'] );
		$this->assertArrayNotHasKey( 'X-Forwarded-For', $call['args']['headers'] );
	}

	/**
	 * Forward args and whether the site keeps its blog id, for calls that must be refused locally.
	 *
	 * @return array<string, array{array, bool}>
	 */
	public static function data_refused_forwards() {
		return array(
			'blog context on an unconnected site'  => array( array( 'context' => 'blog' ), true ),
			'unsigned site path without a blog id' => array( array( 'context' => 'none' ), false ),
			'unknown context'                      => array( array( 'context' => 'jetpack' ), true ),
		);
	}

	/**
	 * @dataProvider data_refused_forwards
	 *
	 * @param array $args        Forward args.
	 * @param bool  $has_blog_id Whether the site keeps its blog id.
	 */
	#[DataProvider( 'data_refused_forwards' )]
	public function test_a_refused_forward_returns_the_callers_unauthorized_error( array $args, bool $has_blog_id ) {
		\Jetpack_Options::delete_option( 'blog_token' );
		if ( ! $has_blog_id ) {
			\Jetpack_Options::delete_option( 'id' );
		}
		( new Manager() )->reset_connection_status();

		$result = Proxy_Request::to_site(
			'stats',
			$args + array(
				'unauthorized_error' => array(
					'code'    => 'no_connection',
					'message' => 'This site is not connected.',
					'status'  => 418,
				),
			)
		);

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'no_connection', $result->get_error_code() );
		$this->assertSame( 'This site is not connected.', $result->get_error_message() );
		$this->assertSame( 418, $result->get_error_data()['status'] );
		$this->assertSame( array(), $this->http_calls );
	}

	/**
	 * Query params as PHP hands them over, and the ones WordPress.com must receive.
	 *
	 * @return array<string, array{array, array}>
	 */
	public static function data_queries() {
		return array(
			'a value with separators stays one param' => array(
				array(
					'search' => 'a&_method=PUT',
					'tag'    => 'a#b',
					'sum'    => '1+2',
				),
				array(
					'search' => 'a&_method=PUT',
					'tag'    => 'a#b',
					'sum'    => '1+2',
				),
			),
			'a nested param keeps its shape'          => array(
				array( 'filter' => array( 'status' => array( 'a b', 'c' ) ) ),
				array( 'filter' => array( 'status' => array( 'a b', 'c' ) ) ),
			),
			'a method override is dropped'            => array(
				array(
					'_method' => 'PUT',
					'period'  => 'day',
				),
				array( 'period' => 'day' ),
			),
			'an encoded key is dropped'               => array(
				array(
					'%5Fmethod' => 'PUT',
					'period'    => 'day',
				),
				array( 'period' => 'day' ),
			),
			'a key with a separator is dropped'       => array(
				array(
					'x&_method' => 'PUT',
					'period'    => 'day',
				),
				array( 'period' => 'day' ),
			),
			'an unsafe nested key is dropped'         => array(
				array(
					'filter' => array(
						'x&_method' => 'PUT',
						'status'    => 'a',
					),
				),
				array( 'filter' => array( 'status' => 'a' ) ),
			),
		);
	}

	/**
	 * @dataProvider data_queries
	 *
	 * @param array $query    Query params given to the forward.
	 * @param array $expected Query params on the outbound request.
	 */
	#[DataProvider( 'data_queries' )]
	public function test_a_query_param_reaches_wordpress_com_as_written_or_not_at_all( array $query, array $expected ) {
		Proxy_Request::to_path(
			'/sites/4242/stats',
			array(
				'context' => 'blog',
				'query'   => $query,
			)
		);

		$this->assertSame( $expected, $this->get_forwarded_query( $this->http_calls[0]['url'] ) );
	}

	public function test_proxy_request_carries_the_request_to_the_rest_base_path_signed_as_the_blog() {
		$request = new WP_REST_Request( 'POST', '/wpcom/v2/publicize/connections/12' );
		$request->set_query_params(
			array(
				'fields'     => 'id,shared',
				'rest_route' => '/wpcom/v2/publicize/connections/12',
			)
		);
		$request->set_body( '{"shared":true}' );
		$this->http_response = $this->build_http_response( 200, array( 'id' => 12 ) );

		$result = $this->host->proxy_request_to_wpcom_as_blog( $request, '12' );

		$this->assertSame( array( 'id' => 12 ), $result );
		$call = $this->http_calls[0];
		$this->assertSame( '/rest/v1.1/sites/4242/publicize/connections/12', wp_parse_url( $call['url'], PHP_URL_PATH ) );
		$this->assertSame( array( 'fields' => 'id,shared' ), $this->get_forwarded_query( $call['url'] ) );
		$this->assertStringStartsWith( 'blog_token:', $this->get_token( $call['url'] ) );
		$this->assertSame( 'POST', $call['args']['method'] );
		$this->assertSame( '{"shared":true}', $call['args']['body'] );
		$this->assertSame( 'application/json', $call['args']['headers']['Content-Type'] );
		$this->assertSame( '203.0.113.9', $call['args']['headers']['X-Forwarded-For'] );
	}

	public function test_proxy_request_sends_no_body_for_an_empty_request_body() {
		$request = new WP_REST_Request( 'POST', '/wpcom/v2/publicize/connections' );
		$request->set_body( '' );

		$result = $this->host->proxy_request_to_wpcom_as_blog( $request );

		$this->assertSame( array( 'ok' => true ), $result );
		$this->assertNull( $this->http_calls[0]['args']['body'] );
	}

	/**
	 * Context, fallback, user connected, site connected, and the token prefix expected (null = unauthorized).
	 *
	 * @return array<string, array{string, bool, bool, bool, string|null}>
	 */
	public static function data_token_contexts() {
		return array(
			'user context with a connected user signs as the user' => array( 'user', false, true, true, 'user_token:' ),
			'user context without a connected user is refused'     => array( 'user', false, false, true, null ),
			'user context falls back to the blog when allowed'     => array( 'user', true, false, true, 'blog_token:' ),
			'blog context on an unconnected site is refused'       => array( 'blog', false, false, false, null ),
		);
	}

	/**
	 * @dataProvider data_token_contexts
	 *
	 * @param string      $context        Token context.
	 * @param bool        $fallback       Whether a user request may fall back to the blog token.
	 * @param bool        $user_connected Whether the current user holds a token.
	 * @param bool        $site_connected Whether the site holds a blog token.
	 * @param string|null $token_prefix   Expected `token` param prefix, or null for `rest_unauthorized`.
	 */
	#[DataProvider( 'data_token_contexts' )]
	public function test_the_context_decides_the_token( string $context, bool $fallback, bool $user_connected, bool $site_connected, ?string $token_prefix ) {
		if ( $user_connected ) {
			\Jetpack_Options::update_option( 'user_tokens', array( $this->user_id => 'user_token.secret.' . $this->user_id ) );
		}
		if ( ! $site_connected ) {
			\Jetpack_Options::delete_option( 'blog_token' );
		}
		( new Manager() )->reset_connection_status();

		$result = $this->host->proxy_request_to_wpcom( new WP_REST_Request( 'GET', '/wpcom/v2/publicize/connections' ), '', $context, $fallback );

		if ( null === $token_prefix ) {
			$this->assertInstanceOf( WP_Error::class, $result );
			$this->assertSame( 'rest_unauthorized', $result->get_error_code() );
			$this->assertSame( 403, $result->get_error_data()['status'] );
			$this->assertSame( array(), $this->http_calls );
			return;
		}

		$this->assertSame( array( 'ok' => true ), $result );
		$this->assertStringStartsWith( $token_prefix, $this->get_token( $this->http_calls[0]['url'] ) );
	}

	/**
	 * Upstream status and body, and the WP_Error code and message they become.
	 *
	 * @return array<string, array{int, array|string, string, string}>
	 */
	public static function data_upstream_errors() {
		return array(
			'code and message from the body' => array(
				400,
				array(
					'code'    => 'invalid_period',
					'message' => 'Bad period.',
				),
				'invalid_period',
				'Bad period.',
			),
			'body without a code'            => array( 500, array( 'error' => 'oops' ), 'unknown_error', 'An unknown error occurred.' ),
		);
	}

	/**
	 * @dataProvider data_upstream_errors
	 *
	 * @param int          $status  Upstream status.
	 * @param array|string $body    Upstream body.
	 * @param string       $code    Expected error code.
	 * @param string       $message Expected error message.
	 */
	#[DataProvider( 'data_upstream_errors' )]
	public function test_an_upstream_error_becomes_a_wp_error_with_its_status( int $status, $body, string $code, string $message ) {
		$this->http_response = $this->build_http_response( $status, $body );

		$result = $this->host->proxy_request_to_wpcom_as_blog( new WP_REST_Request( 'GET', '/wpcom/v2/publicize/connections' ) );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( $code, $result->get_error_code() );
		$this->assertSame( $message, $result->get_error_message() );
		$this->assertSame( $status, $result->get_error_data()['status'] );
	}

	public function test_a_transport_error_is_returned_untouched() {
		$this->http_response = new WP_Error( 'http_request_failed', 'cURL error 28' );

		$result = $this->host->proxy_request_to_wpcom_as_blog( new WP_REST_Request( 'GET', '/wpcom/v2/publicize/connections' ) );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'http_request_failed', $result->get_error_code() );
		$this->assertSame( 'cURL error 28', $result->get_error_message() );
	}

	/**
	 * Builds an object using the trait, with the properties a controller would set.
	 *
	 * @param string $rest_base     Route base, which the trait maps under `/sites/<id>/`.
	 * @param string $version       WordPress.com API version.
	 * @param string $base_api_path WordPress.com API base.
	 * @return object
	 */
	private function make_host( $rest_base, $version, $base_api_path ) {
		return new class( $rest_base, $version, $base_api_path ) {
			use WPCOM_REST_API_Proxy_Request;

			/**
			 * Constructor.
			 *
			 * @param string $rest_base     Route base.
			 * @param string $version       API version.
			 * @param string $base_api_path API base.
			 */
			public function __construct( $rest_base, $version, $base_api_path ) {
				$this->rest_base     = $rest_base;
				$this->version       = $version;
				$this->base_api_path = $base_api_path;
			}
		};
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
	 * The `token` query param of a signed outbound request.
	 *
	 * @param string $url Request URL.
	 * @return string
	 */
	private function get_token( $url ) {
		parse_str( (string) wp_parse_url( $url, PHP_URL_QUERY ), $query );

		return (string) ( $query['token'] ?? '' );
	}
}
