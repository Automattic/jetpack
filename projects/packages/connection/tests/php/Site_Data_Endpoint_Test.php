<?php
/**
 * Tests for the site data endpoint.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Cache as StatusCache;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WP_REST_Server;

/**
 * Tests for the site data endpoint.
 *
 * @covers \Automattic\Jetpack\Connection\REST_Connector
 * @covers \Automattic\Jetpack\Connection\Manager
 */
#[CoversClass( REST_Connector::class )]
#[CoversClass( Manager::class )]
class Site_Data_Endpoint_Test extends BaseTestCase {

	/**
	 * REST server.
	 *
	 * @var WP_REST_Server|null
	 */
	private $server;

	/**
	 * The manager that fetches the site record.
	 *
	 * @var Manager
	 */
	private $manager;

	/**
	 * The REST connector that registers and serves the route.
	 *
	 * @var REST_Connector
	 */
	private $rest_connector;

	/**
	 * Whether the test simulated a request signed by WordPress.com, so tear_down knows to undo it.
	 *
	 * @var bool
	 */
	private $signed_request_simulated = false;

	/**
	 * Set up the REST server and register the package routes.
	 */
	public function set_up() {
		parent::set_up();

		// The permission check reads offline mode, which Status caches per request.
		StatusCache::clear();

		global $wp_rest_server;

		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		$this->manager = new Manager();

		do_action( 'rest_api_init' );
		$this->rest_connector = new REST_Connector( $this->manager );
	}

	/**
	 * Return the environment to its initial state.
	 */
	public function tear_down() {
		parent::tear_down();

		global $wp_rest_server;

		$wp_rest_server = null;
		$this->server   = null;

		unset( $_COOKIE['store_sandbox'] );

		if ( $this->signed_request_simulated ) {
			unset( $_GET['_for'], $_GET['token'], $_GET['signature'], $_SERVER['REQUEST_METHOD'] );
			self::clear_auth_singleton();
			$this->signed_request_simulated = false;
		}

		StatusCache::clear();
		Constants::clear_constants();

		wp_set_current_user( 0 );
	}

	/**
	 * Delete any cached Rest_Authentication singleton.
	 */
	private static function clear_auth_singleton() {
		$instance_property = ( new \ReflectionClass( Rest_Authentication::class ) )->getProperty( 'instance' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$instance_property->setAccessible( true );
		}
		$instance_property->setValue( null, false );
	}

	/**
	 * Make the current request read as signed with a user connection token, the way the
	 * WordPress.com post-purchase plan refresh arrives.
	 *
	 * Drives the real `Rest_Authentication::wp_rest_authenticate()` with a mocked signature
	 * verifier, because a real signature would consume a single-use nonce.
	 */
	private function sign_request_as_wpcom() {
		$this->signed_request_simulated = true;

		self::clear_auth_singleton();
		$authentication = Rest_Authentication::init();

		$verifier = $this->getMockBuilder( Manager::class )
			->onlyMethods( array( 'verify_xml_rpc_signature' ) )
			->getMock();
		$verifier->expects( $this->once() )->method( 'verify_xml_rpc_signature' )->willReturn(
			array(
				'type'      => 'user',
				'token_key' => 'asdasd',
				'user_id'   => 1,
			)
		);

		$manager_property = ( new \ReflectionClass( Rest_Authentication::class ) )->getProperty( 'connection_manager' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$manager_property->setAccessible( true );
		}
		$manager_property->setValue( $authentication, $verifier );

		$_GET['_for']              = 'jetpack';
		$_GET['token']             = 'asdasd:1:1';
		$_GET['signature']         = 'signature';
		$_SERVER['REQUEST_METHOD'] = 'GET';

		$authentication->wp_rest_authenticate( false );

		$this->assertTrue( Rest_Authentication::is_signed_with_user_token() );
	}

