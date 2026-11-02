<?php
/**
 * Tests for the WPCOM_REST_API_Proxy_Request trait.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Connection\Traits\WPCOM_REST_API_Proxy_Request;
use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversTrait;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_REST_Request;

/**
 * Drives the trait through a bare host object, down to the HTTP layer.
 *
 * @covers \Automattic\Jetpack\Connection\Traits\WPCOM_REST_API_Proxy_Request
 */
#[CoversTrait( WPCOM_REST_API_Proxy_Request::class )]
class WPCOM_REST_API_Proxy_Request_Test extends BaseTestCase {

	const BLOG_ID = 4242;

	/**
	 * Object using the trait, configured like a v1.1 `publicize/connections` controller.
	 *
	 * @var object
	 */
	private $host;

	/**
	 * Outbound requests seen by the HTTP stub, as `url` and `args` pairs.
	 *
	 * @var array<int, array{url: string, args: array}>
	 */
	private $http_calls = array();

	/**
	 * Set up a connected site, an HTTP stub and the host.
	 */
	public function set_up() {
		parent::set_up();

		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		\Jetpack_Options::update_option( 'id', self::BLOG_ID );
		\Jetpack_Options::update_option( 'blog_token', 'blog_token.secret' );
		( new Manager() )->reset_connection_status();
		$_SERVER['REMOTE_ADDR'] = '203.0.113.9';

		$this->http_calls = array();
		add_filter( 'pre_http_request', array( $this, 'stub_http_request' ), 10, 3 );

		$this->host = new class() {
			use WPCOM_REST_API_Proxy_Request;

			/**
			 * Constructor.
			 */
			public function __construct() {
				$this->rest_base     = 'publicize/connections';
				$this->version       = '1.1';
				$this->base_api_path = 'rest';
			}
		};
	}

	/**
	 * Clean up after tests.
	 */
	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'stub_http_request' ), 10 );

		\Jetpack_Options::delete_option( 'blog_token' );
		\Jetpack_Options::delete_option( 'id' );
		( new Manager() )->reset_connection_status();
		Constants::clear_single_constant( 'JETPACK__WPCOM_JSON_API_BASE' );
		unset( $_SERVER['REMOTE_ADDR'] );

		parent::tear_down();
	}

	/**
	 * Records the outbound request and answers with a 200.
	 *
	 * @param mixed  $pre  Short-circuit value.
	 * @param array  $args Request args.
	 * @param string $url  Request URL.
	 * @return array
	 */
	public function stub_http_request( $pre, $args, $url ) {
		$this->http_calls[] = array(
			'url'  => $url,
			'args' => $args,
		);

		return array(
			'response' => array( 'code' => 200 ),
			'body'     => '{"id":12}',
			'headers'  => array(),
		);
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

		$result = $this->host->proxy_request_to_wpcom_as_blog( $request, '12' );

		$this->assertSame( array( 'id' => 12 ), $result );
		$call = $this->http_calls[0];
		$this->assertSame( '/rest/v1.1/sites/4242/publicize/connections/12', wp_parse_url( $call['url'], PHP_URL_PATH ) );
		$this->assertSame( array( 'fields' => 'id,shared' ), $this->get_forwarded_query( $call['url'] ) );
		$this->assertSame( 'POST', $call['args']['method'] );
		$this->assertSame( '{"shared":true}', $call['args']['body'] );
		$this->assertSame( '203.0.113.9', $call['args']['headers']['X-Forwarded-For'] );
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
	 * @param array $query    Query params on the incoming request.
	 * @param array $expected Query params on the outbound request.
	 */
	#[DataProvider( 'data_queries' )]
	public function test_a_query_param_reaches_wordpress_com_as_written_or_not_at_all( array $query, array $expected ) {
		$request = new WP_REST_Request( 'GET', '/wpcom/v2/publicize/connections' );
		$request->set_query_params( $query );

		$this->host->proxy_request_to_wpcom_as_blog( $request );

		$this->assertSame( $expected, $this->get_forwarded_query( $this->http_calls[0]['url'] ) );
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
}
