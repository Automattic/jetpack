<?php
/**
 * Tests for the site data endpoint.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Constants;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WP_REST_Server;

/**
 * Tests for the site data endpoint.
 *
 * @covers \Automattic\Jetpack\Connection\REST_Connector
 */
#[CoversClass( REST_Connector::class )]
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
	 * Set up the REST server and register the package routes.
	 */
	public function set_up() {
		parent::set_up();

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

		Constants::clear_constants();

		wp_set_current_user( 0 );
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
	 * A successful fetch fires the action with the response body, which is how the Jetpack
	 * plugin refreshes the cached plan without this package depending on `jetpack-plans`.
	 */
	public function test_successful_fetch_fires_the_site_data_action() {
		$body = '{"ID":1234,"name":"Test site"}';
		$this->fake_http_response( 200, $body );

		$payloads = array();
		add_action(
			'jetpack_site_data_fetched',
			function ( $payload ) use ( &$payloads ) {
				$payloads[] = $payload;
			}
		);

		$this->assertFalse( is_wp_error( $this->manager->get_connected_site_data() ) );
		$this->assertSame( array( $body ), $payloads );
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
