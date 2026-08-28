<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Constants;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Tests for the site purchases REST endpoints.
 *
 * My Jetpack serves purchases from two routes: the cross-platform `wpcom/v2` one the UI calls on
 * every platform, and the original `my-jetpack/v1` one kept for backwards compatibility. Both must
 * behave identically.
 *
 * @package automattic/my-jetpack
 * @see \Automattic\Jetpack\My_Jetpack\REST_Purchases
 */
class Purchases_Rest_Test extends TestCase {

	/**
	 * The cross-platform route the My Jetpack UI calls.
	 *
	 * @var string
	 */
	const PORTABLE_ROUTE = '/wpcom/v2/my-jetpack/purchases';

	/**
	 * The original route, retained for backwards compatibility.
	 *
	 * @var string
	 */
	const LEGACY_ROUTE = '/my-jetpack/v1/site/purchases';

	/**
	 * REST Server object.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * An administrator user id.
	 *
	 * @var int
	 */
	private static $admin_id;

	/**
	 * An editor user id. Editors have `edit_posts`, which is what the endpoint requires.
	 *
	 * @var int
	 */
	private static $editor_id;

	/**
	 * A subscriber user id. Subscribers lack `edit_posts`.
	 *
	 * @var int
	 */
	private static $subscriber_id;

	/**
	 * URLs the mocked HTTP layer was asked for, so tests can assert on the outgoing request.
	 *
	 * @var array
	 */
	private $requested_urls = array();

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();

		// Mock site connection.
		( new Tokens() )->update_blog_token( 'test.test' );
		Jetpack_Options::update_option( 'id', 123 );
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		( new Connection_Manager() )->reset_connection_status();

		global $wp_rest_server;

		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		Initializer::init();
		do_action( 'rest_api_init' );

		self::$admin_id = wp_insert_user(
			array(
				'user_login' => 'test_admin',
				'user_pass'  => '123',
				'role'       => 'administrator',
			)
		);

		self::$editor_id = wp_insert_user(
			array(
				'user_login' => 'test_editor',
				'user_pass'  => '123',
				'role'       => 'editor',
			)
		);

		self::$subscriber_id = wp_insert_user(
			array(
				'user_login' => 'test_subscriber',
				'user_pass'  => '123',
				'role'       => 'subscriber',
			)
		);

		wp_set_current_user( self::$admin_id );

		$this->requested_urls = array();
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();

		remove_filter( 'pre_http_request', array( $this, 'mock_purchases_success' ), 10 );
		remove_filter( 'pre_http_request', array( $this, 'mock_purchases_failure' ), 10 );

		delete_transient( Wpcom_Products::MY_JETPACK_PURCHASES_TRANSIENT_KEY );
		Wpcom_Products::reset_request_failures();

		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();

