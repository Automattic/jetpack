<?php

namespace Automattic\Jetpack\CRM\Tests;

use Exception;
use WP_REST_Request;
use WP_REST_Server;
use zbsDAL_contacts;

require_once __DIR__ . '/../class-rest-base-test-case.php';

/**
 * Route_Scope class.
 *
 * @covers \Automattic\Jetpack\CRM\REST_API\V4\REST_Contacts_Controller
 */
class REST_Contacts_Controller_Test extends REST_Base_Test_Case {

	/**
	 * GET Contact: Test that we can successfully access the endpoint.
	 *
	 * @return void
	 */
	public function test_get_item_success() {
		// Create and set authenticated user.
		$wp_user_id = $this->create_wp_user();
		wp_set_current_user( $wp_user_id );

		// Create a contact we can fetch.
		$contact_id = $this->add_contact(
			array(
				'fname' => 'Joan',
				'lname' => 'Smith',
			)
		);

		// Make request.
		$request  = new WP_REST_Request(
			WP_REST_Server::READABLE,
			sprintf( '/jetpack-crm/v4/contacts/%d', $contact_id )
		);
		$response = rest_do_request( $request );
		$this->assertSame( 200, $response->get_status() );

		$contact = $response->get_data();
		$this->assertIsArray( $contact );
		$this->assertSame( 'Joan', $contact['fname'] );
		$this->assertSame( 'Smith', $contact['lname'] );
	}

	/**
	 * GET Contact: Test that we return a 404 if the requested contact do not exist.
	 *
	 * @return void
	 */
	public function test_get_item_return_404_if_contact_do_not_exist() {
		// Create and set authenticated user.
		$wp_user_id = $this->create_wp_user();
		wp_set_current_user( $wp_user_id );

		// Make request for a contact ID that do not exist.
		$request  = new WP_REST_Request(
			WP_REST_Server::READABLE,
			sprintf( '/jetpack-crm/v4/contacts/%d', 999 )
		);
		$response = rest_do_request( $request );

		$this->assertSame( 404, $response->get_status() );
		$this->assertSame( 'rest_invalid_contact_id', $response->get_data()['code'] );
	}

	/**
	 * GET Contact: Test that we catch unknown fatal errors.
	 *
	 * @return void
	 */
	public function test_get_item_unknown_fatal_error() {
		// Create a function that throws an exception, so we can test that
		// we successfully catch unexpected errors.
		$func = function () {
			throw new Exception( 'Mock fatal' );
		};

		// Mock contacts DAL service.
		$dal_mock = $this->createMock( zbsDAL_contacts::class );
		$dal_mock->method( 'getContact' )->willReturnCallback( $func );

		$GLOBALS['zbs']->DAL           = new \stdClass();
		$GLOBALS['zbs']->DAL->contacts = $dal_mock;

		// Create and set authenticated user.
		$wp_user_id = $this->create_wp_user();
		wp_set_current_user( $wp_user_id );

		// Make a (hopefully) successful request.
		$request  = new WP_REST_Request(
			WP_REST_Server::READABLE,
			sprintf( '/jetpack-crm/v4/contacts/%d', 123 )
		);
		$response = rest_do_request( $request );

		$this->assertSame( 500, $response->get_status() );
		$this->assertSame( 'rest_unknown_error', $response->get_data()['code'] );
		$this->assertSame( 'Mock fatal', $response->get_data()['message'] );
	}
}
