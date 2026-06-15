<?php
/**
 * Tests for /wpcom/v2/external-media endpoints.
 *
 * @covers WPCOM_REST_API_V2_Endpoint_Memberships
 */

use PHPUnit\Framework\Attributes\CoversClass;
use WpOrg\Requests\Requests;

require_once dirname( __DIR__, 2 ) . '/lib/Jetpack_REST_TestCase.php';

/**
 * Class WPCOM_REST_API_V2_Endpoint_Memberships_Test
 *
 * @covers \WPCOM_REST_API_V2_Endpoint_Memberships
 */
#[CoversClass( WPCOM_REST_API_V2_Endpoint_Memberships::class )]
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
		$request->set_body( wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );
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
		$request->set_body( wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );
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
		$request->set_body( wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );
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
		$request->set_body( wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );
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
		$request->set_body( wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );
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
	 * Tests get_payload_for_product includes description when provided.
	 */
	public function test_get_payload_for_product_includes_description_when_provided() {
		$endpoint = new WPCOM_REST_API_V2_Endpoint_Memberships();
		$request  = new WP_REST_Request( Requests::POST, '/wpcom/v2/memberships/product' );
		$request->set_body_params(
			array(
				'title'       => 'Premium Tier',
				'price'       => 10,
				'currency'    => 'USD',
				'interval'    => '1 month',
				'type'        => 'tier',
				'description' => 'Full archive access and community Q&A',
			)
		);

		$reflection = new ReflectionClass( $endpoint );
		$method     = $reflection->getMethod( 'get_payload_for_product' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$payload = $method->invoke( $endpoint, $request );

		$this->assertSame( 'Full archive access and community Q&A', $payload['description'] );
	}

	/**
	 * Tests get_payload_for_product omits description when not provided.
	 */
	public function test_get_payload_for_product_omits_description_when_not_provided() {
		$endpoint = new WPCOM_REST_API_V2_Endpoint_Memberships();
		$request  = new WP_REST_Request( Requests::POST, '/wpcom/v2/memberships/product' );
		$request->set_body_params(
			array(
				'title'    => 'Premium Tier',
				'price'    => 10,
				'currency' => 'USD',
				'interval' => '1 month',
				'type'     => 'tier',
			)
		);

		$reflection = new ReflectionClass( $endpoint );
		$method     = $reflection->getMethod( 'get_payload_for_product' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$payload = $method->invoke( $endpoint, $request );

		$this->assertArrayNotHasKey( 'description', $payload );
	}

	/**
	 * Tests POST 'memberships/product' forwards description in the proxied WPCOM request.
	 */
	public function test_create_product_forwards_description_in_wpcom_request() {
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_api_response_create_product_with_description' ), 10, 3 );

		$request = new WP_REST_Request( Requests::POST, '/wpcom/v2/memberships/product' );
		$request->set_header( 'content_type', 'application/json' );
		$body = array(
			'title'       => 'Premium Tier',
			'price'       => 10,
			'currency'    => 'USD',
			'interval'    => '1 month',
			'type'        => 'tier',
			'description' => 'Full archive access and community Q&A',
		);
		$request->set_body( wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'Full archive access and community Q&A', $response->get_data()['description'] );
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
		$request->set_body( wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'dummy_error', $response, 500 );
	}

	/**
	 * Tests POST 'memberships/product' endpoint with invalid tier for monthly plan.
	 */
	public function test_create_product_with_invalid_tier_for_monthly_plan() {
		$request = new WP_REST_Request( Requests::POST, '/wpcom/v2/memberships/product' );
		$request->set_header( 'content_type', 'application/json' );
		$body = array(
			'title'    => 'Monthly Plan',
			'price'    => 10,
			'currency' => 'USD',
			'interval' => '1 month',
			'type'     => 'tier',
			'tier'     => 123, // Monthly plans should not have tier
		);
		$request->set_body( wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'invalid_tier_usage', $response, 400 );
	}

	/**
	 * Tests POST 'memberships/product' endpoint with invalid tier value.
	 */
	public function test_create_product_with_invalid_tier_value() {
		$request = new WP_REST_Request( Requests::POST, '/wpcom/v2/memberships/product' );
		$request->set_header( 'content_type', 'application/json' );
		$body = array(
			'title'    => 'Yearly Plan',
			'price'    => 100,
			'currency' => 'USD',
			'interval' => '1 year',
			'type'     => 'tier',
			'tier'     => -1, // Invalid tier value
		);
		$request->set_body( wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'invalid_tier_id', $response, 400 );
	}

	/**
	 * Tests POST 'memberships/product' endpoint with tier for donation product (should be allowed).
	 */
	public function test_create_donation_product_with_tier() {
		$request = new WP_REST_Request( Requests::POST, '/wpcom/v2/memberships/product' );
		$request->set_header( 'content_type', 'application/json' );
		$body = array(
			'title'    => 'Donation Plan',
			'price'    => 10,
			'currency' => 'USD',
			'interval' => '1 month',
			'type'     => 'donation',
			'tier'     => 123, // Donation products can have tier
		);
		$request->set_body( wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );
		$response = $this->server->dispatch( $request );

		// This should not fail because donation products are not subject to tier validation
		$this->assertNotEquals( 400, $response->get_status() );
	}

	/**
	 * Tests POST 'memberships/product' endpoint with tier ID that doesn't exist.
	 */
	public function test_create_product_with_nonexistent_tier() {
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_api_response_tier_not_found' ), 10, 3 );

		$request = new WP_REST_Request( Requests::POST, '/wpcom/v2/memberships/product' );
		$request->set_header( 'content_type', 'application/json' );
		$body = array(
			'title'    => 'Yearly Plan',
			'price'    => 100,
			'currency' => 'USD',
			'interval' => '1 year',
			'type'     => 'tier',
			'tier'     => 99999, // Non-existent tier ID
		);
		$request->set_body( wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'tier_not_found', $response, 400 );
	}

	/**
	 * Tests POST 'memberships/product' endpoint with tier ID that points to non-monthly plan.
	 */
	public function test_create_product_with_tier_pointing_to_non_monthly_plan() {
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_api_response_invalid_tier_interval' ), 10, 3 );

		$request = new WP_REST_Request( Requests::POST, '/wpcom/v2/memberships/product' );
		$request->set_header( 'content_type', 'application/json' );
		$body = array(
			'title'    => 'Yearly Plan',
			'price'    => 100,
			'currency' => 'USD',
			'interval' => '1 year',
			'type'     => 'tier',
			'tier'     => 456, // Tier ID pointing to a non-monthly plan
		);
		$request->set_body( wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'invalid_tier_interval', $response, 400 );
	}

	/**
	 * Tests POST 'memberships/product' endpoint with duplicate tier reference.
	 */
	public function test_create_product_with_duplicate_tier_reference() {
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_api_response_duplicate_tier_reference' ), 10, 3 );

		$request = new WP_REST_Request( Requests::POST, '/wpcom/v2/memberships/product' );
		$request->set_header( 'content_type', 'application/json' );
		$body = array(
			'title'    => 'Yearly Plan',
			'price'    => 100,
			'currency' => 'USD',
			'interval' => '1 year',
			'type'     => 'tier',
			'tier'     => 789, // Tier ID already referenced by another yearly plan
		);
		$request->set_body( wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'duplicate_tier_reference', $response, 400 );
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
		$request->set_body( wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );
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
		$request->set_body( wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );
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
	 * Tests PUT 'memberships/product/[product_id]' forwards description in the proxied WPCOM request.
	 */
	public function test_update_product_forwards_description_in_wpcom_request() {
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_api_response_update_product_with_description' ), 10, 3 );

		$request = new WP_REST_Request( Requests::PUT, '/wpcom/v2/memberships/product/123' );
		$request->set_header( 'content_type', 'application/json' );
		$body = array(
			'title'       => 'Premium Tier',
			'price'       => 10,
			'currency'    => 'USD',
			'interval'    => '1 month',
			'type'        => 'tier',
			'description' => 'Updated tier description for subscribers',
		);
		$request->set_body( wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'Updated tier description for subscribers', $response->get_data()['product']['description'] );
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
		$request->set_body( wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'dummy_error', $response, 500 );
	}

	/**
	 * Tests PUT 'memberships/product/{id}' endpoint with invalid tier for monthly plan.
	 */
	public function test_update_product_with_invalid_tier_for_monthly_plan() {
		// Mock the WPCOM API response for product creation
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_api_response_create_product_success' ), 10, 3 );

		// First create a product
		$create_request = new WP_REST_Request( Requests::POST, '/wpcom/v2/memberships/product' );
		$create_request->set_header( 'content_type', 'application/json' );
		$create_body = array(
			'title'    => 'Monthly Plan',
			'price'    => 10,
			'currency' => 'USD',
			'interval' => '1 month',
			'type'     => 'tier',
		);
		$create_request->set_body( wp_json_encode( $create_body, JSON_UNESCAPED_SLASHES ) );
		$create_response = $this->server->dispatch( $create_request );
		$product_data    = $create_response->get_data();
		$product_id      = $product_data['id'];

		// Remove the create mock and add update mock
		remove_filter( 'pre_http_request', array( $this, 'mock_wpcom_api_response_create_product_success' ), 10 );
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_api_response_update_product_remote_error' ), 10, 3 );

		// Now try to update it with an invalid tier
		$update_request = new WP_REST_Request( Requests::PUT, "/wpcom/v2/memberships/product/$product_id" );
		$update_request->set_header( 'content_type', 'application/json' );
		$update_body = array(
			'title'    => 'Updated Monthly Plan',
			'price'    => 15,
			'currency' => 'USD',
			'interval' => '1 month',
			'type'     => 'tier',
			'tier'     => 123, // Monthly plans should not have tier
		);
		$update_request->set_body( wp_json_encode( $update_body, JSON_UNESCAPED_SLASHES ) );
		$update_response = $this->server->dispatch( $update_request );

		$this->assertErrorResponse( 'invalid_tier_usage', $update_response, 400 );
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
		$request->set_body( wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );
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
		$request->set_body( wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );
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
	public function mock_wpcom_api_response_create_product_with_description( $response, $args, $url ) {
		$this->assertEquals( Requests::POST, $args['method'] );
		$this->assertStringStartsWith( 'https://public-api.wordpress.com/wpcom/v2/sites/' . static::$blog_id . '/memberships/product', $url );

		$this->assertStringContainsString( '"description":"Full archive access and community Q&A"', $args['body'] );

		return array(
			'headers'     => array(
				'Allow' => 'POST',
			),
			'body'        => '{"id":123,"title":"Premium Tier","price":10,"currency":"USD","interval":"1 month","type":"tier","description":"Full archive access and community Q&A"}',
			'status_code' => 200,
			'response'    => array(
				'code' => 200,
			),
		);
	}

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
	public function mock_wpcom_api_response_update_product_with_description( $response, $args, $url ) {
		$this->assertEquals( Requests::PUT, $args['method'] );
		$this->assertStringStartsWith( 'https://public-api.wordpress.com/wpcom/v2/sites/' . static::$blog_id . '/memberships/product/123', $url );

		$this->assertStringContainsString( '"description":"Updated tier description for subscribers"', $args['body'] );

		return array(
			'headers'     => array(
				'Allow' => 'PUT',
			),
			'body'        => '{"product":{"id":123,"title":"Premium Tier","price":10,"currency":"USD","interval":"1 month","type":"tier","description":"Updated tier description for subscribers"}}',
			'status_code' => 200,
			'response'    => array(
				'code' => 200,
			),
		);
	}

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

	/**
	 * Validate the Jetpack API request for creating memberships products and mock the successful response.
	 *
	 * @param bool   $response Whether to preempt an HTTP request's return value. Default false.
	 * @param array  $args     HTTP request arguments.
	 * @param string $url      The request URL.
	 * @return array
	 */
	public function mock_wpcom_api_response_create_product_success( $response, $args, $url ) {
		$this->assertEquals( Requests::POST, $args['method'] );
		$this->assertStringStartsWith( 'https://public-api.wordpress.com/wpcom/v2/sites/' . static::$blog_id . '/memberships/product', $url );

		return array(
			'headers'     => array(
				'Allow' => 'POST',
			),
			'body'        => '{"id":123,"title":"Monthly Plan","price":10,"currency":"USD","interval":"1 month","type":"tier"}',
			'status_code' => 200,
			'response'    => array(
				'code' => 200,
			),
		);
	}

	/**
	 * Mock WPCOM API response for tier not found error.
	 *
	 * @param bool   $response Whether to preempt an HTTP request's return value. Default false.
	 * @param array  $args     HTTP request arguments.
	 * @param string $url      The request URL.
	 * @return array
	 */
	public function mock_wpcom_api_response_tier_not_found( $response, $args, $url ) {
		$this->assertEquals( Requests::POST, $args['method'] );
		$this->assertStringStartsWith( 'https://public-api.wordpress.com/wpcom/v2/sites/' . static::$blog_id . '/memberships/product', $url );

		return array(
			'headers'     => array(
				'Allow' => 'POST',
			),
			'body'        => '{"code":"tier_not_found","message":"The specified tier ID does not correspond to an existing monthly plan.","data":{"status":400}}',
			'status_code' => 400,
			'response'    => array(
				'code' => 400,
			),
		);
	}

	/**
	 * Mock WPCOM API response for invalid tier interval error.
	 *
	 * @param bool   $response Whether to preempt an HTTP request's return value. Default false.
	 * @param array  $args     HTTP request arguments.
	 * @param string $url      The request URL.
	 * @return array
	 */
	public function mock_wpcom_api_response_invalid_tier_interval( $response, $args, $url ) {
		$this->assertEquals( Requests::POST, $args['method'] );
		$this->assertStringStartsWith( 'https://public-api.wordpress.com/wpcom/v2/sites/' . static::$blog_id . '/memberships/product', $url );

		return array(
			'headers'     => array(
				'Allow' => 'POST',
			),
			'body'        => '{"code":"invalid_tier_interval","message":"The specified tier ID must point to a monthly plan (1 month interval).","data":{"status":400}}',
			'status_code' => 400,
			'response'    => array(
				'code' => 400,
			),
		);
	}

	/**
	 * Mock WPCOM API response for duplicate tier reference error.
	 *
	 * @param bool   $response Whether to preempt an HTTP request's return value. Default false.
	 * @param array  $args     HTTP request arguments.
	 * @param string $url      The request URL.
	 * @return array
	 */
	public function mock_wpcom_api_response_duplicate_tier_reference( $response, $args, $url ) {
		$this->assertEquals( Requests::POST, $args['method'] );
		$this->assertStringStartsWith( 'https://public-api.wordpress.com/wpcom/v2/sites/' . static::$blog_id . '/memberships/product', $url );

		return array(
			'headers'     => array(
				'Allow' => 'POST',
			),
			'body'        => '{"code":"duplicate_tier_reference","message":"Another yearly plan already references this monthly plan. Each monthly plan can only have one corresponding yearly plan.","data":{"status":400}}',
			'status_code' => 400,
			'response'    => array(
				'code' => 400,
			),
		);
	}

	/**
	 * Test validate_tier_field method with null tier (should pass).
	 */
	public function test_validate_tier_field_with_null_tier() {
		$endpoint = new WPCOM_REST_API_V2_Endpoint_Memberships();
		$request  = new WP_REST_Request();

		$reflection = new ReflectionClass( $endpoint );
		$method     = $reflection->getMethod( 'validate_tier_field' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$result = $method->invoke( $endpoint, $request, null, 'tier', '1 month' );
		$this->assertNull( $result );
	}

	/**
	 * Test validate_tier_field method with non-tier type (should pass).
	 */
	public function test_validate_tier_field_with_non_tier_type() {
		$endpoint = new WPCOM_REST_API_V2_Endpoint_Memberships();
		$request  = new WP_REST_Request();

		$reflection = new ReflectionClass( $endpoint );
		$method     = $reflection->getMethod( 'validate_tier_field' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$result = $method->invoke( $endpoint, $request, 123, 'donation', '1 month' );
		$this->assertNull( $result );
	}

	/**
	 * Test validate_tier_field method with monthly plan and tier (should fail).
	 */
	public function test_validate_tier_field_with_monthly_plan_and_tier() {
		$endpoint = new WPCOM_REST_API_V2_Endpoint_Memberships();
		$request  = new WP_REST_Request();

		$reflection = new ReflectionClass( $endpoint );
		$method     = $reflection->getMethod( 'validate_tier_field' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$result = $method->invoke( $endpoint, $request, 123, 'tier', '1 month' );
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertEquals( 'invalid_tier_usage', $result->get_error_code() );
	}

	/**
	 * Test validate_yearly_tier method with invalid tier value.
	 */
	public function test_validate_yearly_tier_with_invalid_value() {
		$endpoint = new WPCOM_REST_API_V2_Endpoint_Memberships();
		$request  = new WP_REST_Request();

		$reflection = new ReflectionClass( $endpoint );
		$method     = $reflection->getMethod( 'validate_yearly_tier' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$result = $method->invoke( $endpoint, $request, -1 );
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertEquals( 'invalid_tier_id', $result->get_error_code() );
	}

	/**
	 * Test validate_yearly_tier method with non-numeric tier.
	 */
	public function test_validate_yearly_tier_with_non_numeric_tier() {
		$endpoint = new WPCOM_REST_API_V2_Endpoint_Memberships();
		$request  = new WP_REST_Request();

		$reflection = new ReflectionClass( $endpoint );
		$method     = $reflection->getMethod( 'validate_yearly_tier' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$result = $method->invoke( $endpoint, $request, 'invalid' );
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertEquals( 'invalid_tier_id', $result->get_error_code() );
	}
}
