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
 * @covers \Automattic\Jetpack\Connection\Site_Data
 */
#[CoversClass( Site_Data::class )]
class Site_Data_Test extends BaseTestCase {

	/**
	 * REST server.
	 *
	 * @var WP_REST_Server|null
	 */
	private $server;

	/**
	 * The manager that provides the capability filter.
	 *
	 * @var Manager
	 */
	private $manager;

	/**
	 * Set up the REST server and register the package routes.
	 */
	public function set_up() {
		parent::set_up();

		global $wp_rest_server;

		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		$this->manager = new Manager();

		// `Manager::configure()` wires this in production; the tests construct the manager directly.
		add_filter( 'map_meta_cap', array( $this->manager, 'jetpack_admin_page_fallback_cap' ), 20, 2 );

		do_action( 'rest_api_init' );
		new REST_Connector( $this->manager );
	}

	/**
	 * Return the environment to its initial state.
	 */
	public function tear_down() {
		parent::tear_down();

		remove_filter( 'map_meta_cap', array( $this->manager, 'jetpack_admin_page_fallback_cap' ), 20 );

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

		$this->assertTrue( Site_Data::permission_check() );
	}

	/**
	 * A subscriber is denied.
	 */
	public function test_subscriber_is_denied() {
		$this->set_current_user_with_role( 'subscriber' );

		$result = Site_Data::permission_check();

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'invalid_user_permission_view_admin', $result->get_error_code() );
	}

	/**
	 * A logged-out request is denied.
	 */
	public function test_logged_out_request_is_denied() {
		wp_set_current_user( 0 );

		$this->assertInstanceOf( 'WP_Error', Site_Data::permission_check() );
	}

	/**
	 * A `map_meta_cap` filter that tightens `jetpack_admin_page` denies access.
	 */
	public function test_a_later_map_meta_cap_filter_can_deny_access() {
		$this->set_current_user_with_role( 'editor' );
		$this->assertTrue( Site_Data::permission_check(), 'Editor is permitted before the filter.' );

		$deny = static function ( $caps, $cap ) {
			return 'jetpack_admin_page' === $cap ? array( 'do_not_allow' ) : $caps;
		};
		add_filter( 'map_meta_cap', $deny, 99, 2 );

		$result = Site_Data::permission_check();

		remove_filter( 'map_meta_cap', $deny, 99 );

		$this->assertInstanceOf( 'WP_Error', $result );
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

		$this->assertFalse( is_wp_error( Site_Data::get() ) );
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

		Site_Data::get();

		$this->assertFalse( $fired );
	}

	/**
	 * A site with no blog ID reports `site_id_missing`.
	 */
	public function test_missing_blog_id_reports_site_id_missing() {
		Jetpack_Options::delete_option( 'id' );

		$result = Site_Data::get();

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'site_id_missing', $result->get_error_code() );
	}

	/**
	 * The error envelope carries the original code, a 400 status, and both API error keys.
	 */
	public function test_error_envelope_shape_is_preserved() {
		Jetpack_Options::delete_option( 'id' );

		$result = Site_Data::rest_get_site_data();

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'site_id_missing', $result->get_error_code() );

		$data = $result->get_error_data();
		$this->assertSame( 400, $data['status'] );
		$this->assertArrayHasKey( 'api_error_code', $data );
		$this->assertArrayHasKey( 'api_http_code', $data );
	}
}
