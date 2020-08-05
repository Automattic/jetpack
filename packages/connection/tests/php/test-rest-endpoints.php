<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Connection;

require_once ABSPATH . WPINC . '/class-IXR.php';

use Automattic\Jetpack\Connection\Plugin as Connection_Plugin;
use Automattic\Jetpack\Connection\Plugin_Storage as Connection_Plugin_Storage;
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

	/**
	 * REST Server object.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

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
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown() {
		parent::tearDown();

		remove_action( 'jetpack_disabled_raw_options', array( $this, 'bypass_raw_options' ) );
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

		$this->assertEquals( 400, $data['code'] );
		$this->assertContains( '[verify_secrets_missing]', $data['message'] );
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
	 * Testing the `connection/reconnect` endpoint.
	 */
	public function test_connection_reconnect() {
		$user = wp_get_current_user();
		$user->add_cap( 'jetpack_disconnect' );

		$this->request = new WP_REST_Request( 'POST', '/jetpack/v4/connection/reconnect' );
		$this->request->set_header( 'Content-Type', 'application/json' );
		$this->request->set_body( wp_json_encode( array( 'action' => 'reconnect' ) ) );

		set_transient( 'jetpack_assumed_site_creation_date', '2020-02-28 01:13:27' );
		add_filter( 'pre_http_request', array( $this, 'intercept_register_request' ), 10, 3 );

		$response = $this->server->dispatch( $this->request );
		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertEquals( 'in_progress', $data['status'] );
		$this->assertEquals( 0, strpos( $data['authorizeUrl'], 'https://jetpack.wordpress.com/jetpack.authorize/1' ) );

		remove_filter( 'pre_http_request', array( $this, 'intercept_register_request' ), 10 );
		delete_transient( 'jetpack_assumed_site_creation_date' );

		$user->remove_cap( 'jetpack_disconnect' );
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

}
