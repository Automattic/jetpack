<?php
/**
 * Tests for the Monetize dashboard's WordPress.com forwarding routes.
 *
 * @package automattic/jetpack-monetize
 */

namespace Automattic\Jetpack\Monetize;

use Automattic\Jetpack\Connection\Utils as Connection_Utils;
use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_REST_Request;
use WP_REST_Server;

/**
 * @covers \Automattic\Jetpack\Monetize\WPCOM_Proxy
 * @covers \Automattic\Jetpack\Monetize\Dashboard
 */
#[CoversClass( WPCOM_Proxy::class )]
#[CoversClass( Dashboard::class )]
class WPCOM_Proxy_Test extends BaseTestCase {

	const BLOG_ID = 999;

	/**
	 * Requests sent to WordPress.com, as URL, method and body.
	 *
	 * @var array[]
	 */
	private $sent = array();

	/**
	 * Register the test routes on a fresh server, as a connected admin.
	 */
	public function set_up() {
		parent::set_up();
		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		$register       = static function () {
			WPCOM_Proxy::register_route( 'wpcom/v2', 'memberships/coupons', 'GET', array( 'type' => array( 'sanitize_callback' => 'sanitize_key' ) ) );
			WPCOM_Proxy::register_route( 'wpcom/v2', 'memberships/coupon/(?P<id>\d+)', 'DELETE', array( 'cancel_subscriptions' => array( 'type' => 'boolean' ) ) );
			WPCOM_Proxy::register_route( 'rest/v1.1', 'wordads/settings', 'POST', array( 'paypal' => array( 'sanitize_callback' => 'sanitize_email' ) ) );
		};
		add_action( 'rest_api_init', $register );
		do_action( 'rest_api_init', $wp_rest_server );
		remove_action( 'rest_api_init', $register );

		add_filter( 'jetpack_options', array( $this, 'mock_connection_options' ), 10, 2 );
		Connection_Utils::init_default_constants();
		wp_set_current_user( $this->insert_user( 'administrator' ) );
	}

	/**
	 * Undo the server, options and HTTP stubs.
	 */
	public function tear_down() {
		global $wp_rest_server;
		$wp_rest_server = null;
		remove_filter( 'jetpack_options', array( $this, 'mock_connection_options' ) );
		remove_all_filters( 'pre_http_request' );
		Constants::clear_constants();
		wp_set_current_user( 0 );
		$this->sent = array();
		parent::tear_down();
	}

	/**
	 * Requests to the local routes and the WordPress.com request each should send: declared args only, sanitized.
	 *
	 * @return array[]
	 */
	public static function provide_forwarded_requests() {
		return array(
			'v2 with a query'  => array(
				'GET',
				'/jetpack/v4/monetize/wpcom/v2/memberships/coupons',
				array(
					'type'    => 'All',
					'page'    => 2,
					'_locale' => 'user',
				),
				null,
				'GET',
				'/wpcom/v2/sites/999/memberships/coupons?type=all&_locale=user',
				null,
			),
			'v2 with an ID'    => array( 'DELETE', '/jetpack/v4/monetize/wpcom/v2/memberships/coupon/7', array( 'force' => 1 ), null, 'DELETE', '/wpcom/v2/sites/999/memberships/coupon/7', null ),
			'v2 DELETE body'   => array( 'DELETE', '/jetpack/v4/monetize/wpcom/v2/memberships/coupon/7', array(), '{"cancel_subscriptions":true}', 'DELETE', '/wpcom/v2/sites/999/memberships/coupon/7?cancel_subscriptions=1', null ),
			'v1.1 with a body' => array( 'POST', '/jetpack/v4/monetize/rest/v1.1/wordads/settings', array(), '{"paypal":"a@example.com<>","tos":"signed"}', 'POST', '/rest/v1.1/sites/999/wordads/settings', '{"paypal":"a@example.com"}' ),
		);
	}

