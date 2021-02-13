<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Connection\Plugin as Connection_Plugin;
use Automattic\Jetpack\Connection\Plugin_Storage as Connection_Plugin_Storage;
use Automattic\Jetpack\Constants;
use PHPUnit\Framework\TestCase;
use Requests_Utility_CaseInsensitiveDictionary;
use WorDBless\Options as WorDBless_Options;
use WP_REST_Request;
use WP_REST_Server;
use WP_User;

/**
 * Unit tests for the REST API endpoints.
 *
 * @package automattic/jetpack-connection
 * @see \Automattic\Jetpack\Connection\REST_Connector
 */
class Test_REST_Endpoints extends TestCase {

	const BLOG_TOKEN = 'new.blogtoken';
	const BLOG_ID    = 42;
	const USER_ID    = 111;

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
	 *
	 * @before
	 */
	public function set_up() {
		global $wp_rest_server;

		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		do_action( 'rest_api_init' );
		new REST_Connector( new Manager() );

		add_action( 'jetpack_disabled_raw_options', array( $this, 'bypass_raw_options' ) );

		$user = wp_get_current_user();
		$user->add_cap( 'jetpack_reconnect' );

		$this->api_host_original                                  = Constants::get_constant( 'JETPACK__WPCOM_JSON_API_BASE' );
		Constants::$set_constants['JETPACK__WPCOM_JSON_API_BASE'] = 'https://public-api.wordpress.com';

		Constants::$set_constants['JETPACK__API_BASE'] = 'https://jetpack.wordpress.com/jetpack.';

		set_transient( 'jetpack_assumed_site_creation_date', '2020-02-28 01:13:27' );
	}

	/**
	 * Returning the environment into its initial state.
	 *
	 * @after
	 */
	public function tear_down() {
		remove_action( 'jetpack_disabled_raw_options', array( $this, 'bypass_raw_options' ) );

		$user = wp_get_current_user();
		$user->remove_cap( 'jetpack_reconnect' );

		Constants::$set_constants['JETPACK__WPCOM_JSON_API_BASE'] = $this->api_host_original;

		delete_transient( 'jetpack_assumed_site_creation_date' );

		WorDBless_Options::init()->clear_options();
	}

	/**
	 * Testing the `/jetpack/v4/remote_authorize` endpoint.
	 */
	public function test_remote_authorize() {
		add_filter( 'jetpack_options', array( $this, 'mock_jetpack_options' ), 10, 2 );
		add_filter( 'pre_http_request', array( $this, 'intercept_auth_token_request' ), 10, 3 );

		wp_cache_set(
			self::USER_ID,
			(object) array(
				'ID'         => self::USER_ID,
				'user_email' => 'sample@example.org',
			),
			'users'
		);

		$secret_1 = 'Az0g39toGWlYiTJ4NnDuAz0g39toGWlY';

		$secrets = array(
			'jetpack_authorize_' . self::USER_ID => array(
				'secret_1' => $secret_1,
				'secret_2' => 'zfIFcym2Jlzd8AVgzfIFcym2Jlzd8AVg',
				'exp'      => time() + 60,
			),
		);

		// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$options_filter = function ( $value ) use ( $secrets ) {
			return $secrets;
		};
		add_filter( 'pre_option_' . Secrets::LEGACY_SECRETS_OPTION_NAME, $options_filter );

		$user_caps_filter = function ( $allcaps, $caps, $args, $user ) {
			if ( $user instanceof WP_User && self::USER_ID === $user->ID ) {
				$allcaps['manage_options'] = true;
				$allcaps['administrator']  = true;
			}

			return $allcaps;
		};
		add_filter( 'user_has_cap', $user_caps_filter, 10, 4 );

		$this->request = new WP_REST_Request( 'POST', '/jetpack/v4/remote_authorize' );
		$this->request->set_header( 'Content-Type', 'application/json' );
		$this->request->set_body( '{ "state": "' . self::USER_ID . '", "secret": "' . $secret_1 . '", "redirect_uri": "https://example.org", "code": "54321" }' );

		$response = $this->server->dispatch( $this->request );
		$data     = $response->get_data();

		remove_filter( 'user_has_cap', $user_caps_filter );
		remove_filter( 'pre_option_' . Secrets::LEGACY_SECRETS_OPTION_NAME, $options_filter );
		remove_filter( 'pre_http_request', array( $this, 'intercept_auth_token_request' ) );
		remove_filter( 'jetpack_options', array( $this, 'mock_jetpack_options' ) );

		wp_cache_delete( self::USER_ID, 'users' );

