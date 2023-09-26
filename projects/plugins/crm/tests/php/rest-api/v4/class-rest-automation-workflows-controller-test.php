<?php

namespace Automattic\Jetpack\CRM\Tests;

use Automattic\Jetpack\CRM\Automation\Automation_Workflow;
use Automattic\Jetpack\CRM\Automation\Tests\Automation_Faker;
use Automattic\Jetpack\CRM\Automation\Workflow\Workflow_Repository;
use WP_REST_Request;
use WP_REST_Server;

require_once JETPACK_CRM_TESTS_ROOT . '/automation/tools/class-automation-faker.php';

/**
 * REST_Automation_Workflows_Controller_Test class.
 *
 * @covers \Automattic\Jetpack\CRM\REST_API\V4\REST_Automation_Workflows_Controller
 */
class REST_Automation_Workflows_Controller_Test extends REST_Base_Test_Case {

	/**
	 * GET Workflows: Test that we can successfully access the endpoint.
	 *
	 * @return void
	 */
	public function test_get_workflows_success() {
		// Create and set authenticated user.
		$jpcrm_admin_id = $this->create_wp_jpcrm_admin();
		wp_set_current_user( $jpcrm_admin_id );

		$workflow_data = Automation_Faker::instance()->workflow_with_condition_action();

		$workflow_data['name'] = 'test_get_workflows_success_1';
		$workflow_1            = new Automation_Workflow( $workflow_data );

		$workflow_data['name'] = 'test_get_workflows_success_2';
		$workflow_2            = new Automation_Workflow( $workflow_data );

		$repo = new Workflow_Repository();
		$repo->persist( $workflow_1 );
		$repo->persist( $workflow_2 );

		// Make request.
		$request  = new WP_REST_Request(
			WP_REST_Server::READABLE,
			'/jetpack-crm/v4/automation/workflows'
		);
		$response = rest_do_request( $request );
		$this->assertSame( 200, $response->get_status() );

		$response_data = $response->get_data();
		$this->assertIsArray( $response_data );
		$this->assertEquals(
			$response_data,
			array(
				$workflow_1->to_array(),
				$workflow_2->to_array(),
			)
		);
	}

	/**
	 * GET (Single) Workflow: Test that we can successfully access the endpoint.
	 *
	 * @return void
	 */
	public function test_get_workflow_success() {
		// Create and set authenticated user.
		$jpcrm_admin_id = $this->create_wp_jpcrm_admin();
		wp_set_current_user( $jpcrm_admin_id );

		$workflow = $this->create_workflow(
			array(
				'name' => 'test_get_workflow_success',
			)
		);

		// Make request.
		$request = new WP_REST_Request(
			WP_REST_Server::READABLE,
			sprintf( '/jetpack-crm/v4/automation/workflows/%d', $workflow->get_id() )
		);

		$response = rest_do_request( $request );
		$this->assertSame( 200, $response->get_status() );

		$response_data = $response->get_data();
		$this->assertIsArray( $response_data );
		// We assert equals here since the response logic will cast integers to strings.
		$this->assertEquals( $response_data, $workflow->to_array() );
		// We hardcode the name in the workflow creation, so we can verify that we're
		// actually retrieving the correct workflow and not just a false-positive response.
		$this->assertSame( 'test_get_workflow_success', $response_data['name'] );
	}

	/**
	 * GET (Single) Workflow: Test that we can successfully access the endpoint.
	 *
	 * @todo Actually test an update.
	 *
	 * @return void
	 */
	public function test_update_workflow_success() {
		// Create and set authenticated user.
		$jpcrm_admin_id = $this->create_wp_jpcrm_admin();
		wp_set_current_user( $jpcrm_admin_id );

		$workflow = $this->create_workflow(
			array(
				'name' => 'test_update_workflow_success',
			)
		);

		// Make request.
		$request  = new WP_REST_Request(
			'PUT',
			sprintf( '/jetpack-crm/v4/automation/workflows/%d', $workflow->get_id() )
		);
		$response = rest_do_request( $request );
		$this->assertSame( 200, $response->get_status() );

		$response_data = $response->get_data();
		$this->assertIsArray( $response_data );
		$this->assertEquals( $response_data, $workflow->to_array() );
		// We hardcode the name in the workflow creation, so we can verify that we're
		// actually retrieving the correct workflow and not just a false-positive response.
		$this->assertSame( 'test_update_workflow_success', $workflow->get_name() );
	}

	/**
	 * Generate a workflow for testing.
	 *
	 * @param array $data (Optional) Workflow data.
	 * @return Automation_Workflow
	 *
	 * @throws \Automattic\Jetpack\CRM\Automation\Workflow_Exception
	 */
	protected function create_workflow( array $data = array() ) {
		$workflow_data = wp_parse_args(
			$data,
			Automation_Faker::instance()->workflow_with_condition_action()
		);

		$workflow = new Automation_Workflow( $workflow_data );

		$repo = new Workflow_Repository();
		$repo->persist( $workflow );

		return $workflow;
	}
}