	/**
	 * @dataProvider provide_forwarded_requests
	 *
	 * @param string      $method        Local request method.
	 * @param string      $route         Local route.
	 * @param array       $query         Local query params.
	 * @param string|null $body          Local JSON body.
	 * @param string      $sent_method   Expected upstream method.
	 * @param string      $sent_path     Expected upstream path and query, after the API host.
	 * @param string|null $sent_body     Expected upstream body.
	 */
	#[DataProvider( 'provide_forwarded_requests' )]
	public function test_routes_forward_to_the_same_path_on_wpcom( $method, $route, $query, $body, $sent_method, $sent_path, $sent_body ) {
		$this->arrange_wpcom( array( 'ok' => true ) );

		$response = $this->dispatch( $method, $route, $query, $body );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array( 'ok' => true ), $response->get_data() );
		$this->assertCount( 1, $this->sent );
		$this->assertStringEndsWith( $sent_path, $this->sent[0]['url'] );
		$this->assertSame( $sent_method, $this->sent[0]['method'] );
		$this->assertSame( $sent_body, $this->sent[0]['body'] );
	}

	/**
	 * Requests WordPress.com must never see, and the error each gets.
	 *
	 * @return array[]
	 */
	public static function provide_refused_requests() {
		return array(
			'not an admin'          => array( 'editor', true, 'rest_forbidden' ),
			'no WordPress.com user' => array( 'administrator', false, 'rest_unauthorized' ),
		);
	}

	/**
	 * @dataProvider provide_refused_requests
	 *
	 * @param string $role      The current user's role.
	 * @param bool   $connected Whether the user has a WordPress.com token.
	 * @param string $code      The expected error code.
	 */
	#[DataProvider( 'provide_refused_requests' )]
	public function test_routes_refuse_without_an_admin_connected_to_wpcom( $role, $connected, $code ) {
		$this->arrange_wpcom( array( 'ok' => true ) );
		$user_id = $this->insert_user( $role );
		wp_set_current_user( $user_id );
		if ( ! $connected ) {
			add_filter( 'jetpack_options', array( $this, 'drop_user_tokens' ), 20, 2 );
		}

		$response = $this->dispatch( 'GET', '/jetpack/v4/monetize/wpcom/v2/memberships/coupons' );
		remove_filter( 'jetpack_options', array( $this, 'drop_user_tokens' ), 20 );

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( $code, $response->get_data()['code'] );
		$this->assertCount( 0, $this->sent );
	}

	public function test_routes_relay_the_wpcom_error_status() {
		$this->arrange_wpcom(
			array(
				'code'    => 'no_subscribers',
				'message' => 'No subscribers.',
			),
			404
		);

		$response = $this->dispatch( 'GET', '/jetpack/v4/monetize/wpcom/v2/memberships/coupons' );

		$this->assertSame( 404, $response->get_status() );
		$this->assertSame( 'no_subscribers', $response->get_data()['code'] );
	}

	/**
	 * Send a request to the test server.
	 *
	 * @param string      $method HTTP method.
	 * @param string      $route  Route.
	 * @param array       $query  Query params.
	 * @param string|null $body   JSON body.
	 * @return \WP_REST_Response
	 */
	private function dispatch( $method, $route, array $query = array(), $body = null ) {
		$request = new WP_REST_Request( $method, $route );
		$request->set_query_params( $query );
		if ( null !== $body ) {
			$request->set_header( 'Content-Type', 'application/json' );
			$request->set_body( $body );
		}
		return rest_get_server()->dispatch( $request );
	}

	/**
	 * Answer every WordPress.com request with a fixed response, recording what was sent.
	 *
	 * @param array $body   Response body.
	 * @param int   $status Response status.
	 */
	private function arrange_wpcom( array $body, $status = 200 ) {
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $body, $status ) {
				$this->sent[] = array(
					// Drop the per-request signature the connection adds.
					'url'    => remove_query_arg( array( 'token', 'timestamp', 'nonce', 'body-hash', 'signature' ), (string) $url ),
					'method' => $args['method'],
					'body'   => $args['body'] ?? null,
				);
				return array(
					'headers'  => array(),
					'response' => array( 'code' => $status ),
					'body'     => wp_json_encode( $body, JSON_UNESCAPED_SLASHES ),
				);
			},
			10,
			3
		);
	}

	/**
	 * Add a user with a role.
	 *
	 * @param string $role Role.
	 * @return int User ID.
	 */
	private function insert_user( $role ) {
		return wp_insert_user(
			array(
				'user_login' => 'monetize-' . $role . '-' . wp_rand(),
				'user_pass'  => 'password',
				'role'       => $role,
			)
		);
	}

	/**
	 * Connection options for a connected site whose current user is connected.
	 *
	 * @param mixed  $value Option value.
	 * @param string $name  Option name.
	 * @return mixed
	 */
	public function mock_connection_options( $value, $name ) {
		switch ( $name ) {
			case 'blog_token':
				return 'test.blogtoken';
			case 'id':
				return (string) self::BLOG_ID;
			case 'user_tokens':
				$user_id = get_current_user_id();
				return $user_id ? array( $user_id => sprintf( 'token%d.secret%d.%d', $user_id, $user_id, $user_id ) ) : $value;
		}
		return $value;
	}

	/**
	 * Leave the current user without a WordPress.com token.
	 *
	 * @param mixed  $value Option value.
	 * @param string $name  Option name.
	 * @return mixed
	 */
	public function drop_user_tokens( $value, $name ) {
		return 'user_tokens' === $name ? array() : $value;
	}
}