		unset( $_SERVER['REQUEST_METHOD'] );
		$_GET = array();
	}

	/**
	 * The purchase payload WordPress.com is pretended to return.
	 *
	 * @return array
	 */
	private function sample_purchases() {
		return array(
			array(
				'ID'             => 28890112,
				'product_slug'   => 'jetpack_backup_t1_monthly',
				'product_name'   => 'Jetpack VaultPress Backup',
				'expiry_message' => 'Expires on August 22, 2026',
			),
		);
	}

	/**
	 * Intercept the WordPress.com request and return a successful purchases response.
	 *
	 * @param mixed  $response The preempted response.
	 * @param array  $args     Request arguments.
	 * @param string $url      The requested URL.
	 * @return array
	 */
	public function mock_purchases_success( $response, $args, $url ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$this->requested_urls[] = $url;

		return array(
			'headers'  => array(),
			'body'     => wp_json_encode( $this->sample_purchases(), JSON_UNESCAPED_SLASHES ),
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
			'cookies'  => array(),
			'filename' => null,
		);
	}

	/**
	 * Intercept the WordPress.com request and return a failure.
	 *
	 * @param mixed  $response The preempted response.
	 * @param array  $args     Request arguments.
	 * @param string $url      The requested URL.
	 * @return array
	 */
	public function mock_purchases_failure( $response, $args, $url ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$this->requested_urls[] = $url;

		return array(
			'headers'  => array(),
			'body'     => '',
			'response' => array(
				'code'    => 500,
				'message' => 'Internal Server Error',
			),
			'cookies'  => array(),
			'filename' => null,
		);
	}

	/**
	 * Both routes must exist. The `wpcom/v2` one is what the UI calls on every platform; the
	 * `my-jetpack/v1` one is retained so any existing consumer keeps working.
	 */
	public function test_both_routes_are_registered() {
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( self::PORTABLE_ROUTE, $routes );
		$this->assertArrayHasKey( self::LEGACY_ROUTE, $routes );
	}

	/**
	 * The endpoint returns the purchases WordPress.com reported.
	 *
	 * Runs in a separate process because Wpcom_Products::get_site_current_purchases() memoizes in a
	 * function-static; a success recorded by an earlier test would be returned instead of the
	 * mocked fetch this test is asserting on.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_portable_route_returns_the_site_purchases() {
		add_filter( 'pre_http_request', array( $this, 'mock_purchases_success' ), 10, 3 );

		$response = $this->server->dispatch( new WP_REST_Request( 'GET', self::PORTABLE_ROUTE ) );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals(
			wp_json_encode( $this->sample_purchases(), JSON_UNESCAPED_SLASHES ),
			wp_json_encode( $response->get_data(), JSON_UNESCAPED_SLASHES )
		);
	}

	/**
	 * The two routes must not drift apart.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_both_routes_return_the_same_payload() {
		add_filter( 'pre_http_request', array( $this, 'mock_purchases_success' ), 10, 3 );

		$portable = $this->server->dispatch( new WP_REST_Request( 'GET', self::PORTABLE_ROUTE ) );
		$legacy   = $this->server->dispatch( new WP_REST_Request( 'GET', self::LEGACY_ROUTE ) );

		$this->assertEquals( $legacy->get_status(), $portable->get_status() );
		$this->assertEquals(
			wp_json_encode( $legacy->get_data(), JSON_UNESCAPED_SLASHES ),
			wp_json_encode( $portable->get_data(), JSON_UNESCAPED_SLASHES )
		);
	}

	/**
	 * The upstream request must carry the user's locale.
	 *
	 * The response contains localized strings (product names, expiry messages). Dropping the locale
	 * would silently serve them in English.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_upstream_request_carries_the_user_locale() {
		add_filter( 'pre_http_request', array( $this, 'mock_purchases_success' ), 10, 3 );

		$this->server->dispatch( new WP_REST_Request( 'GET', self::PORTABLE_ROUTE ) );

		$this->assertNotEmpty( $this->requested_urls, 'Expected an upstream request to WordPress.com.' );
		$this->assertStringContainsString( 'locale=' . rawurlencode( get_user_locale() ), $this->requested_urls[0] );
	}

	/**
	 * An upstream failure surfaces as an error rather than an empty success.
	 *
	 * Runs in a separate process so no earlier test's successful fetch is memoized.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_upstream_failure_returns_an_error() {
		add_filter( 'pre_http_request', array( $this, 'mock_purchases_failure' ), 10, 3 );

		$response = $this->server->dispatch( new WP_REST_Request( 'GET', self::PORTABLE_ROUTE ) );

		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'site_data_fetch_failed', $response->get_data()['code'] );
	}

	/**
	 * A platform that provides the purchases locally serves them without any HTTP request.
	 *
	 * This is the WordPress.com Simple path: My Jetpack calls
	 * \Automattic\WPCOM\My_Jetpack\get_site_purchases() directly when it exists, ahead of both the
	 * cache and the request. There is no blog token to sign a request with, so a fetch would fail
	 * outright - the point is that none is attempted.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_local_purchases_are_served_without_fetching() {
		Constants::set_constant( 'IS_WPCOM', true );
		$local                                = array( (object) array( 'product_slug' => 'jetpack_backup_t1_monthly' ) );
		$GLOBALS['__mj_test_local_purchases'] = $local;
		require_once __DIR__ . '/stubs/wpcom-my-jetpack-purchases.php';

		// Left in place deliberately: if the direct call fails to short-circuit, this would answer
		// the request and the empty-URL assertion below is what catches it.
		add_filter( 'pre_http_request', array( $this, 'mock_purchases_success' ), 10, 3 );

		$response = $this->server->dispatch( new WP_REST_Request( 'GET', self::PORTABLE_ROUTE ) );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals(
			wp_json_encode( $local, JSON_UNESCAPED_SLASHES ),
			wp_json_encode( $response->get_data(), JSON_UNESCAPED_SLASHES )
		);
		$this->assertSame( array(), $this->requested_urls, 'Expected no request to WordPress.com.' );

		unset( $GLOBALS['__mj_test_local_purchases'] );
	}

	/**
	 * When the local provider returns null - e.g. Atomic, where the signed request works - My
	 * Jetpack must fall through to the normal WordPress.com fetch rather than treat null as an
	 * answer.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_null_from_local_provider_falls_through_to_fetch() {
		Constants::set_constant( 'IS_WPCOM', true );
		$GLOBALS['__mj_test_local_purchases'] = null;
		require_once __DIR__ . '/stubs/wpcom-my-jetpack-purchases.php';

		add_filter( 'pre_http_request', array( $this, 'mock_purchases_success' ), 10, 3 );

		$response = $this->server->dispatch( new WP_REST_Request( 'GET', self::PORTABLE_ROUTE ) );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals(
			wp_json_encode( $this->sample_purchases(), JSON_UNESCAPED_SLASHES ),
			wp_json_encode( $response->get_data(), JSON_UNESCAPED_SLASHES )
		);
		$this->assertNotEmpty( $this->requested_urls, 'Expected a fallback request to WordPress.com.' );

		unset( $GLOBALS['__mj_test_local_purchases'] );
	}

	/**
	 * The local provider must not be consulted off WordPress.com Simple, even when the function
	 * happens to exist. A non-Simple site fetches from WordPress.com as usual.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_local_provider_not_called_when_not_simple() {
		// IS_WPCOM intentionally not set: this is not a Simple site.
		$GLOBALS['__mj_test_local_purchases'] = array( (object) array( 'product_slug' => 'should_not_be_used' ) );
		require_once __DIR__ . '/stubs/wpcom-my-jetpack-purchases.php';

		add_filter( 'pre_http_request', array( $this, 'mock_purchases_success' ), 10, 3 );

		$response = $this->server->dispatch( new WP_REST_Request( 'GET', self::PORTABLE_ROUTE ) );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals(
			wp_json_encode( $this->sample_purchases(), JSON_UNESCAPED_SLASHES ),
			wp_json_encode( $response->get_data(), JSON_UNESCAPED_SLASHES )
		);
		$this->assertNotEmpty( $this->requested_urls, 'Expected the normal WordPress.com fetch off Simple.' );

		unset( $GLOBALS['__mj_test_local_purchases'] );
	}

	/**
	 * `edit_posts` is the bar, so an editor is allowed through.
	 */
	public function test_editor_can_read_purchases() {
		add_filter( 'pre_http_request', array( $this, 'mock_purchases_success' ), 10, 3 );
		wp_set_current_user( self::$editor_id );

		$response = $this->server->dispatch( new WP_REST_Request( 'GET', self::PORTABLE_ROUTE ) );

		$this->assertEquals( 200, $response->get_status() );
	}

	/**
	 * A subscriber lacks `edit_posts` and must be refused.
	 */
	public function test_subscriber_cannot_read_purchases() {
		wp_set_current_user( self::$subscriber_id );

		$response = $this->server->dispatch( new WP_REST_Request( 'GET', self::PORTABLE_ROUTE ) );

		$this->assertEquals( 403, $response->get_status() );
	}

	/**
	 * A logged-out request must be refused.
	 */
	public function test_logged_out_cannot_read_purchases() {
		wp_set_current_user( 0 );

		$response = $this->server->dispatch( new WP_REST_Request( 'GET', self::PORTABLE_ROUTE ) );

		$this->assertEquals( 401, $response->get_status() );
	}

	/**
	 * A site with no Jetpack connection cannot sign the upstream request, so the endpoint says so
	 * rather than attempting the fetch.
	 */
	public function test_disconnected_site_reports_not_connected() {
		Jetpack_Options::delete_option( 'id' );
		( new Connection_Manager() )->reset_connection_status();

		$response = $this->server->dispatch( new WP_REST_Request( 'GET', self::PORTABLE_ROUTE ) );

		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'not_connected', $response->get_data()['code'] );
	}
}
