<?php

namespace Automattic\Jetpack\IdentityCrisis;

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;
use Automattic\Jetpack\Connection\REST_Connector;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Identity_Crisis;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;
use WpOrg\Requests\Utility\CaseInsensitiveDictionary;

/**
 * Unit tests for the REST API endpoints.
 *
 * @package automattic/jetpack-identity-crisis
 */
class REST_Endpoints_Test extends TestCase {

	/**
	 * Body of the last `jetpack.register` request intercept_register_request() answered.
	 *
	 * @var array|null
	 */
	private $register_body;

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
	 * Reset the connection status.
	 * Needed because the connection status is memoized and not reset between tests.
	 * WorDBless does not fire the options update hooks that would reset the connection status.
	 */
	public function reset_connection_status() {
		static $manager = null;
		if ( ! $manager ) {
			$manager = new \Automattic\Jetpack\Connection\Manager();
		}
		$manager->reset_connection_status();
	}

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();

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
		$this->reset_connection_status();
	}

	/**
	 * Returning the environment into its initial state.
	 */
	protected function tearDown(): void {
		parent::tearDown();

		Constants::$set_constants['JETPACK__WPCOM_JSON_API_BASE'] = $this->api_host_original;

		delete_transient( 'jetpack_assumed_site_creation_date' );

		WorDBless_Options::init()->clear_options();
		$_GET = array();

		Connection_Rest_Authentication::init()->reset_saved_auth_state();
		$this->reset_connection_status();

		// Static on Manager, so a `from` would otherwise reach every later registration in the run.
		$extra_params = new \ReflectionProperty( Manager::class, 'extra_register_params' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$extra_params->setAccessible( true );
		}
		$extra_params->setValue( null, array() );
		$this->register_body = null;

		remove_all_filters( 'jetpack_idc_authorization_url' );
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
	 * The Safe Mode screens follow the bare URL string this returns, so the redirect must come back inside it.
	 *
	 * @dataProvider provide_start_fresh_from
	 *
	 * @param string|null $from The `from` sent, or null for none.
	 */
	#[DataProvider( 'provide_start_fresh_from' )]
	public function test_start_fresh_returns_authorize_url( $from ) {
		$body = array( 'redirect_uri' => 'admin.php?page=my-jetpack' );
		if ( null !== $from ) {
			$body['from'] = $from;
		}

		$response = $this->dispatch_start_fresh( array( $this, 'intercept_register_request' ), $body );
		$data     = $response->get_data();

		$this->assertEquals( 200, $response->get_status() );
		$this->assertIsString( $data );
		$this->assertStringStartsWith( 'https://jetpack.wordpress.com/jetpack.authorize/', $data );

		// The redirect rides inside the authorize webhook's own redirect_uri.
		parse_str( (string) wp_parse_url( $data, PHP_URL_QUERY ), $authorize_query );
		parse_str( (string) wp_parse_url( $authorize_query['redirect_uri'], PHP_URL_QUERY ), $webhook_query );
		$this->assertSame( admin_url( 'admin.php?page=my-jetpack' ), $webhook_query['redirect'] );

		$this->assertSame( $from, $authorize_query['from'] ?? null );
		$this->assertSame( $from, $this->register_body['from'] ?? null );
	}

	/**
	 * Data provider for test_start_fresh_returns_authorize_url.
	 *
	 * @return array
	 */
	public static function provide_start_fresh_from() {
		return array(
			'with from'    => array( 'connection_safe_mode_notice' ),
			'without from' => array( null ),
		);
	}

	/**
	 * A failed registration must come back as an error, or the screens would follow a URL that isn't one.
	 */
	public function test_start_fresh_registration_failure() {
		$response = $this->dispatch_start_fresh( array( $this, 'fail_register_request' ) );

		$this->assertTrue( $response->is_error() );
	}

	/**
	 * A filtered connection URL that isn't a web address comes back as an error, not as somewhere to send the browser.
	 *
	 * @dataProvider provide_invalid_connection_urls
	 *
	 * @param mixed  $filtered      What the `jetpack_idc_authorization_url` filter returns.
	 * @param string $expected_code Error code the endpoint returns.
	 */
	#[DataProvider( 'provide_invalid_connection_urls' )]
	public function test_start_fresh_invalid_connection_url( $filtered, $expected_code ) {
		add_filter(
			'jetpack_idc_authorization_url',
			function () use ( $filtered ) {
				return $filtered;
			}
		);

		$response = $this->dispatch_start_fresh( array( $this, 'intercept_register_request' ) );

		$this->assertSame( 500, $response->get_status() );
		$this->assertSame( $expected_code, $response->get_data()['code'] );
	}

	/**
	 * Filter results that aren't a web address.
	 *
	 * @return array
	 */
	public static function provide_invalid_connection_urls() {
		return array(
			'no URL'        => array( new \WP_REST_Response( false ), 'start_fresh_missing_connection_url' ),
			'not a web URL' => array( 'false&from=idc-notice', 'start_fresh_missing_connection_url' ),
			'script URL'    => array( 'javascript:alert(1)', 'start_fresh_missing_connection_url' ),
			'filter error'  => array( new \WP_Error( 'filter_error' ), 'filter_error' ),
		);
	}

	/**
	 * Calls the start-fresh endpoint as a user allowed to use it.
	 *
	 * @param callable $register `pre_http_request` callback that answers the registration request.
	 * @param array    $body     Request body.
	 * @return \WP_REST_Response
	 */
	private function dispatch_start_fresh( $register, $body = array() ) {
		add_filter( 'pre_http_request', $register, 10, 3 );
		$user = wp_get_current_user();
		$user->add_cap( 'jetpack_disconnect' );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/identity-crisis/start-fresh' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );

		try {
			return $this->server->dispatch( $request );
		} finally {
			$user->remove_cap( 'jetpack_disconnect' );
			remove_filter( 'pre_http_request', $register, 10 );
		}
	}

	/**
	 * Repeating an action that already took effect, such as a retry after a dropped response, still succeeds.
	 *
	 * @dataProvider provide_already_applied_actions
	 *
	 * @param string $route  Endpoint path.
	 * @param string $option Jetpack option the action sets.
	 */
	#[DataProvider( 'provide_already_applied_actions' )]
	public function test_action_already_applied_succeeds( $route, $option ) {
		Jetpack_Options::update_option( $option, true );

		$user = wp_get_current_user();
		$user->add_cap( 'jetpack_disconnect' );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/identity-crisis/' . $route );
		$request->set_header( 'Content-Type', 'application/json' );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$user->remove_cap( 'jetpack_disconnect' );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( 'success', $data['code'] );
	}

	/**
	 * Data provider for test_action_already_applied_succeeds.
	 *
	 * @return array
	 */
	public static function provide_already_applied_actions() {
		return array(
			'stay in Safe Mode' => array( 'confirm-safe-mode', 'safe_mode_confirmed' ),
			'migrate'           => array( 'migrate', 'migrate_for_idc' ),
		);
	}

	/**
	 * Answer the `jetpack.register` request to WordPress.com with a successful registration.
	 *
	 * @param bool|array $response The existing response.
	 * @param array      $args     The request arguments.
	 * @param string     $url      The request URL.
	 *
	 * @return bool|array
	 */
	public function intercept_register_request( $response, $args, $url ) {
		if ( ! str_contains( $url, 'jetpack.register' ) ) {
			return $response;
		}

		$this->register_body = $args['body'];

		return array(
			'headers'  => new CaseInsensitiveDictionary( array( 'content-type' => 'application/json' ) ),
			'body'     => wp_json_encode(
				array(
					'jetpack_id'                  => '12345',
					'jetpack_secret'              => 'sample_secret',
					'allow_inplace_authorization' => false,
					'alternate_authorization_url' => '',
				),
				JSON_UNESCAPED_SLASHES
			),
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
		);
	}

	/**
	 * Fail the `jetpack.register` request to WordPress.com.
	 *
	 * @param bool|array $response The existing response.
	 * @param array      $args     The request arguments.
	 * @param string     $url      The request URL.
	 *
	 * @return bool|array|WP_Error
	 */
	public function fail_register_request( $response, $args, $url ) {
		if ( ! str_contains( $url, 'jetpack.register' ) ) {
			return $response;
		}

		return new WP_Error( 'http_request_failed', 'Connection timed out.' );
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
		$request->set_body( wp_json_encode( array( 'secret' => $secret_data['secret'] ), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) );

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
		$request->set_body( wp_json_encode( array( 'secret' => '54321fdsa' ), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) );

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
		$request->set_body( wp_json_encode( array( 'secret' => '54321fdsa' ), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) );

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
