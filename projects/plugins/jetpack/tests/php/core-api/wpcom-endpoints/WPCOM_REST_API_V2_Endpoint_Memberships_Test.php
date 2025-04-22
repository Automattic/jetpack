<?php
/**
 * Tests for /wpcom/v2/external-media endpoints.
 */

use WpOrg\Requests\Requests;

require_once dirname( __DIR__, 2 ) . '/lib/Jetpack_REST_TestCase.php';

/**
 * Class WPCOM_REST_API_V2_Endpoint_Memberships_Test
 */
class WPCOM_REST_API_V2_Endpoint_Memberships_Test extends Jetpack_REST_TestCase {

	/**
	 * Mock admin user ID.
	 *
	 * @var int
	 */
	private static $user_id = 0;

	/**
	 * Mock author user ID.
	 *
	 * @var int
	 */
	private static $author_id = 0;

	/**
	 * Mock blog ID.
	 *
	 * @var int
	 */
	private static $blog_id = 123;

	/**
	 * Create shared database fixtures.
	 *
	 * @param WP_UnitTest_Factory $factory Fixture factory.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		static::$user_id   = $factory->user->create( array( 'role' => 'administrator' ) );
		static::$author_id = $factory->user->create( array( 'role' => 'author' ) );
	}

	/**
	 * Setup the environment for a test.
	 */
	public function set_up() {
		wp_set_current_user( static::$user_id );

		add_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ) );
		add_filter( 'pre_option_jetpack_options', array( $this, 'mock_jetpack_options' ) );

		// We need to manually load the class under the context of tests since it won't get loaded
		// on 'plugins_loaded' because it needs a Jetpack Connection.
		// @phan-suppress-next-line PhanNoopNew
		new WPCOM_REST_API_V2_Endpoint_Memberships();

		// `rest_api_init` action needs to be triggered after manually loading the endpoint.
		parent::set_up();
	}

	/**
	 * Reset the environment to its original state after the test.
	 */
	public function tear_down() {
		remove_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ) );

		remove_filter( 'pre_option_jetpack_options', array( $this, 'mock_jetpack_options' ) );

		parent::tear_down();
	}

	/**
	 * Tests GET 'memberships/products' endpoint without authorization.
	 */
	public function test_list_products_no_auth() {
		wp_set_current_user( 0 );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/memberships/products' );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_forbidden', $response, 401 );
	}

	/**
	 * Tests GET 'memberships/products' endpoint with insufficient permissions.
	 */
	public function test_list_products_with_insufficient_permissions() {
		wp_set_current_user( static::$author_id );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/memberships/products' );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_unauthorized', $response, 403 );
	}

	/**
	 * Tests GET 'memberships/products' endpoint with no connected admin.
	 */
	public function test_list_products_with_non_connected_admin() {
		wp_set_current_user( $this->factory()->user->create( array( 'role' => 'administrator' ) ) );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/memberships/products' );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_unauthorized', $response, 403 );
		$this->assertSame( 'Please connect your user account to WordPress.com', $response->get_data()['message'] );
	}

	/**
	 * Tests GET 'memberships/products' endpoint with error response from WPCOM.
	 */
	public function test_list_products_with_remote_error() {
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_api_response_list_products_remote_error' ), 10, 3 );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/memberships/products' );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'dummy_error', $response, 500 );
	}

	/**
	 * Tests GET 'memberships/products' endpoint with successful response from WPCOM.
	 */
	public function test_list_products_success() {
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_api_response_list_products_remote_success' ), 10, 3 );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/memberships/products' );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array( 'products' => array() ), $response->get_data() );
	}

	/**
	 * Tests POST 'memberships/products' endpoint without authorization.
	 */
	public function test_create_products_no_auth() {
		wp_set_current_user( 0 );

		$request = new WP_REST_Request( Requests::POST, '/wpcom/v2/memberships/products' );
		$request->set_header( 'content_type', 'application/json' );
		$body = array(
			'type'     => 'donation',
			'currency' => 'USD',
		);
		$request->set_body( wp_json_encode( $body ) );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_forbidden', $response, 401 );
	}

	/**
	 * Tests POST 'memberships/products' endpoint with insufficient permissions.
	 */
	public function test_create_products_with_insufficient_permissions() {
		wp_set_current_user( static::$author_id );

		$request = new WP_REST_Request( Requests::POST, '/wpcom/v2/memberships/products' );
		$request->set_header( 'content_type', 'application/json' );
		$body = array(
			'type'     => 'donation',
			'currency' => 'USD',
		);
		$request->set_body( wp_json_encode( $body ) );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_forbidden', $response, 403 );
	}

	/**
	 * Tests POST 'memberships/products' endpoint with with invalid args.
	 */
	public function test_create_products_with_invalid_args() {
		$request = new WP_REST_Request( Requests::POST, '/wpcom/v2/memberships/products' );

		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_missing_callback_param', $response, 400 );
		$this->assertSame( 'Missing parameter(s): currency, type', $response->get_data()['message'] );
	}

	/**
	 * Tests POST 'memberships/products' endpoint with error response from WPCOM.
	 */
	public function test_create_products_with_remote_error() {
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_api_response_create_products_remote_error' ), 10, 3 );

		$request = new WP_REST_Request( Requests::POST, '/wpcom/v2/memberships/products' );
		$request->set_header( 'content_type', 'application/json' );
		$body = array(
			'type'     => 'donation',
			'currency' => 'USD',
		);
		$request->set_body( wp_json_encode( $body ) );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'dummy_error', $response, 500 );
	}

	/**
	 * Tests GET 'memberships/status' endpoint without authorization.
	 */
	public function test_get_status_no_auth() {
		wp_set_current_user( 0 );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/memberships/status' );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_forbidden', $response, 401 );
	}

	/**
	 * Tests GET 'memberships/status' endpoint with insufficient permissions.
	 */
	public function test_get_status_with_insufficient_permissions() {
		wp_set_current_user( static::$author_id );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/memberships/status' );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_unauthorized', $response, 403 );
	}

	/**
	 * Tests GET 'memberships/status' endpoint with invalid query args.
	 */
	public function test_get_status_with_invalid_args() {
		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2/memberships/status' );
		$request->set_query_params(
			array(
				'type'   => 'dummy',
				'source' => 'dummy',
			)
		);
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
		$this->assertSame( 'Invalid parameter(s): type, source', $response->get_data()['message'] );

		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2/memberships/status' );
		$request->set_query_params(
			array(
				'is_editable' => '5',
			)
		);
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
		$this->assertSame( 'Invalid parameter(s): is_editable', $response->get_data()['message'] );
	}

	/**
	 * Tests GET 'memberships/status' endpoint with error response from WPCOM.
	 */
	public function test_get_status_with_remote_error() {
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_api_response_get_status_remote_error' ), 10, 3 );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/memberships/status' );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'dummy_error', $response, 500 );
	}

	/**
	 * Tests GET 'memberships/status' endpoint with successful response from WPCOM.
	 */
	public function test_get_status_success() {
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_api_response_get_status_remote_success' ), 10, 3 );

		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2/memberships/status' );
		$request->set_query_params(
			array(
				'type'        => 'donation',
				'source'      => 'gutenberg',
				'is_editable' => 'true',
			)
		);

		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array( 'products' => array() ), $response->get_data() );
	}

	/**
	 * Tests POST 'memberships/product' endpoint without authorization.
	 */
	public function test_create_product_no_auth() {
		wp_set_current_user( 0 );

		$request = new WP_REST_Request( Requests::POST, '/wpcom/v2/memberships/product' );
		$request->set_header( 'content_type', 'application/json' );
		$body = array(
			'title'    => 'Dummy title',
			'price'    => 55,
			'currency' => 'USD',
			'interval' => 'week',
		);
		$request->set_body( wp_json_encode( $body ) );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_forbidden', $response, 401 );
	}

	/**
	 * Tests POST 'memberships/product' endpoint with insufficient permissions.
	 */
	public function test_create_product_with_insufficient_permissions() {
		wp_set_current_user( static::$author_id );

		$request = new WP_REST_Request( Requests::POST, '/wpcom/v2/memberships/product' );
		$request->set_header( 'content_type', 'application/json' );
		$body = array(
			'title'    => 'Dummy title',
			'price'    => 55,
			'currency' => 'USD',
			'interval' => 'week',
		);
		$request->set_body( wp_json_encode( $body ) );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_unauthorized', $response, 403 );
	}

	/**
	 * Tests POST 'memberships/product' endpoint with with invalid args.
	 */
	public function test_create_product_with_invalid_args() {
		$request = new WP_REST_Request( Requests::POST, '/wpcom/v2/memberships/product' );

		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_missing_callback_param', $response, 400 );
		$this->assertSame( 'Missing parameter(s): title, price, currency, interval', $response->get_data()['message'] );
	}

	/**
	 * Tests POST 'memberships/product' endpoint with error response from WPCOM.
	 */
	public function test_create_product_with_remote_error() {
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_api_response_create_product_remote_error' ), 10, 3 );

		$request = new WP_REST_Request( Requests::POST, '/wpcom/v2/memberships/product' );
		$request->set_header( 'content_type', 'application/json' );
		$body = array(
			'title'    => 'Dummy title',
			'price'    => 55,
			'currency' => 'USD',
			'interval' => 'week',
		);
		$request->set_body( wp_json_encode( $body ) );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'dummy_error', $response, 500 );
	}

	/**
	 * Tests PUT 'memberships/product/[product_id]' endpoint without authorization.
	 */
	public function test_update_product_no_auth() {
		wp_set_current_user( 0 );

		$request = new WP_REST_Request( Requests::PUT, '/wpcom/v2/memberships/product/1' );
		$request->set_header( 'content_type', 'application/json' );
		$body = array(
			'title'    => 'Dummy title',
			'price'    => 55,
			'currency' => 'USD',
			'interval' => 'week',
		);
		$request->set_body( wp_json_encode( $body ) );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_forbidden', $response, 401 );
	}

	/**
	 * Tests PUT 'memberships/product/[product_id]' endpoint with insufficient permissions.
	 */
	public function test_update_product_with_insufficient_permissions() {
		wp_set_current_user( static::$author_id );

		$request = new WP_REST_Request( Requests::POST, '/wpcom/v2/memberships/product/1' );
		$request->set_header( 'content_type', 'application/json' );
		$body = array(
			'title'    => 'Dummy title',
			'price'    => 55,
			'currency' => 'USD',
			'interval' => 'week',
		);
		$request->set_body( wp_json_encode( $body ) );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_forbidden', $response, 403 );
	}

	/**
	 * Tests PUT 'memberships/product/[product_id]' endpoint with with invalid args.
	 */
	public function test_update_product_with_invalid_args() {
		$request = new WP_REST_Request( Requests::PUT, '/wpcom/v2/memberships/product/1' );

		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_missing_callback_param', $response, 400 );
		$this->assertSame( 'Missing parameter(s): title, price, currency, interval', $response->get_data()['message'] );
	}

	/**
	 * Tests PUT 'memberships/product/[product_id]' endpoint with error response from WPCOM.
	 */
	public function test_update_product_with_remote_error() {
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_api_response_update_product_remote_error' ), 10, 3 );

		$request = new WP_REST_Request( Requests::PUT, '/wpcom/v2/memberships/product/1' );
		$request->set_header( 'content_type', 'application/json' );
		$body = array(
			'title'    => 'Dummy title',
			'price'    => 55,
			'currency' => 'USD',
			'interval' => 'week',
		);
		$request->set_body( wp_json_encode( $body ) );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'dummy_error', $response, 500 );
	}

	/**
	 * Tests DELETE 'memberships/product/[product_id]' endpoint without authorization.
	 */
	public function test_delete_product_no_auth() {
		wp_set_current_user( 0 );

		$request  = new WP_REST_Request( Requests::DELETE, '/wpcom/v2/memberships/product/1' );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_forbidden', $response, 401 );
	}

	/**
	 * Tests DELETE 'memberships/product/[product_id]' endpoint with insufficient permissions.
	 */
	public function test_delete_product_with_insufficient_permissions() {
		wp_set_current_user( static::$author_id );

		$request  = new WP_REST_Request( Requests::DELETE, '/wpcom/v2/memberships/product/1' );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_forbidden', $response, 403 );
	}

	/**
	 * Tests DELETE 'memberships/product/[product_id]' endpoint with with invalid args.
	 */
	public function test_delete_product_with_invalid_args() {
		$request = new WP_REST_Request( Requests::DELETE, '/wpcom/v2/memberships/product/1' );
		$request->set_header( 'content_type', 'application/json' );
		$body = array(
			'cancel_subscriptions' => 'Not a bool',
		);
		$request->set_body( wp_json_encode( $body ) );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
		$this->assertSame( 'Invalid parameter(s): cancel_subscriptions', $response->get_data()['message'] );
	}

	/**
	 * Tests DELETE 'memberships/product/[product_id]' endpoint with error response from WPCOM.
	 */
	public function test_delete_product_with_remote_error() {
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_api_response_delete_product_remote_error' ), 10, 3 );

		$request = new WP_REST_Request( Requests::DELETE, '/wpcom/v2/memberships/product/1' );
		$request->set_header( 'content_type', 'application/json' );
		$body = array(
			'cancel_subscriptions' => 'true',
		);
		$request->set_body( wp_json_encode( $body ) );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'dummy_error', $response, 500 );
	}

	/**
	 * Mock the user token.
	 *
	 * @return array
	 */
	public function mock_jetpack_private_options() {
		return array(
			'user_tokens' => array(
				static::$user_id => 'pretend_this_is_valid.secret.' . static::$user_id,
			),
		);
	}

	/**
	 * Mock Jetpack options.
	 *
	 * @return array
	 */
	public function mock_jetpack_options() {
		return array(
			'id' => static::$blog_id,
		);
	}

	/**
	 * Validate the "list" Jetpack API request for products and mock the response.
	 *
	 * @param bool   $response Whether to preempt an HTTP request's return value. Default false.
	 * @param array  $args     HTTP request arguments.
	 * @param string $url      The request URL.
	 * @return array
	 */
	public function mock_wpcom_api_response_list_products_remote_success( $response, $args, $url ) {
		$this->assertEquals( Requests::GET, $args['method'] );
		$this->assertStringStartsWith( 'https://public-api.wordpress.com/wpcom/v2/sites/' . static::$blog_id . '/memberships/products', $url );

		return array(
			'headers'     => array(
				'Allow' => 'GET',
			),
			'body'        => '{"products":[]}',
			'status_code' => 200,
			'response'    => array(
				'code' => 200,
			),
		);
	}

	/**
	 * Validate the "list" Jetpack API request for products and mock the response.
	 *
	 * @param bool   $response Whether to preempt an HTTP request's return value. Default false.
	 * @param array  $args     HTTP request arguments.
	 * @param string $url      The request URL.
	 * @return array
	 */
	public function mock_wpcom_api_response_list_products_remote_error( $response, $args, $url ) {
		$this->assertEquals( Requests::GET, $args['method'] );
		$this->assertStringStartsWith( 'https://public-api.wordpress.com/wpcom/v2/sites/' . static::$blog_id . '/memberships/products', $url );

		return array(
			'headers'     => array(
				'Allow' => 'GET',
			),
			'body'        => '{"code":"dummy_error","message":"Oops","data":{"status":500}}',
			'status_code' => 500,
			'response'    => array(
				'code' => 500,
			),
		);
	}

	/**
	 * Validate the Jetpack API request for creating products and mock the response.
	 *
	 * @param bool   $response Whether to preempt an HTTP request's return value. Default false.
	 * @param array  $args     HTTP request arguments.
	 * @param string $url      The request URL.
	 * @return array
	 */
	public function mock_wpcom_api_response_create_products_remote_error( $response, $args, $url ) {
		$this->assertEquals( Requests::POST, $args['method'] );
		$this->assertStringStartsWith( 'https://public-api.wordpress.com/wpcom/v2/sites/' . static::$blog_id . '/memberships/products', $url );

		$this->assertSame( '{"type":"donation","currency":"USD"}', $args['body'] );

		return array(
			'headers'     => array(
				'Allow' => 'GET',
			),
			'body'        => '{"code":"dummy_error","message":"Oops","data":{"status":500}}',
			'status_code' => 500,
			'response'    => array(
				'code' => 500,
			),
		);
	}

	/**
	 * Validate the Jetpack API request for memberships status and mock the response.
	 *
	 * @param bool   $response Whether to preempt an HTTP request's return value. Default false.
	 * @param array  $args     HTTP request arguments.
	 * @param string $url      The request URL.
	 * @return array
	 */
	public function mock_wpcom_api_response_get_status_remote_success( $response, $args, $url ) {
		$this->assertEquals( Requests::GET, $args['method'] );
		$this->assertStringStartsWith( 'https://public-api.wordpress.com/wpcom/v2/sites/' . static::$blog_id . '/memberships/status?type=donation&source=gutenberg&is_editable=1', $url );

		return array(
			'headers'     => array(
				'Allow' => 'GET',
			),
			'body'        => '{"products":[]}',
			'status_code' => 200,
			'response'    => array(
				'code' => 200,
			),
		);
	}

	/**
	 * Validate the Jetpack API request for memberships status and mock the response.
	 *
	 * @param bool   $response Whether to preempt an HTTP request's return value. Default false.
	 * @param array  $args     HTTP request arguments.
	 * @param string $url      The request URL.
	 * @return array
	 */
	public function mock_wpcom_api_response_get_status_remote_error( $response, $args, $url ) {
		$this->assertEquals( Requests::GET, $args['method'] );
		$this->assertStringStartsWith( 'https://public-api.wordpress.com/wpcom/v2/sites/' . static::$blog_id . '/memberships/status', $url );

		return array(
			'headers'     => array(
				'Allow' => 'GET',
			),
			'body'        => '{"code":"dummy_error","message":"Oops","data":{"status":500}}',
			'status_code' => 500,
			'response'    => array(
				'code' => 500,
			),
		);
	}

	/**
	 * Validate the Jetpack API request for creating memberships products and mock the response.
	 *
	 * @param bool   $response Whether to preempt an HTTP request's return value. Default false.
	 * @param array  $args     HTTP request arguments.
	 * @param string $url      The request URL.
	 * @return array
	 */
	public function mock_wpcom_api_response_create_product_remote_error( $response, $args, $url ) {
		$this->assertEquals( Requests::POST, $args['method'] );
		$this->assertStringStartsWith( 'https://public-api.wordpress.com/wpcom/v2/sites/' . static::$blog_id . '/memberships/product', $url );
		$this->assertSame( '{"title":"Dummy title","price":55,"currency":"USD","interval":"week"}', $args['body'] );

		return array(
			'headers'     => array(
				'Allow' => 'POST',
			),
			'body'        => '{"code":"dummy_error","message":"Oops","data":{"status":500}}',
			'status_code' => 500,
			'response'    => array(
				'code' => 500,
			),
		);
	}

	/**
	 * Validate the Jetpack API request for creating memberships products and mock the response.
	 *
	 * @param bool   $response Whether to preempt an HTTP request's return value. Default false.
	 * @param array  $args     HTTP request arguments.
	 * @param string $url      The request URL.
	 * @return array
	 */
	public function mock_wpcom_api_response_update_product_remote_error( $response, $args, $url ) {
		$this->assertEquals( Requests::PUT, $args['method'] );
		$this->assertStringStartsWith( 'https://public-api.wordpress.com/wpcom/v2/sites/' . static::$blog_id . '/memberships/product/1', $url );
		$this->assertSame( '{"title":"Dummy title","price":55,"currency":"USD","interval":"week"}', $args['body'] );

		return array(
			'headers'     => array(
				'Allow' => 'PUT',
			),
			'body'        => '{"code":"dummy_error","message":"Oops","data":{"status":500}}',
			'status_code' => 500,
			'response'    => array(
				'code' => 500,
			),
		);
	}

	/**
	 * Validate the Jetpack API request for creating memberships products and mock the response.
	 *
	 * @param bool   $response Whether to preempt an HTTP request's return value. Default false.
	 * @param array  $args     HTTP request arguments.
	 * @param string $url      The request URL.
	 * @return array
	 */
	public function mock_wpcom_api_response_delete_product_remote_error( $response, $args, $url ) {
		$this->assertEquals( Requests::DELETE, $args['method'] );
		$this->assertStringStartsWith( 'https://public-api.wordpress.com/wpcom/v2/sites/' . static::$blog_id . '/memberships/product/1', $url );
		$this->assertSame( '{"cancel_subscriptions":"true"}', $args['body'] );

		return array(
			'headers'     => array(
				'Allow' => 'DELETE',
			),
			'body'        => '{"code":"dummy_error","message":"Oops","data":{"status":500}}',
			'status_code' => 500,
			'response'    => array(
				'code' => 500,
			),
		);
	}
}
