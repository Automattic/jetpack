<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\IdentityCrisis;

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;
use Automattic\Jetpack\Connection\REST_Connector;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Identity_Crisis;
use Jetpack_Options;
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

		$this->api_host_original = Constants::get_constant( 'JETPACK__WPCOM_JSON_API_BASE' );
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );

		Constants::set_constant( 'JETPACK__API_BASE', 'https://jetpack.wordpress.com/jetpack.' );

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
		$_GET = array();

		Connection_Rest_Authentication::init()->reset_saved_auth_state();
	}

	/**
	 * Testing the `/jetpack/v4/identity-crisis/confirm-safe-mode` endpoint.
	 */
	public function test_confirm_safe_mode() {

		Jetpack_Options::update_option( 'safe_mode_confirmed', false );

		$user = wp_get_current_user();
		$user->add_cap( 'jetpack_disconnect' );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/identity-crisis/confirm-safe-mode' );
		$request->set_header( 'Content-Type', 'application/json' );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$user->remove_cap( 'jetpack_disconnect' );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( 'success', $data['code'] );
		$this->assertTrue( Jetpack_Options::get_option( 'safe_mode_confirmed' ) );
	}

	/**
	 * Testing the `/jetpack/v4/identity-crisis/confirm-safe-mode` endpoint returns an error when user does not have permissions.
	 */
	public function test_confirm_safe_mode_no_access() {

		Jetpack_Options::update_option( 'safe_mode_confirmed', false );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/identity-crisis/confirm-safe-mode' );
		$request->set_header( 'Content-Type', 'application/json' );

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 401, $response->get_status() );
		$this->assertFalse( Jetpack_Options::get_option( 'safe_mode_confirmed' ) );
	}

	/**
	 * Testing the `/jetpack/v4/identity-crisis/migrate` endpoint.
	 */
	public function test_migrate_stats_and_subscribers() {

		Jetpack_Options::update_option( 'sync_error_idc', true );
		Jetpack_Options::update_option( 'migrate_for_idc', false );

		$user = wp_get_current_user();
		$user->add_cap( 'jetpack_disconnect' );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/identity-crisis/migrate' );
		$request->set_header( 'Content-Type', 'application/json' );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$user->remove_cap( 'jetpack_disconnect' );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( 'success', $data['code'] );
		$this->assertFalse( Jetpack_Options::get_option( 'sync_error_idc' ) );
		$this->assertTrue( Jetpack_Options::get_option( 'migrate_for_idc' ) );
	}

	/**
	 * Testing the `/jetpack/v4/identity-crisis/migrate` endpoint returns an error when user does not have permissions.
	 */
	public function test_migrate_stats_and_subscribers_no_access() {

		Jetpack_Options::update_option( 'sync_error_idc', true );
		Jetpack_Options::update_option( 'migrate_for_idc', false );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/identity-crisis/migrate' );
		$request->set_header( 'Content-Type', 'application/json' );

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 401, $response->get_status() );
		$this->assertFalse( Jetpack_Options::get_option( 'safe_mode_confirmed' ) );
		$this->assertTrue( Jetpack_Options::get_option( 'sync_error_idc' ) );
		$this->assertFalse( Jetpack_Options::get_option( 'migrate_for_idc' ) );
	}

	/**
	 * Testing the `/jetpack/v4/identity-crisis/start-fresh` endpoint returns an error when user does not have permissions.
	 */
	public function test_start_fresh_no_access() {

		$user = wp_get_current_user();
		$user->remove_cap( 'jetpack_disconnect' );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/identity-crisis/start-fresh' );
		$request->set_header( 'Content-Type', 'application/json' );

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 401, $response->get_status() );
	}

	/**
	 * Testing the GET method for the `/jetpack/v4/identity-crisis/url-secret` endpoint.
	 */
	public function test_fetch_url_secret() {
		$secret_data = array(
			'secret'     => 'asdf12345',
			'expires_at' => time() + URL_Secret::LIFESPAN,
		);
		Jetpack_Options::update_option( URL_Secret::OPTION_KEY, $secret_data );

		$this->set_blog_token_auth();

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/identity-crisis/url-secret' );
		$request->set_header( 'Content-Type', 'application/json' );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( $secret_data['secret'], $data['data']['secret'] );
		$this->assertEquals( $secret_data['expires_at'], $data['data']['expires_at'] );
	}

	/**
	 * Testing the `/jetpack/v4/identity-crisis/fetch` endpoint.
	 */
	public function test_fetch_url_secret_empty() {
		$this->set_blog_token_auth();

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/identity-crisis/url-secret' );
		$request->set_header( 'Content-Type', 'application/json' );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 500, $response->get_status() );
		$this->assertEquals( 'missing_url_secret', $data['code'] );
	}

	/**
	 * Testing the `/jetpack/v4/identity-crisis/fetch` endpoint returns an error when blog token authorization fails.
	 */
	public function test_fetch_url_secret_no_access() {
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/identity-crisis/url-secret' );
		$request->set_header( 'Content-Type', 'application/json' );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 401, $response->get_status() );
		$this->assertEquals( 'invalid_user_permission_identity_crisis', $data['code'] );
	}

	/**
	 * Testing the `/jetpack/v4/identity-crisis/compare-url-secret` endpoint.
	 */
	public function test_compare_url_secret_match() {
		$secret_data = array(
			'secret'     => 'asdf12345',
			'expires_at' => time() + URL_Secret::LIFESPAN,
		);
		Jetpack_Options::update_option( URL_Secret::OPTION_KEY, $secret_data );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/identity-crisis/compare-url-secret' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( array( 'secret' => $secret_data['secret'] ) ) );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 200, $response->get_status() );
		$this->assertTrue( $data['match'] );
	}

	/**
	 * Testing the `/jetpack/v4/identity-crisis/compare-url-secret` endpoint for non-matching secret.
	 */
	public function test_compare_url_secret_no_match() {
		$secret_data = array(
			'secret'     => 'asdf12345',
			'expires_at' => time() + URL_Secret::LIFESPAN,
		);
		Jetpack_Options::update_option( URL_Secret::OPTION_KEY, $secret_data );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/identity-crisis/compare-url-secret' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( array( 'secret' => '54321fdsa' ) ) );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 200, $response->get_status() );
		$this->assertFalse( $data['match'] );
	}

	/**
	 * Testing the `/jetpack/v4/identity-crisis/compare-url-secret` endpoint for non-matching secret.
	 */
	public function test_compare_url_secret_no_access() {
		Jetpack_Options::update_option( 'blog_token', 'new.blogtoken' );
		Jetpack_Options::update_option( 'id', 42 );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/identity-crisis/compare-url-secret' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( array( 'secret' => '54321fdsa' ) ) );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 403, $response->get_status() );
		$this->assertEquals( 'invalid_connection_status', $data['code'] );
	}

	/**
	 * Testing the `/jetpack/v4/identity-crisis/idc-url-validation` endpoint.
	 */
	public function test_request_url_validation_no_access() {
		Jetpack_Options::update_option( 'blog_token', 'new.blogtoken' );
		Jetpack_Options::update_option( 'id', 42 );

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/identity-crisis/idc-url-validation' );
		$request->set_header( 'Content-Type', 'application/json' );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 401, $response->get_status() );
		$this->assertEquals( 'invalid_user_permission_identity_crisis', $data['code'] );
	}

	/**
	 * Testing the `/jetpack/v4/identity-crisis/idc-url-validation` endpoint.
	 */
	public function test_request_url_validation_urls_and_secret() {
		$this->set_blog_token_auth();

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/identity-crisis/idc-url-validation' );
		$request->set_header( 'Content-Type', 'application/json' );

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
	}
	/**
	 * Mock blog token authorization for API requests.
	 *
	 * @return void
	 */
	private function set_blog_token_auth() {
		Jetpack_Options::update_option( 'blog_token', 'new.blogtoken' );
		Jetpack_Options::update_option( 'id', 42 );

		$token     = 'new:1:0';
		$timestamp = (string) time();
		$nonce     = 'testing123';
		$body_hash = '';

		wp_cache_set(
			1,
			(object) array(
				'ID'         => 1,
				'user_email' => 'sample@example.org',
			),
			'users'
		);

		$_SERVER['REQUEST_METHOD'] = 'POST';

		$_GET['_for']      = 'jetpack';
		$_GET['token']     = $token;
		$_GET['timestamp'] = $timestamp;
		$_GET['nonce']     = $nonce;
		$_GET['body-hash'] = $body_hash;
		// This is intentionally using base64_encode().
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
		$_GET['signature'] = base64_encode(
			hash_hmac(
				'sha1',
				implode(
					"\n",
					$data  = array(
						$token,
						$timestamp,
						$nonce,
						$body_hash,
						'POST',
						'anything.example',
						'80',
						'',
					)
				) . "\n",
				'blogtoken',
				true
			)
		);

		Connection_Rest_Authentication::init()->wp_rest_authenticate( false );
	}
}
