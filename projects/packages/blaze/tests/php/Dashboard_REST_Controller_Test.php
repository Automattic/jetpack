<?php
/**
 * This file contains PHPUnit tests for the Dashboard_REST_Controller class.
 * To run the package unit tests, run jetpack test php packages/blaze
 *
 * @package automattic/jetpack-blaze
 */

namespace Automattic\Jetpack\Blaze;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Sync\Health;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WP_REST_Request;
use WP_REST_Server;

/**
 * PHPUnit tests for the Dashboard_REST_Controller class.
 *
 * These tests use PHPUnit mocks for the Connection_Manager to control
 * connection state, and use the `pre_http_request` filter to mock HTTP
 * responses from Client::wpcom_json_api_request_as_user() without making
 * actual network requests.
 *
 * @covers \Automattic\Jetpack\Blaze\Dashboard_REST_Controller
 */
#[CoversClass( Dashboard_REST_Controller::class )]
class Dashboard_REST_Controller_Test extends BaseTestCase {
	/**
	 * Admin user id
	 *
	 * @var int
	 */
	protected $admin_id;

	/**
	 * Editor user id
	 *
	 * @var int
	 */
	protected $editor_id;

	/**
	 * REST Server object.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * Site ID for testing.
	 *
	 * @var int
	 */
	private $site_id = 999;

	/**
	 * Post ID for testing.
	 *
	 * @var int
	 */
	private $post_id;

	/**
	 * Dashboard REST Controller instance.
	 *
	 * @var Dashboard_REST_Controller
	 */
	private $controller;

	/**
	 * Whether the site is connected (used by dynamic mock).
	 *
	 * @var bool
	 */
	private $is_connected = true;

	/**
	 * Whether the user is connected (used by dynamic mock).
	 *
	 * @var bool
	 */
	private $is_user_connected = true;

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();

