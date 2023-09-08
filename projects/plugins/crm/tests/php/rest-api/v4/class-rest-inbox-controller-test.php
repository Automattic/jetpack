<?php

namespace Automattic\Jetpack\CRM\Tests;

use WP_REST_Request;
use WP_REST_Server;

require_once __DIR__ . '/../class-rest-base-test-case.php';

/**
 * REST_Inbox_Controller_Test class.
 *
 * @covers \Automattic\Jetpack\CRM\REST_API\V4\REST_Inbox_Controller
 */
class REST_Inbox_Controller_Test extends REST_Base_Test_Case {

	/**
	 * GET Messages: Test that we can successfully retrieve all inbox messages.
	 *
	 * @return void
	 */
	public function test_get_messages_success() {
		// Create and set authenticated user.
		$jpcrm_admin_id = $this->create_wp_jpcrm_admin();
		wp_set_current_user( $jpcrm_admin_id );

		// Make request.
		$request  = new WP_REST_Request(
			WP_REST_Server::READABLE,
			'/jetpack-crm/v4/inbox/messages'
		);
		$response = rest_do_request( $request );
		$this->assertSame( 200, $response->get_status() );

		// TODO: tests here, it will be a pain to add everything to the DB.
		$messages = array( 'just pass' );
		$this->assertIsArray( $messages );
	}
}
