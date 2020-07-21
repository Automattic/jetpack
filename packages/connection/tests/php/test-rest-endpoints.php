<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

require_once ABSPATH . WPINC . '/class-IXR.php';

use Automattic\Jetpack\Config;
use Automattic\Jetpack\Connection\Plugin as Connection_Plugin;
use Automattic\Jetpack\Connection\Plugin_Storage as Connection_Plugin_Storage;
use phpmock\MockBuilder;
use PHPUnit\Framework\TestCase;
use Automattic\Jetpack\Connection\REST_Connector;
use Automattic\Jetpack\Connection\Manager;

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
						return 'jetpack_development_mode' === $hook ? true : $value;
					}
				);

		$mock = $builder->build();
		$mock->enable();

		$this->request = new WP_REST_Request( 'GET', '/jetpack/v4/connection' );

		$response = $this->server->dispatch( $this->request );
		$data     = $response->get_data();

		$this->assertFalse( $data['isActive'] );
		$this->assertFalse( $data['isRegistered'] );
		$this->assertTrue( $data['devMode']['isActive'] );
	}

	/**
	 * Testing the `/jetpack/v4/connection/plugins` endpoint.
	 */
	public function test_connection_plugins() {
		$user = wp_get_current_user();
		$user->add_cap( 'jetpack_admin_page' );
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
		$user->remove_cap( 'jetpack_admin_page' );
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

}
