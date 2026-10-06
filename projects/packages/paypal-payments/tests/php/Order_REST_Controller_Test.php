<?php
/**
 * Tests for the Order_REST_Controller class.
 *
 * Verifies that the jp_pay_order post type cannot be read without the
 * private-post capability, nor created, updated, or deleted via the REST API.
 *
 * @package automattic/jetpack-paypal-payments
 */

namespace Automattic\Jetpack\Paypal_Payments;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_Error;
use WP_REST_Request;

/**
 * Class Order_REST_Controller_Test
 *
 * @coversDefaultClass \Automattic\Jetpack\Paypal_Payments\Order_REST_Controller
 * @covers \Automattic\Jetpack\Paypal_Payments\Order_REST_Controller
 */
#[CoversClass( Order_REST_Controller::class )]
class Order_REST_Controller_Test extends BaseTestCase {

	/**
	 * The controller instance under test.
	 *
	 * @var Order_REST_Controller
	 */
	private $controller;

	/**
	 * Set up before each test.
	 */
	protected function setUp(): void {
		parent::setUp();

		// Register the post type if not already registered so the parent controller can read its properties.
		if ( ! post_type_exists( 'jp_pay_order' ) ) {
			register_post_type(
				'jp_pay_order',
				array(
					'public'       => false,
					'show_in_rest' => true,
				)
			);
		}

		$this->controller = new Order_REST_Controller( 'jp_pay_order' );
	}

	/**
	 * Clean up after each test.
	 */
	protected function tearDown(): void {
		wp_set_current_user( 0 );
		parent::tearDown();
	}

	/**
	 * Create a user with the given role and make it the current user.
	 *
	 * @param string $role The role to create the user with.
	 * @return int The new user ID.
	 */
	private function log_in_as( $role ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => $role . '-user',
				'user_pass'  => wp_hash_password( 'password' ),
				'user_email' => $role . '@example.com',
				'role'       => $role,
			)
		);
		wp_set_current_user( $user_id );

		return $user_id;
	}

	/**
	 * Create a published order, the status real orders are stored with.
	 *
	 * @return int The new order ID.
	 */
	private function create_published_order() {
		return wp_insert_post(
			array(
				'post_title'   => 'Jane Doe | 1xWidget',
				'post_excerpt' => 'jane@example.com, 1 Main St',
				'post_status'  => 'publish',
				'post_type'    => 'jp_pay_order',
			)
		);
	}

	/**
	 * Anonymous callers must not be able to list orders.
	 */
	public function test_get_items_permissions_check_denies_anonymous() {
		wp_set_current_user( 0 );

		$result = $this->controller->get_items_permissions_check( new WP_REST_Request( 'GET', '/wp/v2/jp_pay_order' ) );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'rest_cannot_view', $result->get_error_code() );
		$this->assertSame( 401, $result->get_error_data()['status'] );
	}

	/**
	 * A logged-in user without the private-post capability must not be able to list orders.
	 */
	public function test_get_items_permissions_check_denies_subscriber() {
		$this->log_in_as( 'subscriber' );

		$result = $this->controller->get_items_permissions_check( new WP_REST_Request( 'GET', '/wp/v2/jp_pay_order' ) );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'rest_cannot_view', $result->get_error_code() );
		$this->assertSame( 403, $result->get_error_data()['status'] );
	}

	/**
	 * Editors hold read_private_posts and must still be able to list orders.
	 */
	public function test_get_items_permissions_check_allows_editor() {
		$this->log_in_as( 'editor' );

		$this->assertTrue( $this->controller->get_items_permissions_check( new WP_REST_Request( 'GET', '/wp/v2/jp_pay_order' ) ) );
	}

	/**
	 * A published order must not be readable by an anonymous caller.
	 */
	public function test_check_read_permission_denies_anonymous_published_order() {
		$order_id = $this->create_published_order();
		wp_set_current_user( 0 );

		$this->assertFalse( $this->controller->check_read_permission( get_post( $order_id ) ) );
	}

	/**
	 * A published order must not be readable by a subscriber.
	 */
	public function test_check_read_permission_denies_subscriber_published_order() {
		$order_id = $this->create_published_order();
		$this->log_in_as( 'subscriber' );

		$this->assertFalse( $this->controller->check_read_permission( get_post( $order_id ) ) );
	}

	/**
	 * Editors must still be able to read an individual order.
	 */
	public function test_check_read_permission_allows_editor() {
		$order_id = $this->create_published_order();
		$this->log_in_as( 'editor' );

		$this->assertTrue( $this->controller->check_read_permission( get_post( $order_id ) ) );
	}

	/**
	 * Test that create_item_permissions_check returns a WP_Error.
	 */
	public function test_create_item_permissions_check_returns_error() {
		$request = new WP_REST_Request( 'POST', '/wp/v2/jp_pay_order' );
		$result  = $this->controller->create_item_permissions_check( $request );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertEquals( 'rest_cannot_create', $result->get_error_code() );
		$this->assertEquals( 403, $result->get_error_data()['status'] );
	}

	/**
	 * Test that update_item_permissions_check returns a WP_Error.
	 */
	public function test_update_item_permissions_check_returns_error() {
		$request = new WP_REST_Request( 'PUT', '/wp/v2/jp_pay_order/1' );
		$result  = $this->controller->update_item_permissions_check( $request );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertEquals( 'rest_cannot_update', $result->get_error_code() );
		$this->assertEquals( 403, $result->get_error_data()['status'] );
	}

	/**
	 * Test that delete_item_permissions_check returns a WP_Error.
	 */
	public function test_delete_item_permissions_check_returns_error() {
		$request = new WP_REST_Request( 'DELETE', '/wp/v2/jp_pay_order/1' );
		$result  = $this->controller->delete_item_permissions_check( $request );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertEquals( 'rest_cannot_delete', $result->get_error_code() );
		$this->assertEquals( 403, $result->get_error_data()['status'] );
	}

	/**
	 * Test that all write permission checks return 403 status codes.
	 *
	 * @dataProvider write_methods_provider
	 *
	 * @param string $method     The permission check method to call.
	 * @param string $http_method The HTTP method.
	 * @param string $route      The REST route.
	 */
	#[DataProvider( 'write_methods_provider' )]
	public function test_all_write_methods_return_403( $method, $http_method, $route ) {
		$request = new WP_REST_Request( $http_method, $route );
		$result  = $this->controller->$method( $request );

		$this->assertInstanceOf( WP_Error::class, $result, "$method should return WP_Error" );
		$this->assertEquals( 403, $result->get_error_data()['status'], "$method should return 403 status" );
	}

	/**
	 * Data provider for write methods.
	 *
	 * @return array
	 */
	public static function write_methods_provider() {
		return array(
			'create' => array( 'create_item_permissions_check', 'POST', '/wp/v2/jp_pay_order' ),
			'update' => array( 'update_item_permissions_check', 'PUT', '/wp/v2/jp_pay_order/1' ),
			'delete' => array( 'delete_item_permissions_check', 'DELETE', '/wp/v2/jp_pay_order/1' ),
		);
	}
}