		global $wp_rest_server;

		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		// Mock the site ID for route registration.
		add_filter( 'jetpack_options', array( $this, 'mock_jetpack_site_connection_options' ), 10, 2 );

		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'dummy_user',
				'user_pass'  => 'dummy_pass',
				'role'       => 'administrator',
			)
		);

		$this->editor_id = wp_insert_user(
			array(
				'user_login' => 'dummy_user_2',
				'user_pass'  => 'dummy_pass_2',
				'role'       => 'editor',
			)
		);
		wp_set_current_user( 0 );

		$this->post_id = wp_insert_post(
			array(
				'post_title'   => 'Test Post for Blaze',
				'post_content' => 'Some awesome content to promote',
				'post_status'  => 'publish',
				'post_author'  => $this->admin_id,
			),
			true
		);

		// Reset connection state to defaults (connected).
		$this->is_connected      = true;
		$this->is_user_connected = true;

		// Initialize the controller with a mocked connection manager.
		// The mock uses callbacks so connection state can be changed per-test.
		$connection_manager = $this->get_mocked_connection_manager();
		$this->controller   = new Dashboard_REST_Controller( $connection_manager );

		add_action( 'rest_api_init', array( $this->controller, 'register_rest_routes' ) );
		do_action( 'rest_api_init' );

		// Set default sync status to IN_SYNC.
		Health::update_status( Health::STATUS_IN_SYNC );

		// Hook into WP_Query to return our mock post
		add_filter( 'the_posts', array( $this, 'mock_wp_query_posts' ), 10, 2 );
	}

	/**
	 * Tear down after each test.
	 */
	public function tearDown(): void {
		parent::tearDown();

		unset( $_SERVER['REQUEST_METHOD'] );
		wp_set_current_user( 0 );

		remove_filter( 'jetpack_options', array( $this, 'mock_jetpack_site_connection_options' ) );

		// Clean up HTTP request mocks to prevent interference between tests.
		remove_all_filters( 'pre_http_request' );

		// Clean up attachment media filter.
		remove_all_filters( 'get_attached_media' );

		if ( $this->controller ) {
			remove_action( 'rest_api_init', array( $this->controller, 'register_rest_routes' ) );
		}

		remove_filter( 'the_posts', array( $this, 'mock_wp_query_posts' ), 10 );
	}

	/**
	 * Mock Jetpack site ID and tokens for route registration and API requests
	 *
	 * @param mixed  $value The option value.
	 * @param string $name  The option name.
	 * @return mixed
	 */
	public function mock_jetpack_site_connection_options( $value, $name ) {
		switch ( $name ) {
			case 'blog_token':
				return 'test.blogtoken.123';
			case 'id':
				return $this->site_id;
			case 'user_tokens':
				$current_user_id = get_current_user_id();
				if ( $current_user_id ) {
					return array(
						$current_user_id => sprintf( 'token%d.secret%d.%d', $current_user_id, $current_user_id, $current_user_id ),
					);
				}
		}

		return $value;
	}

	/**
	 * Create a stubbed Connection_Manager instance.
	 *
	 * The mock uses callbacks that reference $this->is_connected and $this->is_user_connected,
	 * allowing tests to change connection state without re-creating the controller.
	 *
	 * @return Connection_Manager PHPUnit stub object.
	 */
	private function get_mocked_connection_manager() {
		$connection_manager = $this->createStub( Connection_Manager::class );
		$connection_manager->method( 'is_connected' )->willReturnCallback(
			function () {
				return $this->is_connected;
			}
		);
		$connection_manager->method( 'is_user_connected' )->willReturnCallback(
			function () {
				return $this->is_user_connected;
			}
		);
		$connection_manager->method( 'get_site_id' )->willReturn( $this->site_id );

		return $connection_manager;
	}

	/**
	 * Mock WP_Query to return our test post.
	 *
	 * @param array|null $posts The posts array (null by default).
	 * @param \WP_Query  $query The WP_Query instance.
	 * @return array|null
	 */
	public function mock_wp_query_posts( $posts, $query ) {
		$post_types = (array) $query->get( 'post_type' );

		if ( in_array( 'post', $post_types, true ) || in_array( 'page', $post_types, true ) || in_array( 'any', $post_types, true ) ) {
			$query->found_posts   = 1;
			$query->max_num_pages = 1;

			$post = get_post( $this->post_id );

			return array( $post );
		}

		return $posts;
	}

	/**
	 * Test the function can_user_view_dsp_callback checks for authentication.
	 */
	public function test_endpoints_requires_authentication() {
		// Set connection state to disconnected - the mock callbacks will read these values.
		$this->is_connected      = false;
		$this->is_user_connected = false;

		$request  = new WP_REST_Request( 'GET', sprintf( '/jetpack/v4/blaze-app/sites/%d/blaze/posts', $this->site_id ) );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 401, $response->get_status() );
	}

	/**
	 * Test the function can_user_view_dsp_callback with editor user (should fail)
	 */
	public function test_endpoints_requires_admin_permission() {
		// Set current user to editor (not admin)
		wp_set_current_user( $this->editor_id );

		$request  = new WP_REST_Request( 'GET', sprintf( '/jetpack/v4/blaze-app/sites/%d/blaze/posts', $this->site_id ) );
		$response = $this->server->dispatch( $request );

		// Should fail because editor doesn't have manage_options capability
		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * Test GET sites/%d/blaze/posts endpoint with successful request
	 */
	public function test_blaze_posts_returns_posts_successfully() {
		wp_set_current_user( $this->admin_id );

		// Capture HTTP request for verification
		$captured_request = null;
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( &$captured_request ) {
				// Capture the request for verification
				if ( strpos( $url, sprintf( '/sites/%d/blaze/posts', $this->site_id ) ) !== false ) {
					$captured_request = array(
						'url'  => $url,
						'args' => $args,
					);

					// Return mock successful response
					return array(
						'response' => array(
							'code'    => 200,
							'message' => 'OK',
						),
						'headers'  => array(
							'content-type' => 'application/json',
						),
						'body'     => wp_json_encode(
							array(
								'posts' => array(
									array(
										'ID'      => 123,
										'title'   => 'Test Post 1',
										'type'    => 'post',
										'excerpt' => 'This is a test post',
										'URL'     => 'https://example.com/test-post-1',
									),
									array(
										'ID'      => 456,
										'title'   => 'Test Post 2',
										'type'    => 'post',
										'excerpt' => 'This is another test post',
										'URL'     => 'https://example.com/test-post-2',
									),
								),
							),
							JSON_UNESCAPED_SLASHES
						),
					);
				}
				return $preempt;
			},
			10,
			3
		);

		$request  = new WP_REST_Request( 'GET', sprintf( '/jetpack/v4/blaze-app/sites/%d/blaze/posts', $this->site_id ) );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertIsArray( $data );
		$this->assertIsArray( $data['posts'] );
		$this->assertCount( 2, $data['posts'] );

		// Verify first post structure
		$first_post = $data['posts'][0];
		$this->assertSame( 123, $first_post['ID'] );
		$this->assertSame( 'Test Post 1', $first_post['title'] );
		$this->assertSame( 'post', $first_post['type'] );

		// Verify the HTTP request was made with correct method
		$this->assertNotNull( $captured_request, 'HTTP request should be made' );
		$this->assertSame( 'GET', $captured_request['args']['method'] );
	}

	/**
	 * Test GET sites/%d/blaze/posts endpoint with query parameters
	 */
	public function test_blaze_posts_forwards_query_parameters() {
		wp_set_current_user( $this->admin_id );

		// Capture HTTP request for verification
		$captured_request = null;
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( &$captured_request ) {
				if ( strpos( $url, sprintf( '/sites/%d/blaze/posts', $this->site_id ) ) !== false ) {
					$captured_request = array(
						'url'  => $url,
						'args' => $args,
					);

					// Return mock response
					return array(
						'response' => array(
							'code'    => 200,
							'message' => 'OK',
						),
						'headers'  => array(
							'content-type' => 'application/json',
						),
						'body'     => wp_json_encode(
							array(
								'posts' => array(
									array(
										'ID'      => 123,
										'title'   => 'Test Post 1',
										'type'    => 'post',
										'excerpt' => 'This is a test post',
										'URL'     => 'https://example.com/test-post-1',
									),
								),
							),
							JSON_UNESCAPED_SLASHES
						),
					);
				}
				return $preempt;
			},
			10,
			3
		);

		$request = new WP_REST_Request( 'GET', sprintf( '/jetpack/v4/blaze-app/sites/%d/blaze/posts', $this->site_id ) );
		$request->set_query_params(
			array(
				'search' => 'test',
				'number' => 10,
			)
		);
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		// Verify query parameters are present in the URL
		$this->assertNotNull( $captured_request, 'HTTP request should be made' );
		$this->assertStringContainsString( 'search=test', $captured_request['url'] );
		$this->assertStringContainsString( 'number=10', $captured_request['url'] );
	}

	/**
	 * Test GET sites/%d/blaze/posts endpoint returns error from WPCOM
	 */
	public function test_blaze_posts_handles_wpcom_error() {
		wp_set_current_user( $this->admin_id );

		// Mock error response from WPCOM
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) {
				if ( strpos( $url, sprintf( '/sites/%d/blaze/posts', $this->site_id ) ) !== false ) {
					// Return mock error response
					return array(
						'response' => array(
							'code'    => 500,
							'message' => 'Internal Server Error',
						),
						'headers'  => array(
							'content-type' => 'application/json',
						),
						'body'     => wp_json_encode(
							array(
								'error'        => 'internal_error',
								'errorMessage' => 'An error occurred while fetching posts',
							),
							JSON_UNESCAPED_SLASHES
						),
					);
				}
				return $preempt;
			},
			10,
			3
		);

		$request  = new WP_REST_Request( 'GET', sprintf( '/jetpack/v4/blaze-app/sites/%d/blaze/posts', $this->site_id ) );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 500, $response->get_status() );

		$data = $response->get_data();
		$this->assertArrayHasKey( 'code', $data );
		$this->assertArrayHasKey( 'errorMessage', $data );
	}

	/**
	 * Test that add_prices_in_posts adds prices for WooCommerce products.
	 *
	 * This test uses the WooCommerce mocks loaded via bootstrap.php.
	 */
	public function test_add_prices_in_posts_with_woocommerce_products() {
		wp_set_current_user( $this->admin_id );

		// Mock HTTP response with product posts
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) {
				if ( strpos( $url, sprintf( '/sites/%d/blaze/posts', $this->site_id ) ) !== false ) {
					return array(
						'response' => array(
							'code'    => 200,
							'message' => 'OK',
						),
						'headers'  => array(
							'content-type' => 'application/json',
						),
						'body'     => wp_json_encode(
							array(
								'posts' => array(
									array(
										'ID'    => 100,
										'title' => 'Product 1',
										'type'  => 'product',
									),
									array(
										'ID'    => 200,
										'title' => 'Product 2',
										'type'  => 'product',
									),
									array(
										'ID'    => 300,
										'title' => 'Regular Post (not a product)',
										'type'  => 'post',
									),
								),
							),
							JSON_UNESCAPED_SLASHES
						),
					);
				}
				return $preempt;
			},
			10,
			3
		);

		$request  = new WP_REST_Request( 'GET', sprintf( '/jetpack/v4/blaze-app/sites/%d/blaze/posts', $this->site_id ) );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertIsArray( $data['posts'] );
		$this->assertCount( 3, $data['posts'] );

		// Verify prices are added based on our mock (ID 100 = $19.99, ID 200 = $29.99, ID 300 = not a product)
		$this->assertSame( '$19.99', $data['posts'][0]['price'] );
		$this->assertSame( '$29.99', $data['posts'][1]['price'] );
		$this->assertSame( '', $data['posts'][2]['price'] ); // Not a product, so empty price
	}

	/**
	 * Test that add_prices_in_posts handles posts without ID gracefully.
	 */
	public function test_add_prices_in_posts_handles_missing_id() {
		wp_set_current_user( $this->admin_id );

		// Mock HTTP response with a post missing ID
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) {
				if ( strpos( $url, sprintf( '/sites/%d/blaze/posts', $this->site_id ) ) !== false ) {
					return array(
						'response' => array(
							'code'    => 200,
							'message' => 'OK',
						),
						'headers'  => array(
							'content-type' => 'application/json',
						),
						'body'     => wp_json_encode(
							array(
								'posts' => array(
									array(
										'title' => 'Post without ID',
										'type'  => 'post',
									),
								),
							),
							JSON_UNESCAPED_SLASHES
						),
					);
				}
				return $preempt;
			},
			10,
			3
		);

		$request  = new WP_REST_Request( 'GET', sprintf( '/jetpack/v4/blaze-app/sites/%d/blaze/posts', $this->site_id ) );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertIsArray( $data['posts'] );
		$this->assertCount( 1, $data['posts'] );

		// Post without ID should get empty price
		$this->assertSame( '', $data['posts'][0]['price'] );
	}

	/**
	 * Test that edit_dsp_generic correctly redirects POST requests to WPCOM.
	 *
	 * This is a minimal test to verify the redirection happens with the correct
	 * URL and method. Use this as a template for testing other endpoints that
	 * use edit_dsp_generic or get_dsp_generic.
	 */
	public function test_edit_dsp_generic_redirects_to_wpcom() {
		wp_set_current_user( $this->admin_id );

		// Capture the redirected request
		$captured_request = null;
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( &$captured_request ) {
				// Capture requests to the WPCOM checkout endpoint
				if ( strpos( $url, '/wordads/dsp/api/v1/wpcom/checkout' ) !== false ) {
					$captured_request = array(
						'url'    => $url,
						'method' => $args['method'],
					);

					return array(
						'response' => array(
							'code'    => 200,
							'message' => 'OK',
						),
						'headers'  => array(
							'content-type' => 'application/json',
						),
						'body'     => wp_json_encode( array( 'success' => true ), JSON_UNESCAPED_SLASHES ),
					);
				}
				return $preempt;
			},
			10,
			3
		);

		$request = new WP_REST_Request( 'POST', sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1/wpcom/checkout', $this->site_id ) );
		$request->set_header( 'Content-Type', 'application/json' );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		// Verify the request was redirected to WPCOM with correct URL and method
		$this->assertNotNull( $captured_request, 'Request should be redirected to WPCOM' );
		$this->assertStringContainsString( '/wordads/dsp/api/v1/wpcom/checkout', $captured_request['url'] );
		$this->assertSame( 'POST', $captured_request['method'] );
	}

	/**
	 * Test that get_dsp_generic correctly redirects GET requests to WPCOM.
	 *
	 * This is a minimal test to verify the redirection happens with the correct
	 * URL and method. Use this as a template for testing other endpoints.
	 */
	public function test_get_dsp_generic_redirects_to_wpcom() {
		wp_set_current_user( $this->admin_id );

		// Capture the redirected request
		$captured_request = null;
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( &$captured_request ) {
				// Capture requests to the WPCOM credits endpoint
				if ( strpos( $url, '/wordads/dsp/api/v1/credits' ) !== false ) {
					$captured_request = array(
						'url'    => $url,
						'method' => $args['method'],
					);

					return array(
						'response' => array(
							'code'    => 200,
							'message' => 'OK',
						),
						'headers'  => array(
							'content-type' => 'application/json',
						),
						'body'     => wp_json_encode( array( 'credits' => 100 ), JSON_UNESCAPED_SLASHES ),
					);
				}
				return $preempt;
			},
			10,
			3
		);

		$request  = new WP_REST_Request( 'GET', sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1/credits', $this->site_id ) );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		// Verify the request was redirected to WPCOM with correct URL and method
		$this->assertNotNull( $captured_request, 'Request should be redirected to WPCOM' );
		$this->assertStringContainsString( '/wordads/dsp/api/v1/credits', $captured_request['url'] );
		$this->assertSame( 'GET', $captured_request['method'] );
	}

	/**
	 * Helper method to create an image attachment for a post.
	 *
	 * Note: WorDBless doesn't persist attachments to the database, so get_attached_media()
	 * won't find them. This method creates the attachment for get_post() and metadata,
	 * then uses a filter to make get_attached_media() return it.
	 *
	 * @param int    $parent_post_id The parent post ID.
	 * @param string $mime_type      The MIME type (default: 'image/png').
	 * @param int    $width          The image width (default: 1024).
	 * @param int    $height         The image height (default: 768).
	 * @return int The attachment ID.
	 */
	private function create_image_attachment( $parent_post_id, $mime_type = 'image/png', $width = 1024, $height = 768 ) {
		$extension  = 'image/png' === $mime_type ? 'png' : 'jpg';
		$attachment = array(
			'post_title'     => 'Test Attachment Image',
			'post_content'   => '',
			'post_type'      => 'attachment',
			'post_parent'    => $parent_post_id,
			'post_mime_type' => $mime_type,
			'guid'           => 'http://example.org/wp-content/uploads/test-attachment.' . $extension,
		);

		$attachment_id = wp_insert_attachment( $attachment, 'test-attachment.' . $extension, $parent_post_id );
		wp_update_attachment_metadata(
			$attachment_id,
			array(
				'width'  => $width,
				'height' => $height,
				'file'   => 'test-attachment.' . $extension,
			)
		);

		// Mock get_attached_media to return our attachment since WorDBless doesn't support DB queries.
		add_filter(
			'get_attached_media',
			function ( $children, $type, $post ) use ( $attachment_id, $parent_post_id ) {
				if ( 'image' === $type && $post->ID === $parent_post_id ) {
					$children[ $attachment_id ] = get_post( $attachment_id );
				}
				return $children;
			},
			10,
			3
		);

		return $attachment_id;
	}

	/**
	 * Helper method to set up HTTP mock filter and capture redirected requests.
	 *
	 * @param string     $url_pattern Pattern to match in the WPCOM URL.
	 * @param array|null $captured_request Reference to store captured request data.
	 */
	private function setup_redirect_test( $url_pattern, &$captured_request ) {
		wp_set_current_user( $this->admin_id );

		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $url_pattern, &$captured_request ) {
				if ( strpos( $url, $url_pattern ) !== false ) {
					$captured_request = array(
						'url'    => $url,
						'method' => $args['method'],
					);

					if ( $args['method'] === 'POST' ) {
						$captured_request['body'] = $args['body'];
					}

					return array(
						'response' => array(
							'code'    => 200,
							'message' => 'OK',
						),
						'headers'  => array(
							'content-type' => 'application/json',
						),
						'body'     => wp_json_encode( array( 'success' => true ), JSON_UNESCAPED_SLASHES ),
					);
				}
				return $preempt;
			},
			10,
			3
		);
	}

	/**
	 * Test get_dsp_blaze_posts redirects to WPCOM.
	 */
	public function test_get_dsp_blaze_posts_redirects_to_wpcom() {
		Health::update_status( Health::STATUS_IN_SYNC );

		$captured_request = null;
		$this->setup_redirect_test( sprintf( '/sites/%d/blaze/posts', $this->site_id ), $captured_request );

		$request  = new WP_REST_Request( 'GET', sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1/wpcom/sites/%d/blaze/posts', $this->site_id, $this->site_id ) );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNotNull( $captured_request, 'Request should be redirected to WPCOM' );
		$this->assertSame( 'GET', $captured_request['method'] );
		$this->assertStringContainsString( sprintf( '/wpcom/v2/sites/%d/blaze/posts', $this->site_id ), $captured_request['url'] );
	}

	/**
	 * Test the get_dsp_blaze_posts local processing of data (before redirection)
	 */
	public function test_get_dsp_blaze_posts_processed_it_locally() {
		Health::update_status( Health::STATUS_OUT_OF_SYNC );

		$captured_request = null;
		$this->setup_redirect_test( sprintf( '/sites/%d/blaze/posts', $this->site_id ), $captured_request );

		$request = new WP_REST_Request( 'GET', sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1/wpcom/sites/%d/blaze/posts', $this->site_id, $this->site_id ) );
		$request->set_param( 'page', '1' );
		$request->set_param( 'filter_post_type', 'post' );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNull( $captured_request, 'Request should not be redirected to WPCOM' );

		// Check that the new prop sync_ready is correctly set to false.
		$data = $response->get_data();
		$this->assertFalse( $data['sync_ready'] );

		$this->assertSame( 1, $data['total'] );
		$this->assertArrayHasKey( 'results', $data );

		$first_post = $data['results'][0];
		$this->assertSame( $this->post_id, $first_post['ID'] );
		$this->assertSame( 'Test Post for Blaze', $first_post['title'] );
		$this->assertSame( 'post', $first_post['type'] );
		$this->assertSame( get_permalink( $this->post_id ), $first_post['post_url'] );
	}

	/**
	 * Test get_dsp_media redirects to WPCOM.
	 */
	public function test_get_dsp_media_redirects_to_wpcom() {
		$captured_request = null;
		$this->setup_redirect_test( '/wordads/dsp/api/v1/wpcom/sites/', $captured_request );

		$request  = new WP_REST_Request( 'GET', sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1/wpcom/sites/%d/media', $this->site_id, $this->site_id ) );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNotNull( $captured_request, 'Request should be redirected to WPCOM' );
		$this->assertSame( 'GET', $captured_request['method'] );
	}

	/**
	 * Test get_dsp_openverse redirects to WPCOM.
	 */
	public function test_get_dsp_openverse_redirects_to_wpcom() {
		$captured_request = null;
		$this->setup_redirect_test( '/wordads/dsp/api/v1/wpcom/media', $captured_request );

		$request  = new WP_REST_Request( 'GET', sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1/wpcom/media', $this->site_id ) );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNotNull( $captured_request, 'Request should be redirected to WPCOM' );
		$this->assertSame( 'GET', $captured_request['method'] );
	}

	/**
	 * Test get_dsp_experiments redirects to WPCOM.
	 */
	public function test_get_dsp_experiments_redirects_to_wpcom() {
		$captured_request = null;
		$this->setup_redirect_test( '/wordads/dsp/api/v1/experiments', $captured_request );

		$request  = new WP_REST_Request( 'GET', sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1/experiments', $this->site_id ) );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNotNull( $captured_request, 'Request should be redirected to WPCOM' );
		$this->assertSame( 'GET', $captured_request['method'] );
	}

	/**
	 * Test get_dsp_campaigns redirects to WPCOM.
	 */
	public function test_get_dsp_campaigns_redirects_to_wpcom() {
		$captured_request = null;
		$this->setup_redirect_test( '/wordads/dsp/api/v1/campaigns', $captured_request );

		$request  = new WP_REST_Request( 'GET', sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1/campaigns', $this->site_id ) );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNotNull( $captured_request, 'Request should be redirected to WPCOM' );
		$this->assertSame( 'GET', $captured_request['method'] );
	}

	/**
	 * Test edit_dsp_campaigns redirects to WPCOM.
	 */
	public function test_edit_dsp_campaigns_redirects_to_wpcom() {
		$captured_request = null;
		$this->setup_redirect_test( '/wordads/dsp/api/v1/campaigns', $captured_request );

		$request = new WP_REST_Request( 'POST', sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1/campaigns', $this->site_id ) );
		$request->set_header( 'Content-Type', 'application/json' );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNotNull( $captured_request, 'Request should be redirected to WPCOM' );
		$this->assertSame( 'POST', $captured_request['method'] );
	}

	/**
	 * Test get_dsp_site_campaigns redirects to WPCOM.
	 */
	public function test_get_dsp_site_campaigns_redirects_to_wpcom() {
		$captured_request = null;
		$this->setup_redirect_test( sprintf( '/wordads/dsp/api/v1/sites/%d/campaigns', $this->site_id ), $captured_request );

		$request  = new WP_REST_Request( 'GET', sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1/sites/%d/campaigns', $this->site_id, $this->site_id ) );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNotNull( $captured_request, 'Request should be redirected to WPCOM' );
		$this->assertSame( 'GET', $captured_request['method'] );
	}

	/**
	 * Test get_dsp_stats redirects to WPCOM.
	 */
	public function test_get_dsp_stats_redirects_to_wpcom() {
		$captured_request = null;
		$this->setup_redirect_test( '/wordads/dsp/api/v1/stats', $captured_request );

		$request  = new WP_REST_Request( 'GET', sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1/stats', $this->site_id ) );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNotNull( $captured_request, 'Request should be redirected to WPCOM' );
		$this->assertSame( 'GET', $captured_request['method'] );
	}

	/**
	 * Test edit_dsp_stats redirects to WPCOM.
	 */
	public function test_edit_dsp_stats_redirects_to_wpcom() {
		$captured_request = null;
		$this->setup_redirect_test( '/wordads/dsp/api/v1/stats', $captured_request );

		$request = new WP_REST_Request( 'POST', sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1/stats', $this->site_id ) );
		$request->set_header( 'Content-Type', 'application/json' );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNotNull( $captured_request, 'Request should be redirected to WPCOM' );
		$this->assertSame( 'POST', $captured_request['method'] );
	}

	/**
	 * Test get_dsp_search redirects to WPCOM.
	 */
	public function test_get_dsp_search_redirects_to_wpcom() {
		$captured_request = null;
		$this->setup_redirect_test( '/wordads/dsp/api/v1/search', $captured_request );

		$request  = new WP_REST_Request( 'GET', sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1/search', $this->site_id ) );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNotNull( $captured_request, 'Request should be redirected to WPCOM' );
		$this->assertSame( 'GET', $captured_request['method'] );
	}

	/**
	 * Test get_dsp_user redirects to WPCOM.
	 */
	public function test_get_dsp_user_redirects_to_wpcom() {
		$captured_request = null;
		$this->setup_redirect_test( '/wordads/dsp/api/v1/user', $captured_request );

		$request  = new WP_REST_Request( 'GET', sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1/user', $this->site_id ) );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNotNull( $captured_request, 'Request should be redirected to WPCOM' );
		$this->assertSame( 'GET', $captured_request['method'] );
	}

	/**
	 * Test get_dsp_templates redirects to WPCOM.
	 */
	public function test_get_dsp_advise_redirects_to_wpcom() {
		$captured_request = null;
		$this->setup_redirect_test( '/wordads/dsp/api/v1/advise', $captured_request );

		$request  = new WP_REST_Request( 'GET', sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1/advise', $this->site_id ) );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNotNull( $captured_request, 'Request should be redirected to WPCOM' );
		$this->assertSame( 'GET', $captured_request['method'] );
	}

	/**
	 * Test get_dsp_templates redirects to WPCOM.
	 */
	public function test_get_dsp_templates_redirects_to_wpcom() {
		$captured_request = null;
		$this->setup_redirect_test( '/wordads/dsp/api/v1/templates', $captured_request );

		$request  = new WP_REST_Request( 'GET', sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1/templates', $this->site_id ) );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNotNull( $captured_request, 'Request should be redirected to WPCOM' );
		$this->assertSame( 'GET', $captured_request['method'] );
	}

	/**
	 * Test get_dsp_subscriptions redirects to WPCOM.
	 */
	public function test_get_dsp_subscriptions_redirects_to_wpcom() {
		$captured_request = null;
		$this->setup_redirect_test( '/wordads/dsp/api/v1/subscriptions', $captured_request );

		$request  = new WP_REST_Request( 'GET', sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1/subscriptions', $this->site_id ) );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNotNull( $captured_request, 'Request should be redirected to WPCOM' );
		$this->assertSame( 'GET', $captured_request['method'] );
	}

	/**
	 * Test edit_dsp_subscriptions redirects to WPCOM.
	 */
	public function test_edit_dsp_subscriptions_redirects_to_wpcom() {
		$captured_request = null;
		$this->setup_redirect_test( '/wordads/dsp/api/v1/subscriptions', $captured_request );

		$request = new WP_REST_Request( 'POST', sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1/subscriptions', $this->site_id ) );
		$request->set_header( 'Content-Type', 'application/json' );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNotNull( $captured_request, 'Request should be redirected to WPCOM' );
		$this->assertSame( 'POST', $captured_request['method'] );
	}

	/**
	 * Test get_dsp_payments redirects to WPCOM.
	 */
	public function test_get_dsp_payments_redirects_to_wpcom() {
		$captured_request = null;
		$this->setup_redirect_test( '/wordads/dsp/api/v1/payments', $captured_request );

		$request  = new WP_REST_Request( 'GET', sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1/payments', $this->site_id ) );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNotNull( $captured_request, 'Request should be redirected to WPCOM' );
		$this->assertSame( 'GET', $captured_request['method'] );
	}

	/**
	 * Test edit_dsp_payments redirects to WPCOM.
	 */
	public function test_edit_dsp_payments_redirects_to_wpcom() {
		$captured_request = null;
		$this->setup_redirect_test( '/wordads/dsp/api/v1/payments', $captured_request );

		$request = new WP_REST_Request( 'POST', sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1/payments', $this->site_id ) );
		$request->set_header( 'Content-Type', 'application/json' );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNotNull( $captured_request, 'Request should be redirected to WPCOM' );
		$this->assertSame( 'POST', $captured_request['method'] );
	}

	/**
	 * Test get_dsp_smart redirects to WPCOM.
	 */
	public function test_get_dsp_smart_redirects_to_wpcom() {
		$captured_request = null;
		$this->setup_redirect_test( '/wordads/dsp/api/v1/smart', $captured_request );

		$request  = new WP_REST_Request( 'GET', sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1/smart', $this->site_id ) );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNotNull( $captured_request, 'Request should be redirected to WPCOM' );
		$this->assertSame( 'GET', $captured_request['method'] );
	}

	/**
	 * Test edit_dsp_smart redirects to WPCOM.
	 */
	public function test_edit_dsp_smart_redirects_to_wpcom() {
		$captured_request = null;
		$this->setup_redirect_test( '/wordads/dsp/api/v1/smart', $captured_request );

		$request = new WP_REST_Request( 'POST', sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1/smart', $this->site_id ) );
		$request->set_header( 'Content-Type', 'application/json' );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNotNull( $captured_request, 'Request should be redirected to WPCOM' );
		$this->assertSame( 'POST', $captured_request['method'] );
	}

	/**
	 * Test get_dsp_locations redirects to WPCOM.
	 */
	public function test_get_dsp_locations_redirects_to_wpcom() {
		$captured_request = null;
		$this->setup_redirect_test( '/wordads/dsp/api/v1/locations', $captured_request );

		$request  = new WP_REST_Request( 'GET', sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1/locations', $this->site_id ) );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNotNull( $captured_request, 'Request should be redirected to WPCOM' );
		$this->assertSame( 'GET', $captured_request['method'] );
	}

	/**
	 * Test get_dsp_woo redirects to WPCOM.
	 */
	public function test_get_dsp_woo_redirects_to_wpcom() {
		$captured_request = null;
		$this->setup_redirect_test( '/wordads/dsp/api/v1/woo', $captured_request );

		$request  = new WP_REST_Request( 'GET', sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1/woo', $this->site_id ) );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNotNull( $captured_request, 'Request should be redirected to WPCOM' );
		$this->assertSame( 'GET', $captured_request['method'] );
	}

	/**
	 * Test get_dsp_image redirects to WPCOM.
	 */
	public function test_get_dsp_image_redirects_to_wpcom() {
		$captured_request = null;
		$this->setup_redirect_test( '/wordads/dsp/api/v1/image', $captured_request );

		$request  = new WP_REST_Request( 'GET', sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1/image', $this->site_id ) );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNotNull( $captured_request, 'Request should be redirected to WPCOM' );
		$this->assertSame( 'GET', $captured_request['method'] );
	}

	/**
	 * Test edit_dsp_logs redirects to WPCOM.
	 */
	public function test_edit_dsp_logs_redirects_to_wpcom() {
		$captured_request = null;
		$this->setup_redirect_test( '/wordads/dsp/api/v1/logs', $captured_request );

		$request = new WP_REST_Request( 'POST', sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1/logs', $this->site_id ) );
		$request->set_header( 'Content-Type', 'application/json' );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNotNull( $captured_request, 'Request should be redirected to WPCOM' );
		$this->assertSame( 'POST', $captured_request['method'] );
	}

	/**
	 * Test the get_dsp_templates_article redirection To WPCOM when status is synced.
	 */
	public function test_get_dsp_templates_article_redirection() {
		Health::update_status( Health::STATUS_IN_SYNC );

		$captured_request = null;
		$this->setup_redirect_test( '/wordads/dsp/api/v1/templates/article', $captured_request );

		$request  = new WP_REST_Request( 'GET', sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1/templates/article/urn:wpcom:post:%d:123', $this->site_id, $this->site_id ) );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNotNull( $captured_request, 'Request should be redirected to WPCOM' );
		$this->assertSame( 'GET', $captured_request['method'] );
		$this->assertStringContainsString( sprintf( '/wordads/dsp/api/v1/templates/article/urn:wpcom:post:%d:123', $this->site_id ), $captured_request['url'] );
	}

	/**
	 * Test the get_dsp_templates_article local processing of data (before redirection)
	 */
	public function test_get_dsp_templates_article_processed_it_locally() {
		Health::update_status( Health::STATUS_OUT_OF_SYNC );

		$attachment_id = $this->create_image_attachment( $this->post_id );

		$captured_request = null;
		$this->setup_redirect_test( '/wordads/dsp/api/v1/templates/article', $captured_request );

		$request = new WP_REST_Request( 'GET', sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1/templates/article/urn:wpcom:post:%d:%d', $this->site_id, $this->site_id, $this->post_id ) );
		$request->set_param( 'widget_origin', 'jetpack' );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNotNull( $captured_request, 'Request should be redirected to WPCOM' );
		$this->assertSame( 'POST', $captured_request['method'] );
		$this->assertStringContainsString( sprintf( '/wordads/dsp/api/v1/templates/article/urn:wpcom:post:%d:%d', $this->site_id, $this->post_id ), $captured_request['url'] );

		$body = json_decode( $captured_request['body'] ?? '', true );
		$this->assertIsArray( $body );
		$this->assertSame( 'jetpack', $body['widget_origin'] );

		$this->assertArrayHasKey( 'wp_post', $body );
		$this->assertSame( $this->post_id, $body['wp_post']['ID'] );
		$this->assertSame( 'Test Post for Blaze', $body['wp_post']['title'] );
		$this->assertSame( 'Some awesome content to promote', $body['wp_post']['content'] );
		$this->assertSame( 'post', $body['wp_post']['type'] );
		$this->assertSame( get_permalink( $this->post_id ), $body['wp_post']['URL'] );

		// Check attachments (JSON decoding converts numeric keys to strings).
		$this->assertArrayHasKey( 'attachments', $body['wp_post'] );
		$attachments = $body['wp_post']['attachments'];
		$this->assertArrayHasKey( $attachment_id, $attachments );
		$this->assertSame( $attachment_id, $attachments[ $attachment_id ]['ID'] );
		$this->assertSame( 'image/png', $attachments[ $attachment_id ]['mime_type'] );
		$this->assertSame( 1024, $attachments[ $attachment_id ]['width'] );
		$this->assertSame( 768, $attachments[ $attachment_id ]['height'] );
		$this->assertArrayHasKey( 'URL', $attachments[ $attachment_id ] );

		// Check that the new prop sync_ready is correctly set to false.
		$data = $response->get_data();
		$this->assertFalse( $data['sync_ready'] );

		// Clean up.
		wp_delete_attachment( $attachment_id, true );
	}

	/**
	 * Test that get_post_featured_image returns null when post has no featured image.
	 */
	public function test_get_post_featured_image_returns_null_when_no_image() {
		Health::update_status( Health::STATUS_OUT_OF_SYNC );

		$captured_request = null;
		$this->setup_redirect_test( '/wordads/dsp/api/v1/templates/article', $captured_request );

		$request = new WP_REST_Request( 'GET', sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1/templates/article/urn:wpcom:post:%d:%d', $this->site_id, $this->site_id, $this->post_id ) );
		$request->set_param( 'widget_origin', 'jetpack' );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNotNull( $captured_request, 'Request should be redirected to WPCOM' );

		$body = json_decode( $captured_request['body'] ?? '', true );
		$this->assertIsArray( $body );
		$this->assertArrayHasKey( 'wp_post', $body );
		$this->assertNull( $body['wp_post']['post_thumbnail'] );
	}

	/**
	 * Test that get_post_featured_image returns image data when post has a featured image.
	 */
	public function test_get_post_featured_image_returns_image_data() {
		Health::update_status( Health::STATUS_OUT_OF_SYNC );

		$attachment_id = $this->create_image_attachment( $this->post_id, 'image/jpeg', 800, 600 );
		set_post_thumbnail( $this->post_id, $attachment_id );

		$captured_request = null;
		$this->setup_redirect_test( '/wordads/dsp/api/v1/templates/article', $captured_request );

		$request  = new WP_REST_Request( 'GET', sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1/templates/article/urn:wpcom:post:%d:%d', $this->site_id, $this->site_id, $this->post_id ) );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNotNull( $captured_request, 'Request should be redirected to WPCOM' );

		$body = json_decode( $captured_request['body'] ?? '', true );
		$this->assertIsArray( $body );
		$this->assertArrayHasKey( 'wp_post', $body );

		$post_thumbnail = $body['wp_post']['post_thumbnail'];
		$this->assertIsArray( $post_thumbnail );
		$this->assertSame( $attachment_id, $post_thumbnail['ID'] );
		$this->assertArrayHasKey( 'URL', $post_thumbnail );
		$this->assertArrayHasKey( 'width', $post_thumbnail );
		$this->assertArrayHasKey( 'height', $post_thumbnail );
		$this->assertArrayHasKey( 'mime_type', $post_thumbnail );
		$this->assertSame( 'image/jpeg', $post_thumbnail['mime_type'] );
	}

	/**
	 * Test the get_dsp_advise_campaign redirection to WPCOM when status is synced.
	 */
	public function test_get_dsp_advise_campaign_redirection() {
		Health::update_status( Health::STATUS_IN_SYNC );

		$captured_request = null;
		$this->setup_redirect_test( '/wordads/dsp/api/v1/advise/campaign', $captured_request );

		$request  = new WP_REST_Request( 'GET', sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1/advise/campaign/urn:wpcom:post:%d:123', $this->site_id, $this->site_id ) );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNotNull( $captured_request, 'Request should be redirected to WPCOM' );
		$this->assertSame( 'GET', $captured_request['method'] );
		$this->assertStringContainsString( sprintf( '/wordads/dsp/api/v1/advise/campaign/urn:wpcom:post:%d:123', $this->site_id ), $captured_request['url'] );
	}

	/**
	 * Test the get_dsp_advise_campaign local processing of data (before redirection).
	 */
	public function test_get_dsp_advise_campaign_processed_it_locally() {
		Health::update_status( Health::STATUS_OUT_OF_SYNC );

		$captured_request = null;
		$this->setup_redirect_test( '/wordads/dsp/api/v1/advise/campaign', $captured_request );

		$request  = new WP_REST_Request( 'GET', sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1/advise/campaign/urn:wpcom:post:%d:%d', $this->site_id, $this->site_id, $this->post_id ) );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNotNull( $captured_request, 'Request should be redirected to WPCOM' );
		$this->assertSame( 'POST', $captured_request['method'] );
		$this->assertStringContainsString( sprintf( '/wordads/dsp/api/v1/advise/campaign/urn:wpcom:post:%d:%d', $this->site_id, $this->post_id ), $captured_request['url'] );

		$body = json_decode( $captured_request['body'] ?? '', true );
		$this->assertIsArray( $body );

		$this->assertArrayHasKey( 'wp_post', $body );
		$this->assertSame( $this->post_id, $body['wp_post']['ID'] );
		$this->assertSame( 'Test Post for Blaze', $body['wp_post']['title'] );
		$this->assertSame( 'post', $body['wp_post']['type'] );
		$this->assertSame( get_permalink( $this->post_id ), $body['wp_post']['URL'] );
		$this->assertArrayHasKey( 'content', $body['wp_post'] );

		// Check that sync_ready is correctly set to false.
		$data = $response->get_data();
		$this->assertFalse( $data['sync_ready'] );
	}

	/**
	 * Test the get_dsp_templates_advise_campaign redirection to WPCOM when status is synced.
	 */
	public function test_get_dsp_templates_advise_campaign_redirection() {
		Health::update_status( Health::STATUS_IN_SYNC );

		$captured_request = null;
		$this->setup_redirect_test( '/wordads/dsp/api/v1/templates/advise/campaign', $captured_request );

		$request  = new WP_REST_Request( 'GET', sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1/templates/advise/campaign/urn:wpcom:post:%d:123', $this->site_id, $this->site_id ) );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNotNull( $captured_request, 'Request should be redirected to WPCOM' );
		$this->assertSame( 'GET', $captured_request['method'] );
		$this->assertStringContainsString( sprintf( '/wordads/dsp/api/v1/templates/advise/campaign/urn:wpcom:post:%d:123', $this->site_id ), $captured_request['url'] );
	}

	/**
	 * Test the get_dsp_templates_advise_campaign local processing of data (before redirection).
	 */
	public function test_get_dsp_templates_advise_campaign_processed_it_locally() {
		Health::update_status( Health::STATUS_OUT_OF_SYNC );

		$captured_request = null;
		$this->setup_redirect_test( '/wordads/dsp/api/v1/advise/campaign', $captured_request );

		$request  = new WP_REST_Request( 'GET', sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1/templates/advise/campaign/urn:wpcom:post:%d:%d', $this->site_id, $this->site_id, $this->post_id ) );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNotNull( $captured_request, 'Request should be redirected to WPCOM' );
		$this->assertSame( 'POST', $captured_request['method'] );
		$this->assertStringContainsString( sprintf( '/wordads/dsp/api/v1/advise/campaign/urn:wpcom:post:%d:%d', $this->site_id, $this->post_id ), $captured_request['url'] );

		$body = json_decode( $captured_request['body'] ?? '', true );
		$this->assertIsArray( $body );

		$this->assertArrayHasKey( 'wp_post', $body );
		$this->assertSame( $this->post_id, $body['wp_post']['ID'] );
		$this->assertSame( 'Test Post for Blaze', $body['wp_post']['title'] );
		$this->assertSame( 'post', $body['wp_post']['type'] );
		$this->assertSame( get_permalink( $this->post_id ), $body['wp_post']['URL'] );
		$this->assertArrayHasKey( 'content', $body['wp_post'] );

		// Check that sync_ready is correctly set to false.
		$data = $response->get_data();
		$this->assertFalse( $data['sync_ready'] );
	}

	/**
	 * Test the create_dsp_campaigns redirection to WPCOM when status is synced.
	 */
	public function test_create_dsp_campaigns_redirection() {
		Health::update_status( Health::STATUS_IN_SYNC );

		$captured_request = null;
		$this->setup_redirect_test( '/wordads/dsp/api/v1.1/campaigns', $captured_request );

		$request = new WP_REST_Request( 'POST', sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1.1/campaigns', $this->site_id ) );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					'target_urn' => sprintf( 'urn:wpcom:post:%d:123', $this->site_id ),
					'budget'     => 100,
				),
				JSON_UNESCAPED_SLASHES
			)
		);
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNotNull( $captured_request, 'Request should be redirected to WPCOM' );
		$this->assertSame( 'POST', $captured_request['method'] );
		$this->assertStringContainsString( '/wordads/dsp/api/v1.1/campaigns', $captured_request['url'] );
	}

	/**
	 * Test the create_dsp_campaigns local processing of data (before redirection).
	 */
	public function test_create_dsp_campaigns_processed_it_locally() {
		Health::update_status( Health::STATUS_OUT_OF_SYNC );

		$attachment_id = $this->create_image_attachment( $this->post_id, 'image/jpeg', 800, 600 );
		set_post_thumbnail( $this->post_id, $attachment_id );

		$captured_request = null;
		$this->setup_redirect_test( '/wordads/dsp/api/v1.1/campaigns', $captured_request );

		$request = new WP_REST_Request( 'POST', sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1.1/campaigns', $this->site_id ) );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					'target_urn' => sprintf( 'urn:wpcom:post:%d:%d', $this->site_id, $this->post_id ),
					'budget'     => 100,
				),
				JSON_UNESCAPED_SLASHES
			)
		);
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNotNull( $captured_request, 'Request should be redirected to WPCOM' );
		$this->assertSame( 'POST', $captured_request['method'] );
		$this->assertStringContainsString( '/wordads/dsp/api/v1.1/campaigns', $captured_request['url'] );

		$body = json_decode( $captured_request['body'] ?? '', true );
		$this->assertIsArray( $body );

		// Check that original request body params are preserved.
		$this->assertSame( sprintf( 'urn:wpcom:post:%d:%d', $this->site_id, $this->post_id ), $body['target_urn'] );
		$this->assertSame( 100, $body['budget'] );

		// Check wp_post data.
		$this->assertArrayHasKey( 'wp_post', $body );
		$this->assertSame( $this->post_id, $body['wp_post']['ID'] );
		$this->assertSame( 'Test Post for Blaze', $body['wp_post']['title'] );
		$this->assertSame( 'post', $body['wp_post']['type'] );
		$this->assertSame( get_permalink( $this->post_id ), $body['wp_post']['URL'] );
		$this->assertArrayHasKey( 'content', $body['wp_post'] );
		$this->assertArrayHasKey( 'modified', $body['wp_post'] );
		$this->assertArrayHasKey( 'featured_image', $body['wp_post'] );
		$this->assertNotEmpty( $body['wp_post']['featured_image'] );

		// Check that sync_ready is correctly set to false.
		$data = $response->get_data();
		$this->assertFalse( $data['sync_ready'] );
	}
}
