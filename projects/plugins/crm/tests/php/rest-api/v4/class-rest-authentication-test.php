<?php

namespace Automattic\Jetpack\CRM\Tests;

use WP_REST_Request;
use WP_REST_Server;

require_once __DIR__ . '/../class-rest-base-test-case.php';

/**
 * Authentication test.
 *
 * @covers \Automattic\Jetpack\CRM\REST_API\V4\REST_Contacts_Controller
 */
class REST_Authentication_Test extends REST_Base_Test_Case {

	/**
	 * Return an array of URLs that require WP_User/cookie authentication.
	 *
	 * @return string[][]
	 */
	public function auth_user_url_provider() {
		return array(
			'contacts_controller::get_item' => array(
				WP_REST_Server::READABLE,
				'/jetpack-crm/v4/contacts/123',
			),
		);
	}

	/**
	 * Return an array of all URLs that require authentication.
	 *
	 * @return string[][]
	 */
	public function auth_all_urls_provider() {
		// We don't have any POST/PATCH/DELETE requests yet, so we just return the
		// dataProvider containing GET requests that requires authentication.
		return $this->auth_user_url_provider();
	}

	/**
	 * Test that endpoints that require user auth returns 401 if accessed without a WP User.
	 *
	 * @dataProvider auth_all_urls_provider
	 *
	 * @param string $method HTTP verb.
	 * @param string $url URL to send a request to.
	 */
	public function test_unauthenticated_endpoints_return_a_401( $method, $url ) {
		$request  = new WP_REST_Request( $method, $url );
		$response = rest_do_request( $request );

		$this->assertSame( 401, $response->get_status() );
		$this->assertSame( 'rest_cannot_view', $response->get_data()['code'] );
	}

	/**
	 * Test that endpoints returns 403 if a WP user have insufficient capabilities.
	 *
	 * @dataProvider auth_all_urls_provider
	 *
	 * @param string $method HTTP verb.
	 * @param string $url URL to send a request to.
	 */
	public function test_auth_user_endpoints_return_403_with_insufficient_capabilities( $method, $url ) {
		$wp_user_id = $this->create_wp_user( array( 'role' => 'subscriber' ) );
		wp_set_current_user( $wp_user_id );

		$request  = new WP_REST_Request( $method, $url );
		$response = rest_do_request( $request );

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( 'rest_cannot_view', $response->get_data()['code'] );
	}

}