	/**
	 * Create a user of the given role and make it current.
	 *
	 * @param string $role WordPress role.
	 * @return int
	 */
	private function set_current_user_with_role( $role ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'site_data_' . $role,
				'user_pass'  => '123',
				'role'       => $role,
			)
		);
		wp_set_current_user( $user_id );

		return $user_id;
	}

	/**
	 * The package registers the route.
	 */
	public function test_route_is_registered_by_the_package() {
		$this->assertArrayHasKey( '/jetpack/v4/site', $this->server->get_routes() );
	}

	/**
	 * An editor is permitted when the Jetpack plugin is absent.
	 */
	public function test_editor_is_permitted_without_the_jetpack_plugin() {
		$this->set_current_user_with_role( 'editor' );

		$this->assertTrue( REST_Connector::site_data_permission_check() );
	}

	/**
	 * A contributor is the intended floor: the Jetpack dashboard calls this route on mount and
	 * is reachable by contributors, so raising the bar would break it for them.
	 */
	public function test_contributor_is_permitted() {
		$this->set_current_user_with_role( 'contributor' );

		$this->assertTrue( REST_Connector::site_data_permission_check() );
	}

	/**
	 * Offline mode does not clear the blog ID or the blog token, so a site that connected first
	 * and went offline later can still reach WordPress.com. The floor there stays at
	 * `manage_options`, the capability this route carried before it moved into the package.
	 */
	public function test_contributor_is_denied_in_offline_mode() {
		add_filter( 'jetpack_offline_mode', '__return_true' );
		$this->set_current_user_with_role( 'contributor' );

		$result = REST_Connector::site_data_permission_check();

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'invalid_user_permission_view_admin', $result->get_error_code() );
	}

	/**
	 * An administrator keeps access in offline mode.
	 */
	public function test_administrator_is_permitted_in_offline_mode() {
		add_filter( 'jetpack_offline_mode', '__return_true' );
		$this->set_current_user_with_role( 'administrator' );

		$this->assertTrue( REST_Connector::site_data_permission_check() );
	}

	/**
	 * A subscriber is denied.
	 */
	public function test_subscriber_is_denied() {
		$this->set_current_user_with_role( 'subscriber' );

		$result = REST_Connector::site_data_permission_check();

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'invalid_user_permission_view_admin', $result->get_error_code() );
	}

	/**
	 * A logged-out request is denied.
	 */
	public function test_logged_out_request_is_denied() {
		wp_set_current_user( 0 );

		$this->assertInstanceOf( 'WP_Error', REST_Connector::site_data_permission_check() );
	}

	/**
	 * The package registers at `rest_api_init` priority 11, after an older Jetpack plugin that
	 * still registers this route at priority 10. Without the override flag both handlers stay
	 * and WordPress dispatches the plugin's, leaving the package registration dead.
	 */
	public function test_package_registration_replaces_an_earlier_one() {
		global $wp_rest_server;

		$wp_rest_server = new WP_REST_Server();

		register_rest_route(
			'jetpack/v4',
			'/site',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => '__return_empty_array',
				'permission_callback' => '__return_true',
			)
		);

		$this->rest_connector = new REST_Connector( $this->manager );

		$handlers = $wp_rest_server->get_routes()['/jetpack/v4/site'];

		$this->assertCount( 1, $handlers );
		$this->assertSame( array( $this->rest_connector, 'get_site_data' ), $handlers[0]['callback'] );
	}

	/**
	 * Short-circuit the outgoing HTTP request with a canned response.
	 *
	 * @param int    $code HTTP status code to return.
	 * @param string $body Response body.
	 */
	private function fake_http_response( $code, $body ) {
		Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		Jetpack_Options::update_option( 'id', 1234 );
		$this->manager->reset_connection_status();

		// Each test starts uncached, otherwise the first fetch would answer every later one.
		delete_transient( Manager::SITE_DATA_TRANSIENT_PREFIX . 1234 );

		// Signing needs an absolute URL, so the API base has to resolve.
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		Constants::set_constant( 'JETPACK__API_VERSION', 1 );

		add_filter(
			'pre_http_request',
			function () use ( $code, $body ) {
				return array(
					'response' => array( 'code' => $code ),
					'body'     => $body,
				);
			}
		);
	}

	/**
	 * A successful fetch fires the action with the decoded record, which is how the Jetpack
	 * plugin refreshes the cached plan without this package depending on `jetpack-plans`.
	 */
	public function test_successful_fetch_fires_the_site_data_action() {
		$this->fake_http_response( 200, '{"ID":1234,"name":"Test site"}' );

		$payloads = array();
		add_action(
			'jetpack_site_data_fetched',
			function ( $payload ) use ( &$payloads ) {
				$payloads[] = $payload;
			}
		);

		$this->assertFalse( is_wp_error( $this->manager->get_connected_site_data() ) );
		$this->assertSame(
			array(
				array(
					'ID'   => 1234,
					'name' => 'Test site',
				),
			),
			$payloads
		);
	}

	/**
	 * The payload must be a value copy rather than the object the method returns, so a listener
	 * cannot mutate the record that becomes the REST response.
	 */
	public function test_site_data_action_payload_does_not_alias_the_returned_record() {
		$this->fake_http_response( 200, '{"ID":1234,"name":"Test site"}' );

		add_action(
			'jetpack_site_data_fetched',
			function ( $record ) {
				$record['name'] = 'Mutated';
			}
		);

		$this->assertSame( 'Test site', $this->manager->get_connected_site_data()->name );
	}

	/**
	 * A 200 carrying a body that is not a JSON object must report an error rather than return
	 * `null`, which would otherwise be encoded as a successful `"data":"null"` envelope.
	 */
	public function test_unusable_body_on_a_200_reports_invalid_body() {
		$this->fake_http_response( 200, '' );

		$fired = false;
		add_action(
			'jetpack_site_data_fetched',
			function () use ( &$fired ) {
				$fired = true;
			}
		);

		$result = $this->manager->get_connected_site_data();

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'site_data_fetch_failed', $result->get_error_code() );
		$this->assertSame( 'invalid_body', $result->get_error_data()['api_error_code'] );
		$this->assertFalse( $fired, 'The action must not fire without a usable record.' );
	}

	/**
	 * Count the outgoing HTTP requests made while the callback runs.
	 *
	 * @param callable $callback Code under test.
	 * @return int
	 */
	private function count_http_requests( callable $callback ) {
		$requests = 0;

		$counter = function ( $pre ) use ( &$requests ) {
			++$requests;

			return $pre;
		};

		add_filter( 'pre_http_request', $counter, 1 );
		$callback();
		remove_filter( 'pre_http_request', $counter, 1 );

		return $requests;
	}

	/**
	 * The record is cached, so a second read inside the window is served without another round
	 * trip. Every plugin bundling this package serves the route, so an uncached read is a
	 * blocking request per render.
	 */
	public function test_the_site_record_is_served_from_cache() {
		$this->fake_http_response( 200, '{"ID":1234,"name":"Test site"}' );

		$requests = $this->count_http_requests(
			function () {
				$first  = $this->manager->get_connected_site_data();
				$second = $this->manager->get_connected_site_data();

				$this->assertEquals( $first, $second );
			}
		);

		$this->assertSame( 1, $requests );
	}

	/**
	 * A cached read still announces the record, so a consumer deriving its own state stays in
	 * step with every request that serves it.
	 */
	public function test_a_cached_read_still_fires_the_site_data_action() {
		$this->fake_http_response( 200, '{"ID":1234,"name":"Test site"}' );

		$payloads = array();
		add_action(
			'jetpack_site_data_fetched',
			function ( $payload ) use ( &$payloads ) {
				$payloads[] = $payload;
			}
		);

		$fresh  = $this->manager->get_connected_site_data();
		$cached = $this->manager->get_connected_site_data();

		$this->assertEquals( $fresh, $cached );
		$this->assertCount( 2, $payloads );
		$this->assertSame( reset( $payloads ), end( $payloads ) );
	}

	/**
	 * A caller that reached WordPress.com by another route holds something newer than the cache
	 * can. Dropping the cache has to send the next read back to WordPress.com, otherwise the
	 * older record keeps being announced and undoes what that caller stored.
	 */
	public function test_dropping_the_cache_sends_the_next_read_to_wpcom() {
		$this->fake_http_response( 200, '{"ID":1234,"name":"Test site"}' );

		$requests = $this->count_http_requests(
			function () {
				$this->manager->get_connected_site_data();

				Manager::delete_cached_site_data();

				$this->manager->get_connected_site_data();
			}
		);

		$this->assertSame( 2, $requests );
	}

	/**
	 * A failure is cached as well, so an outage does not put a blocking request on every load.
	 */
	public function test_a_failed_fetch_is_also_cached() {
		$this->fake_http_response( 500, '{"error":"unavailable"}' );

		$requests = $this->count_http_requests(
			function () {
				$first  = $this->manager->get_connected_site_data();
				$second = $this->manager->get_connected_site_data();

				$this->assertInstanceOf( 'WP_Error', $first );
				$this->assertInstanceOf( 'WP_Error', $second );
			}
		);

		$this->assertSame( 1, $requests );
	}

	/**
	 * A sandboxed request must not read the shared cache or seed it, otherwise sandbox data would
	 * leak into ordinary requests.
	 */
	public function test_a_sandboxed_request_bypasses_the_cache() {
		$this->fake_http_response( 200, '{"ID":1234,"name":"Test site"}' );
		$_COOKIE['store_sandbox'] = 'sandbox.example.com';

		$requests = $this->count_http_requests(
			function () {
				$first  = $this->manager->get_connected_site_data();
				$second = $this->manager->get_connected_site_data();

				$this->assertEquals( $first, $second );
			}
		);

		$this->assertSame( 2, $requests );
		$this->assertFalse( get_transient( Manager::SITE_DATA_TRANSIENT_PREFIX . 1234 ) );
	}

	/**
	 * `store_sandbox[]=` arrives as an array, which sanitizes down to an empty string. Treating
	 * that as a sandbox secret would let any reader of the route opt their own requests out of
	 * the cache, so it has to read as no cookie at all.
	 */
	public function test_an_array_sandbox_cookie_is_not_a_sandboxed_request() {
		$this->fake_http_response( 200, '{"ID":1234,"name":"Test site"}' );
		$_COOKIE['store_sandbox'] = array( 'sandbox.example.com' );

		$requests = $this->count_http_requests(
			function () {
				$first  = $this->manager->get_connected_site_data();
				$second = $this->manager->get_connected_site_data();

				$this->assertEquals( $first, $second );
			}
		);

		$this->assertSame( 1, $requests );
		$this->assertNotFalse( get_transient( Manager::SITE_DATA_TRANSIENT_PREFIX . 1234 ) );
	}

	/**
	 * WordPress.com requests this route right after a purchase so the site stores the new plan.
	 * That request arrives signed with a connection token. Serving it from the cache would hand
	 * it the pre-purchase record and turn the refresh into a no-op, so a signed request reads
	 * from WordPress.com and replaces the cache with the record it fetched.
	 */
	public function test_a_signed_request_reads_fresh_and_replaces_the_cache() {
		$this->fake_http_response( 200, '{"ID":1234,"name":"After purchase"}' );

		// A browser read moments earlier left the pre-purchase record in the cache.
		set_transient(
			Manager::SITE_DATA_TRANSIENT_PREFIX . 1234,
			array( 'body' => '{"ID":1234,"name":"Before purchase"}' ),
			5 * MINUTE_IN_SECONDS
		);

		$this->sign_request_as_wpcom();

		$record   = null;
		$requests = $this->count_http_requests(
			function () use ( &$record ) {
				$record = $this->manager->get_connected_site_data();
			}
		);

		$this->assertSame( 1, $requests );
		$this->assertSame( 'After purchase', $record->name );

		$cached = get_transient( Manager::SITE_DATA_TRANSIENT_PREFIX . 1234 );
		$this->assertSame( '{"ID":1234,"name":"After purchase"}', $cached['body'] );
	}

	/**
	 * A signed read that fails must not replace a still-usable cached record with the failure,
	 * or a hiccup during the WordPress.com refresh would put an error in front of every browser
	 * read for the failure window.
	 */
	public function test_a_failed_signed_read_keeps_the_cached_record() {
		$this->fake_http_response( 500, '{"error":"unavailable"}' );

		set_transient(
			Manager::SITE_DATA_TRANSIENT_PREFIX . 1234,
			array( 'body' => '{"ID":1234,"name":"Before purchase"}' ),
			5 * MINUTE_IN_SECONDS
		);

		$this->sign_request_as_wpcom();

		$result = $this->manager->get_connected_site_data();

		$this->assertInstanceOf( 'WP_Error', $result );

		$cached = get_transient( Manager::SITE_DATA_TRANSIENT_PREFIX . 1234 );
		$this->assertSame( '{"ID":1234,"name":"Before purchase"}', $cached['body'] );
	}

	/**
	 * A failed fetch must not fire the action, otherwise consumers would cache an error body.
	 */
	public function test_failed_fetch_does_not_fire_the_site_data_action() {
		$this->fake_http_response( 500, '{"error":"unavailable"}' );

		$fired = false;
		add_action(
			'jetpack_site_data_fetched',
			function () use ( &$fired ) {
				$fired = true;
			}
		);

		$this->manager->get_connected_site_data();

		$this->assertFalse( $fired );
	}

	/**
	 * A site with no blog ID reports `site_id_missing`.
	 */
	public function test_missing_blog_id_reports_site_id_missing() {
		Jetpack_Options::delete_option( 'id' );

		$result = $this->manager->get_connected_site_data();

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'site_id_missing', $result->get_error_code() );
	}

	/**
	 * The envelope is reachable without a `REST_Connector` instance, which is what lets the
	 * Jetpack plugin's deprecated wrapper delegate without re-registering the routes.
	 */
	public function test_site_data_response_does_not_need_an_instance() {
		Jetpack_Options::delete_option( 'id' );

		$result = REST_Connector::site_data_response();

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'site_id_missing', $result->get_error_code() );
	}

	/**
	 * Odyssey parses this envelope, so its shape is a contract: a `success` code and the site
	 * record as a JSON *string* under `data`, not a nested object.
	 */
	public function test_success_envelope_carries_the_record_as_a_json_string() {
		$this->fake_http_response( 200, '{"ID":1234,"name":"Test site"}' );

		$response = $this->rest_connector->get_site_data();
		$data     = $response->get_data();

		$this->assertSame( 'success', $data['code'] );
		$this->assertIsString( $data['data'], 'Consumers decode `data` themselves.' );
		$this->assertSame( 1234, json_decode( $data['data'] )->ID );
	}

	/**
	 * When WordPress.com explains why it refused, that reason has to reach the caller. Odyssey
	 * shows it, so collapsing it into the generic message would hide the actual cause.
	 */
	public function test_wpcom_error_code_reaches_the_caller() {
		$this->fake_http_response( 400, '{"error":"site_suspended"}' );

		$result = $this->rest_connector->get_site_data();
		$data   = $result->get_error_data();

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'site_suspended', $data['api_error_code'] );
		$this->assertSame( 400, $data['api_http_code'] );
		$this->assertStringContainsString( 'site_suspended', $result->get_error_message() );
	}

	/**
	 * A transport failure never reaches WordPress.com, so the code comes from the WP_Error rather
	 * than a response body. That is a separate path to the one above and has its own way to break.
	 */
	public function test_transport_error_code_reaches_the_caller() {
		Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		Jetpack_Options::update_option( 'id', 1234 );
		$this->manager->reset_connection_status();
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		Constants::set_constant( 'JETPACK__API_VERSION', 1 );

		add_filter(
			'pre_http_request',
			function () {
				return new \WP_Error( 'http_request_failed', 'Could not resolve host.' );
			}
		);

		$result = $this->rest_connector->get_site_data();

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'http_request_failed', $result->get_error_data()['api_error_code'] );
	}

	/**
	 * The error envelope carries the original code, a 400 status, and both API error keys.
	 */
	public function test_error_envelope_shape_is_preserved() {
		Jetpack_Options::delete_option( 'id' );

		$result = $this->rest_connector->get_site_data();

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'site_id_missing', $result->get_error_code() );

		$data = $result->get_error_data();
		$this->assertSame( 400, $data['status'] );
		$this->assertArrayHasKey( 'api_error_code', $data );
		$this->assertArrayHasKey( 'api_http_code', $data );
	}
}
