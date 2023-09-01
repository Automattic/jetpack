<?php

namespace Automattic\Jetpack\CRM\Tests;

use WP_REST_Request;
use WP_REST_Server;

require_once __DIR__ . '/../class-rest-base-test-case.php';

/**
 * REST_Automation_Controller_Test class.
 *
 * @covers \Automattic\Jetpack\CRM\REST_API\V4\REST_Automation_Controller
 */
class REST_Automation_Controller_Test extends REST_Base_Test_Case {

	/**
	 * GET Workflows: Test that we can successfully access the endpoint.
	 *
	 * @return void
	 */
	public function test_get_workflows_success() {
		// Create and set authenticated user.
		$jpcrm_admin_id = $this->create_wp_jpcrm_admin();
		wp_set_current_user( $jpcrm_admin_id );

		// Make request.
		$request  = new WP_REST_Request(
			WP_REST_Server::READABLE,
			'/jetpack-crm/v4/automation/workflows'
		);
		$response = rest_do_request( $request );
		$this->assertSame( 200, $response->get_status() );

		$workflows = $response->get_data();
		$this->assertIsArray( $workflows );
		// TODO: add more tests to ensure the workflows were returned correctly.
	}
}
