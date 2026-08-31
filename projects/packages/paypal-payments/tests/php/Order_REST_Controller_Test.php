<?php
/**
 * Tests for the Order_REST_Controller class.
 *
 * Verifies that the jp_pay_order post type cannot be created, updated,
 * or deleted via the REST API.
 *
 * @package automattic/jetpack-paypal-payments
 */

namespace Automattic\Jetpack\Paypal_Payments;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use WP_Error;
use WP_REST_Request;

/**
 * Class Order_REST_Controller_Test
 *
 * @coversDefaultClass \Automattic\Jetpack\Paypal_Payments\Order_REST_Controller
 * @covers \Automattic\Jetpack\Paypal_Payments\Order_REST_Controller
 */
#[CoversClass( Order_REST_Controller::class )]
class Order_REST_Controller_Test extends TestCase {

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