		wp_set_current_user( 0 );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( 'authorized', $data['result'] );
	}

	/**
	 * Testing the `/jetpack/v4/connection` endpoint.
	 */
	public function test_connection() {
		add_filter( 'jetpack_offline_mode', '__return_true' );
		try {
			$this->request = new WP_REST_Request( 'GET', '/jetpack/v4/connection' );

			$response = $this->server->dispatch( $this->request );
			$data     = $response->get_data();

			$this->assertFalse( $data['isActive'] );
			$this->assertFalse( $data['isRegistered'] );
			$this->assertTrue( $data['offlineMode']['isActive'] );
		} finally {
			remove_filter( 'jetpack_offline_mode', '__return_true' );
		}
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
			function ( $plugin ) {
				( new Connection_Plugin( $plugin['slug'] ) )->add( $plugin['name'] );
			}
		);

		Connection_Plugin_Storage::configure();

		$this->request = new WP_REST_Request( 'GET', '/jetpack/v4/connection/plugins' );

		$response = $this->server->dispatch( $this->request );

		$user->remove_cap( 'activate_plugins' );

		$this->assertEquals( $plugins, $response->get_data() );
	}

	/**
	 * Testing the `connection/reconnect` endpoint, full reconnect.
	 */
	public function test_connection_reconnect_full() {
		$this->setup_reconnect_test( null );
		add_filter( 'jetpack_connection_disconnect_site_wpcom', '__return_false' );
		add_filter( 'pre_http_request', array( $this, 'intercept_register_request' ), 10, 3 );

		$response = $this->server->dispatch( $this->build_reconnect_request() );
		$data     = $response->get_data();

		remove_filter( 'pre_http_request', array( $this, 'intercept_register_request' ), 10 );
		remove_filter( 'jetpack_connection_disconnect_site_wpcom', '__return_false' );
		$this->shutdown_reconnect_test( null );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( 'in_progress', $data['status'] );
		$this->assertSame( 0, strpos( $data['authorizeUrl'], 'https://jetpack.wordpress.com/jetpack.authorize/' ) );
	}

	/**
	 * Testing the `connection/reconnect` endpoint, successful partial reconnect (blog token).
	 */
	public function test_connection_reconnect_partial_blog_token_success() {
		$this->setup_reconnect_test( 'blog_token' );
		add_filter( 'pre_http_request', array( $this, 'intercept_refresh_blog_token_request' ), 10, 3 );

		$response = $this->server->dispatch( $this->build_reconnect_request() );
		$data     = $response->get_data();

		remove_filter( 'pre_http_request', array( $this, 'intercept_refresh_blog_token_request' ), 10 );
		$this->shutdown_reconnect_test( 'blog_token' );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( 'completed', $data['status'] );
	}

	/**
	 * Testing the `connection/reconnect` endpoint, failed partial reconnect (blog token).
	 */
	public function test_connection_reconnect_partial_blog_token_fail() {
		$this->setup_reconnect_test( 'blog_token' );
		add_filter( 'pre_http_request', array( $this, 'intercept_refresh_blog_token_request_fail' ), 10, 3 );

		$response = $this->server->dispatch( $this->build_reconnect_request() );
		$data     = $response->get_data();

		remove_filter( 'pre_http_request', array( $this, 'intercept_refresh_blog_token_request_fail' ), 10 );
		$this->shutdown_reconnect_test( 'blog_token' );

		$this->assertEquals( 500, $response->get_status() );
		$this->assertEquals( 'jetpack_secret', $data['code'] );
	}

	/**
	 * Testing the `connection/reconnect` endpoint, successful partial reconnect (user token).
	 */
	public function test_connection_reconnect_partial_user_token_success() {
		$this->setup_reconnect_test( 'user_token' );

		$response = $this->server->dispatch( $this->build_reconnect_request() );
		$data     = $response->get_data();

		$this->shutdown_reconnect_test( 'user_token' );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( 'in_progress', $data['status'] );
		$this->assertSame( 0, strpos( $data['authorizeUrl'], 'https://jetpack.wordpress.com/jetpack.authorize/' ) );
	}

	/**
	 * This filter callback allow us to skip the database query by `Jetpack_Options` to retrieve the option.
	 *
	 * @param array $options List of options already skipping the database request.
	 *
	 * @return array
	 */
	public function bypass_raw_options( array $options ) {
		$options[ Secrets::LEGACY_SECRETS_OPTION_NAME ] = true;

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
	 * Intercept the `jetpack-token-health` API request sent to WP.com, and mock the "invalid blog token" response.
	 *
	 * @param bool|array $response The existing response.
	 * @param array      $args The request arguments.
	 * @param string     $url The request URL.
	 *
	 * @return array
	 */
	public function intercept_auth_token_request( $response, $args, $url ) {
		if ( false === strpos( $url, '/jetpack.token/' ) ) {
			return $response;
		}

		return array(
			'headers'  => new Requests_Utility_CaseInsensitiveDictionary( array( 'content-type' => 'application/json' ) ),
			'body'     => wp_json_encode(
				array(
					'access_token' => 'mock.token',
					'token_type'   => 'X_JETPACK',
					'scope'        => ( new Manager() )->sign_role( 'administrator' ),
				)
			),
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
		);
	}

	/**
	 * Intercept the `Jetpack_Options` call and mock the values.
	 *
	 * @param mixed  $value The current option value.
	 * @param string $name Option name.
	 *
	 * @return mixed
	 */
	public function mock_jetpack_options( $value, $name ) {
		switch ( $name ) {
			case 'blog_token':
				return self::BLOG_TOKEN;
			case 'id':
				return self::BLOG_ID;
		}

		return $value;
	}

	/**
	 * Build the `connection/reconnect` request object.
	 *
	 * @return WP_REST_Request
	 */
	private function build_reconnect_request() {
		$this->request = new WP_REST_Request( 'POST', '/jetpack/v4/connection/reconnect' );
		$this->request->set_header( 'Content-Type', 'application/json' );

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

		add_filter( 'jetpack_options', array( $this, 'mock_jetpack_options' ), 10, 2 );
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

		remove_filter( 'jetpack_options', array( $this, 'mock_jetpack_options' ), 10 );
		remove_filter( 'pre_http_request', array( $this, 'intercept_validate_tokens_request' ), 10 );
	}

}
