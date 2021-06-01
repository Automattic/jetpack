<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\IdentityCrisis;

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Connection\REST_Connector;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Identity_Crisis;
use Jetpack_options;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Unit tests for the REST API endpoints.
 *
 * @package automattic/jetpack-identity-crisis
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

		Identity_Crisis::init();

		do_action( 'rest_api_init' );
		new REST_Connector( new Manager() );

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

		Constants::$set_constants['JETPACK__WPCOM_JSON_API_BASE'] = $this->api_host_original;

		delete_transient( 'jetpack_assumed_site_creation_date' );

		WorDBless_Options::init()->clear_options();
	}

	/**
	 * Testing the `/jetpack/v4/identity-crisis/confirm-safe-mode` endpoint.
	 */
	public function test_confirm_safe_mode() {
		add_filter( 'pre_http_request', array( $this, 'intercept_auth_token_request' ), 10, 3 );

		Jetpack_Options::update_option( 'safe_mode_confirmed', false );

		$user = wp_get_current_user();
		$user->add_cap( 'jetpack_disconnect' );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/identity-crisis/confirm-safe-mode' );
		$request->set_header( 'Content-Type', 'application/json' );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$user->remove_cap( 'jetpack_disconnect' );

		remove_filter( 'pre_http_request', array( $this, 'intercept_auth_token_request' ) );
		remove_filter( 'jetpack_options', array( $this, 'mock_jetpack_site_connection_options' ) );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( 'success', $data['code'] );
		$this->assertTrue( Jetpack_Options::get_option( 'safe_mode_confirmed' ) );
	}

	/**
	 * Testing the `/jetpack/v4/identity-crisis/confirm-safe-mode` endpoint.
	 */
	public function test_confirm_safe_mode_no_access() {
		add_filter( 'pre_http_request', array( $this, 'intercept_auth_token_request' ), 10, 3 );

		Jetpack_Options::update_option( 'safe_mode_confirmed', false );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/identity-crisis/confirm-safe-mode' );
		$request->set_header( 'Content-Type', 'application/json' );

		$response = $this->server->dispatch( $request );

		remove_filter( 'pre_http_request', array( $this, 'intercept_auth_token_request' ) );
		remove_filter( 'jetpack_options', array( $this, 'mock_jetpack_site_connection_options' ) );

		$this->assertEquals( 401, $response->get_status() );
		$this->assertFalse( Jetpack_Options::get_option( 'safe_mode_confirmed' ) );
	}

	/**
	 * Testing the `/jetpack/v4/identity-crisis/migrate` endpoint.
	 */
	public function test_migrate_stats_and_subscribers() {
		add_filter( 'pre_http_request', array( $this, 'intercept_auth_token_request' ), 10, 3 );

		Jetpack_Options::update_option( 'sync_error_idc', true );
		Jetpack_Options::update_option( 'migrate_for_idc', false );

		$user = wp_get_current_user();
		$user->add_cap( 'jetpack_disconnect' );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/identity-crisis/migrate' );
		$request->set_header( 'Content-Type', 'application/json' );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$user->remove_cap( 'jetpack_disconnect' );

		remove_filter( 'pre_http_request', array( $this, 'intercept_auth_token_request' ) );
		remove_filter( 'jetpack_options', array( $this, 'mock_jetpack_site_connection_options' ) );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( 'success', $data['code'] );
		$this->assertFalse( Jetpack_Options::get_option( 'sync_error_idc' ) );
		$this->assertTrue( Jetpack_Options::get_option( 'migrate_for_idc' ) );
	}

	/**
	 * Testing the `/jetpack/v4/identity-crisis/migrate` endpoint.
	 */
	public function test_migrate_stats_and_subscribers_no_access() {
		add_filter( 'pre_http_request', array( $this, 'intercept_auth_token_request' ), 10, 3 );

		Jetpack_Options::update_option( 'sync_error_idc', true );
		Jetpack_Options::update_option( 'migrate_for_idc', false );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/identity-crisis/migrate' );
		$request->set_header( 'Content-Type', 'application/json' );

		$response = $this->server->dispatch( $request );

		remove_filter( 'pre_http_request', array( $this, 'intercept_auth_token_request' ) );
		remove_filter( 'jetpack_options', array( $this, 'mock_jetpack_site_connection_options' ) );

		$this->assertEquals( 401, $response->get_status() );
		$this->assertFalse( Jetpack_Options::get_option( 'safe_mode_confirmed' ) );
		$this->assertTrue( Jetpack_Options::get_option( 'sync_error_idc' ) );
		$this->assertFalse( Jetpack_Options::get_option( 'migrate_for_idc' ) );
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
	 * Site level / user-less connection set-up.
	 *
	 * @param mixed  $value The current option value.
	 * @param string $name Option name.
	 *
	 * @return mixed
	 */
	public function mock_jetpack_site_connection_options( $value, $name ) {
		switch ( $name ) {
			case 'blog_token':
				return self::BLOG_TOKEN;
			case 'id':
				return self::BLOG_ID;
		}

		return $value;
	}

	/**
	 * Intercept the `Jetpack_Options` call and mock the values.
	 * Full connection set-up.
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
			case 'master_user':
				return self::USER_ID;
			case 'user_tokens':
				return array(
					self::USER_ID => 'new.usertoken.' . self::USER_ID,
				);
		}

		return $value;
	}

}
