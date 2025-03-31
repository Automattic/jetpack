<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Tokens;
use Jetpack_Options;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Unit tests for the REST API endpoints.
 *
 * @package automattic/my-jetpack
 * @see \Automattic\Jetpack\My_Jetpack\Rest_Products
 */
class Products_Rest_Test extends TestCase {

	/**
	 * REST Server object.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * The current user id.
	 *
	 * @var int
	 */
	private static $user_id;

	/**
	 * The secondary user id.
	 *
	 * @var int
	 */
	private static $secondary_user_id;

	/**
	 * The filename of the mock Boost plugin
	 *
	 * @var string
	 */
	private $boost_mock_filename = 'boost/jetpack-boost.php';

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();
		$this->install_mock_plugin();
		wp_cache_delete( 'plugins', 'plugins' );

		// Mock site connection.
		( new Tokens() )->update_blog_token( 'test.test.1' );
		Jetpack_Options::update_option( 'id', 123 );

		global $wp_rest_server;

		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		Initializer::init();
		do_action( 'rest_api_init' );

		self::$user_id = wp_insert_user(
			array(
				'user_login' => 'test_admin',
				'user_pass'  => '123',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( self::$user_id );

		self::$secondary_user_id = wp_insert_user(
			array(
				'user_login' => 'test_editor',
				'user_pass'  => '123',
				'role'       => 'editor',
			)
		);
	}

	/**
	 * Installs the mock plugin present in the test assets folder as if it was the Boost plugin
	 *
	 * @param string $source The prefix of the file to be used as the Boost plugin.
	 * @return void
	 */
	public function install_mock_plugin( $source = 'boost' ) {
		$plugin_dir = WP_PLUGIN_DIR . '/boost';
		if ( ! file_exists( $plugin_dir ) ) {
			mkdir( $plugin_dir, 0777, true );
		}
		copy( __DIR__ . "/assets/$source-mock-plugin.txt", $plugin_dir . '/jetpack-boost.php' );
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();

		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();

		unset( $_SERVER['REQUEST_METHOD'] );
		$_GET = array();
	}

	/**
	 * Test GET products
	 */
	public function test_get_products() {
		$products = Products::get_products_api_data();

		$request = new WP_REST_Request( 'GET', '/my-jetpack/v1/site/products' );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( $products, $data );
	}

	/**
	 * Test GET products logged as editor
	 */
	public function test_get_products_with_editor() {
		wp_set_current_user( self::$secondary_user_id );

		$request = new WP_REST_Request( 'GET', '/my-jetpack/v1/site/products' );

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
	}

	/**
	 * Test GET products not logged in
	 */
	public function test_get_products_not_logged() {
		wp_set_current_user( 0 );

		$request = new WP_REST_Request( 'GET', '/my-jetpack/v1/site/products' );

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 401, $response->get_status() );
	}

	/**
	 * Test GET product
	 */
	public function test_get_product() {
		$product = Products::get_products_api_data( array( 'boost' ) );

		$request = new WP_REST_Request( 'GET', '/my-jetpack/v1/site/products' );
		$request->set_query_params(
			array(
				'products' => 'boost',
			)
		);

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( $product['boost'], $data['boost'] );
	}

	/**
	 * Test GET invalid product
	 */
	public function test_get_invalid_product() {
		$request = new WP_REST_Request( 'GET', '/my-jetpack/v1/site/products' );
		$request->set_query_params(
			array(
				'products' => 'invalid',
			)
		);

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 400, $response->get_status() );
	}

	/**
	 * Test POST product
	 */
	public function test_activate_boost() {

		$this->assertFalse( is_plugin_active( $this->boost_mock_filename ) );

		$body = array(
			'products' => array( 'boost' ),
		);
		// Activate.
		$request = new WP_REST_Request( 'POST', '/my-jetpack/v1/site/products/activate' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( $body ) );

		$response = $this->server->dispatch( $request );

		$api_data_request = new WP_REST_Request( 'GET', '/my-jetpack/v1/site/products' );
		$api_data_request->set_query_params(
			array(
				'products' => 'boost',
			)
		);

		$api_data_response = $this->server->dispatch( $api_data_request );
		$api_data          = $api_data_response->get_data();

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( 'can_upgrade', $api_data['boost']['status'] );
		$this->assertTrue( is_plugin_active( $this->boost_mock_filename ) );
	}

	/**
	 * Test DELETE product
	 */
	public function test_deactivate_boost() {

		activate_plugin( $this->boost_mock_filename );
		$this->assertTrue( is_plugin_active( $this->boost_mock_filename ) );

		$body = array(
			'products' => array( 'boost' ),
		);
		// Deactivate.
		$request = new WP_REST_Request( 'DELETE', '/my-jetpack/v1/site/products/deactivate' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( $body ) );

		$response = $this->server->dispatch( $request );

		$api_data_request = new WP_REST_Request( 'GET', '/my-jetpack/v1/site/products' );
		$api_data_request->set_query_params(
			array(
				'products' => 'boost',
			)
		);

		$api_data_response = $this->server->dispatch( $api_data_request );
		$api_data          = $api_data_response->get_data();

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( 'needs_activation', $api_data['boost']['status'] );
		$this->assertFalse( is_plugin_active( $this->boost_mock_filename ) );
	}

	/**
	 * Test POST uninstallable product
	 */
	public function test_activate_uninstallable() {

		$this->install_mock_plugin( 'uninstallable' );

		$this->assertFalse( is_plugin_active( $this->boost_mock_filename ) );

		$body = array(
			'products' => array( 'boost' ),
		);
		// Activate.
		$request = new WP_REST_Request( 'POST', '/my-jetpack/v1/site/products/activate' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( $body ) );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'plugin_php_incompatible', $data['code'] );
		$this->assertFalse( is_plugin_active( $this->boost_mock_filename ) );
	}
}
