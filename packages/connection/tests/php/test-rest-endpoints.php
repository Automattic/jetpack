<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Connection;

require_once ABSPATH . WPINC . '/class-IXR.php';

use Automattic\Jetpack\Connection\Plugin as Connection_Plugin;
use Automattic\Jetpack\Connection\Plugin_Storage as Connection_Plugin_Storage;
use Automattic\Jetpack\Constants;
use phpmock\MockBuilder;
use PHPUnit\Framework\TestCase;
use WP_REST_Request;
use WP_REST_Server;
use Requests_Utility_CaseInsensitiveDictionary;

/**
 * Unit tests for the REST API endpoints.
 *
 * @package automattic/jetpack-connection
 * @see \Automattic\Jetpack\Connection\REST_Connector
 */
class Test_REST_Endpoints extends TestCase {

	const BLOG_TOKEN = 'new.blogtoken';

	/**
	 * REST Server object.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * The original hostname to restore after tests are finished.
	 *
	 * @var string
	 */
	private $api_host_original;

	/**
	 * Setting up the test.
	 */
	public function setUp() {
		parent::setUp();

		global $wp_rest_server;

		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		do_action( 'rest_api_init' );
		new REST_Connector( new Manager() );

		add_action( 'jetpack_disabled_raw_options', array( $this, 'bypass_raw_options' ) );

		$user = wp_get_current_user();
		$user->add_cap( 'jetpack_reconnect' );

		$this->api_host_original                                  = Constants::get_constant( 'JETPACK__WPCOM_JSON_API_HOST' );
		Constants::$set_constants['JETPACK__WPCOM_JSON_API_HOST'] = 'public-api.wordpress.com';

		set_transient( 'jetpack_assumed_site_creation_date', '2020-02-28 01:13:27' );
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown() {
		parent::tearDown();

		remove_action( 'jetpack_disabled_raw_options', array( $this, 'bypass_raw_options' ) );

		$user = wp_get_current_user();
		$user->remove_cap( 'jetpack_reconnect' );

		Constants::$set_constants['JETPACK__WPCOM_JSON_API_HOST'] = $this->api_host_original;

		delete_transient( 'jetpack_assumed_site_creation_date' );
	}

	/**
	 * Testing the `/jetpack/v4/remote_authorize` endpoint.
	 */
	public function test_remote_authorize() {
		$this->request = new WP_REST_Request( 'POST', '/jetpack/v4/remote_authorize' );
		$this->request->set_header( 'Content-Type', 'application/json' );
		$this->request->set_body( '{ "state": 111, "secret": "12345", "redirect_uri": "https://example.org", "code": "54321" }' );

		$response = $this->server->dispatch( $this->request );
		$data     = $response->get_data();

		$this->assertEquals( 404, $data['code'] );
		$this->assertContains( '[user_unknown]', $data['message'] );
	}

	/**
	 * Testing the `/jetpack/v4/connection` endpoint.
	 */
	public function test_connection() {
		$builder = new MockBuilder();
		$builder->setNamespace( 'Automattic\Jetpack' )
				->setName( 'apply_filters' )
				->setFunction(
					function( $hook, $value ) {
						return 'jetpack_offline_mode' === $hook ? true : $value;
					}
				);

		$mock = $builder->build();
		$mock->enable();

		$this->request = new WP_REST_Request( 'GET', '/jetpack/v4/connection' );

		$response = $this->server->dispatch( $this->request );
		$data     = $response->get_data();

		$this->assertFalse( $data['isActive'] );
		$this->assertFalse( $data['isRegistered'] );
		$this->assertTrue( $data['offlineMode']['isActive'] );
	}

	/**
	 * Testing the `/jetpack/v4/connection/plugins` endpoint.
	 */
	public function test_connection_plugins() {
		$user = wp_get_current_user();
		$user->add_cap( 'activate_plugins' );

		$plugins = array(
			array(
				'name' => 'Plugin Name 1',
				'slug' => 'plugin-slug-1',
			),
			array(
				'name' => 'Plugin Name 2',
				'slug' => 'plugin-slug-2',
			),
		);

		array_walk(
			$plugins,
			function( $plugin ) {
				( new Connection_Plugin( $plugin['slug'] ) )->add( $plugin['name'] );
			}
		);

		Connection_Plugin_Storage::configure();

		$this->request = new WP_REST_Request( 'GET', '/jetpack/v4/connection/plugins' );

		$response = $this->server->dispatch( $this->request );

		$this->assertEquals( $plugins, $response->get_data() );

		$user->remove_cap( 'activate_plugins' );
	}

	/**
	 * Testing the `connection/reconnect` endpoint, full reconnect.
	 */
	public function test_connection_reconnect_full() {
		$this->setup_reconnect_test( null );
		add_filter( 'pre_http_request', array( $this, 'intercept_register_request' ), 10, 3 );

		$response = $this->server->dispatch( $this->build_reconnect_request() );
		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertEquals( 'in_progress', $data['status'] );
		$this->assertSame( 0, strpos( $data['authorizeUrl'], 'https://jetpack.wordpress.com/jetpack.authorize/1' ) );

		remove_filter( 'pre_http_request', array( $this, 'intercept_register_request' ), 10 );
		$this->shutdown_reconnect_test( null );
	}

	/**
	 * Testing the `connection/reconnect` endpoint, successful partial reconnect (blog token).
	 */
	public function test_connection_reconnect_partial_blog_token_success() {
		$this->setup_reconnect_test( 'blog_token' );
		add_filter( 'pre_http_request', array( $this, 'intercept_refresh_blog_token_request' ), 10, 3 );

		$response = $this->server->dispatch( $this->build_reconnect_request() );
		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertEquals( 'completed', $data['status'] );

		remove_filter( 'pre_http_request', array( $this, 'intercept_refresh_blog_token_request' ), 10 );
		$this->shutdown_reconnect_test( 'blog_token' );
	}

	/**
	 * Testing the `connection/reconnect` endpoint, failed partial reconnect (blog token).
	 */
	public function test_connection_reconnect_partial_blog_token_fail() {
		$this->setup_reconnect_test( 'blog_token' );
		add_filter( 'pre_http_request', array( $this, 'intercept_refresh_blog_token_request_fail' ), 10, 3 );

		$response = $this->server->dispatch( $this->build_reconnect_request() );
		$this->assertEquals( 500, $response->get_status() );

		$data = $response->get_data();
		$this->assertEquals( 'jetpack_secret', $data['code'] );

		remove_filter( 'pre_http_request', array( $this, 'intercept_refresh_blog_token_request_fail' ), 10 );
		$this->shutdown_reconnect_test( 'blog_token' );
	}

	/**
	 * Testing the `connection/reconnect` endpoint, successful partial reconnect (user token).
	 */
	public function test_connection_reconnect_partial_user_token_success() {
		$this->setup_reconnect_test( 'user_token' );

		$response = $this->server->dispatch( $this->build_reconnect_request() );
		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertEquals( 'in_progress', $data['status'] );
		$this->assertSame( 0, strpos( $data['authorizeUrl'], 'https://jetpack.wordpress.com/jetpack.authorize/1' ) );

		$this->shutdown_reconnect_test( 'user_token' );
	}

	/**
	 * This filter callback allow us to skip the database query by `Jetpack_Options` to retrieve the option.
	 *
	 * @param array $options List of options already skipping the database request.
	 *
	 * @return array
	 */
	public function bypass_raw_options( array $options ) {
		$options[ Manager::SECRETS_OPTION_NAME ] = true;

		return $options;
	}

	/**
	 * Intercept the `jetpack.register` API request sent to WP.com, and mock the response.
	 *
	 * @param bool|array $response The existing response.
	 * @param array      $args The request arguments.
	 * @param string     $url The request URL.
	 *
	 * @return array
	 */
	public function intercept_register_request( $response, $args, $url ) {
		if ( false === strpos( $url, 'jetpack.register' ) ) {
			return $response;
		}

		return array(
			'headers'  => new Requests_Utility_CaseInsensitiveDictionary( array( 'content-type' => 'application/json' ) ),
			'body'     => wp_json_encode(
				array(
					'jetpack_id'     => '12345',
					'jetpack_secret' => 'sample_secret',
				)
			),
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
		);
	}

	/**
	 * Intercept the `jetpack-token-health` API request sent to WP.com, and mock the "invalid blog token" response.
	 *
	 * @param bool|array $response The existing response.
	 * @param array      $args The request arguments.
	 * @param string     $url The request URL.
	 *
	 * @return array
	 */
	public function intercept_validate_tokens_request_invalid_blog_token( $response, $args, $url ) {
		if ( false === strpos( $url, 'jetpack-token-health' ) ) {
			return $response;
		}

		return $this->build_validate_tokens_response( 'blog_token' );
	}

	/**
	 * Intercept the `jetpack-token-health` API request sent to WP.com, and mock the "invalid user token" response.
	 *
	 * @param bool|array $response The existing response.
	 * @param array      $args The request arguments.
	 * @param string     $url The request URL.
	 *
	 * @return array
	 */
	public function intercept_validate_tokens_request_invalid_user_token( $response, $args, $url ) {
		if ( false === strpos( $url, 'jetpack-token-health' ) ) {
			return $response;
		}

		return $this->build_validate_tokens_response( 'user_token' );
	}

	/**
	 * Intercept the `jetpack-token-health` API request sent to WP.com, and mock the "valid tokens" response.
	 *
	 * @param bool|array $response The existing response.
	 * @param array      $args The request arguments.
	 * @param string     $url The request URL.
	 *
	 * @return array
	 */
	public function intercept_validate_tokens_request_valid_tokens( $response, $args, $url ) {
		if ( false === strpos( $url, 'jetpack-token-health' ) ) {
			return $response;
		}

		return $this->build_validate_tokens_response( null );
	}

	/**
	 * Build the response for a tokens validation request
	 *
	 * @param string $invalid_token Accepted values: 'blog_token', 'user_token'.
	 *
	 * @return array
	 */
	private function build_validate_tokens_response( $invalid_token ) {
		$body = array(
			'blog_token' => array(
				'is_healthy' => true,
			),
			'user_token' => array(
				'is_healthy'     => true,
				'is_master_user' => true,
			),
		);

		switch ( $invalid_token ) {
			case 'blog_token':
				$body['blog_token'] = array(
					'is_healthy' => false,
					'code'       => 'unknown_token',
				);
				break;
			case 'user_token':
				$body['user_token'] = array(
					'is_healthy' => false,
					'code'       => 'unknown_token',
				);
				break;
		}

		return array(
			'headers'  => new Requests_Utility_CaseInsensitiveDictionary( array( 'content-type' => 'application/json' ) ),
			'body'     => wp_json_encode( $body ),
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
		);
	}

	/**
	 * Intercept the `jetpack-refresh-blog-token` API request sent to WP.com, and mock the success response.
	 *
	 * @param bool|array $response The existing response.
	 * @param array      $args The request arguments.
	 * @param string     $url The request URL.
	 *
	 * @return array
	 */
	public function intercept_refresh_blog_token_request( $response, $args, $url ) {
		if ( false === strpos( $url, 'jetpack-refresh-blog-token' ) ) {
			return $response;
		}

		return array(
			'headers'  => new Requests_Utility_CaseInsensitiveDictionary( array( 'content-type' => 'application/json' ) ),
			'body'     => wp_json_encode( array( 'jetpack_secret' => self::BLOG_TOKEN ) ),
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
		);
	}

	/**
	 * Intercept the `jetpack-refresh-blog-token` API request sent to WP.com, and mock the failure response.
	 *
	 * @param bool|array $response The existing response.
	 * @param array      $args The request arguments.
	 * @param string     $url The request URL.
	 *
	 * @return array
	 */
	public function intercept_refresh_blog_token_request_fail( $response, $args, $url ) {
		if ( false === strpos( $url, 'jetpack-refresh-blog-token' ) ) {
			return $response;
		}

		return array(
			'headers'  => new Requests_Utility_CaseInsensitiveDictionary( array( 'content-type' => 'application/json' ) ),
			'body'     => wp_json_encode( array( 'jetpack_secret_missing' => true ) ), // Meaningless body.
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
		);
	}

	/**
	 * Intercept the `Jetpack_Options` call to get `blog_id`, and set a random value.
	 *
	 * @param mixed  $value The current option value.
	 * @param string $name Option name.
	 *
	 * @return int
	 */
	public function mock_blog_id( $value, $name ) {
		if ( 'id' !== $name ) {
			return $value;
		}

		return 42;
	}

	/**
	 * Intercept the `Jetpack_Options` call to get `user_tokens`, and set a mock value.
	 *
	 * @param mixed  $value The current option value.
	 * @param string $name Option name.
	 *
	 * @return int
	 */
	public function mock_access_tokens( $value, $name ) {
		if ( 'blog_token' !== $name ) {
			return $value;
		}

		return self::BLOG_TOKEN;
	}

	/**
	 * Build the `connection/reconnect` request object.
	 *
	 * @return WP_REST_Request
	 */
	private function build_reconnect_request() {
		$this->request = new WP_REST_Request( 'POST', '/jetpack/v4/connection/reconnect' );
		$this->request->set_header( 'Content-Type', 'application/json' );
		$this->request->set_body( wp_json_encode( array( 'action' => 'reconnect' ) ) );

		return $this->request;
	}

	/**
	 * Setup the environment to test the reconnection process.
	 *
	 * @param string|null $invalid_token The invalid token to be returned in the response. Null if the tokens should be valid.
	 */
	private function setup_reconnect_test( $invalid_token ) {
		switch ( $invalid_token ) {
			case 'blog_token':
				add_filter(
					'pre_http_request',
					array(
						$this,
						'intercept_validate_tokens_request_invalid_blog_token',
					),
					10,
					3
				);
				break;
			case 'user_token':
				add_filter(
					'pre_http_request',
					array(
						$this,
						'intercept_validate_tokens_request_invalid_user_token',
					),
					10,
					3
				);
				break;
			case null:
				add_filter(
					'pre_http_request',
					array(
						$this,
						'intercept_validate_tokens_request_valid_tokens',
					),
					10,
					3
				);
				break;
		}

		add_filter( 'jetpack_options', array( $this, 'mock_access_tokens' ), 10, 2 );
		add_filter( 'jetpack_options', array( $this, 'mock_blog_id' ), 10, 2 );
	}

	/**
	 * Restore the environment after the `reconnect` test has been run.
	 *
	 * @param string|null $invalid_token The invalid token to be returned in the response. Null if the tokens should be valid.
	 */
	private function shutdown_reconnect_test( $invalid_token ) {
		switch ( $invalid_token ) {
			case 'blog_token':
				remove_filter(
					'pre_http_request',
					array(
						$this,
						'intercept_validate_tokens_request_invalid_blog_token',
					),
					10
				);
				break;
			case 'user_token':
				remove_filter(
					'pre_http_request',
					array(
						$this,
						'intercept_validate_tokens_request_invalid_user_token',
					),
					10
				);
				break;
			case null:
				remove_filter(
					'pre_http_request',
					array(
						$this,
						'intercept_validate_tokens_request_valid_tokens',
					),
					10
				);
				break;
		}

		remove_filter( 'jetpack_options', array( $this, 'mock_blog_id' ), 10 );
		remove_filter( 'jetpack_options', array( $this, 'mock_access_tokens' ), 10 );
		remove_filter( 'pre_http_request', array( $this, 'intercept_validate_tokens_request' ), 10 );
	}

}
