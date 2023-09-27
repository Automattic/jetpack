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

		$workflow_1 = $this->create_workflow(
			array(
				'name' => 'test_get_workflows_success_1',
			)
		);
		$workflow_2 = $this->create_workflow(
			array(
				'name' => 'test_get_workflows_success_2',
			)
		);

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
	 * DataProvider for pagination criteria.
	 *
	 * These scenarios assume that we always have 5 workflows when defining expectations.
	 *
	 * @return array Pagination criteria.
	 */
	public function dataprovider_pagination() {
		return array(
			'page: 1 | per_page: 4 | expect: 4/5'     => array(
				array(
					'page'     => 1,
					'per_page' => 4,
				),
				4,
			),
			'page: 2 | per_page: 4 | expect: 1/5'     => array(
				array(
					'page'     => 2,
					'per_page' => 4,
				),
				1,
			),
			'per_page: 4 | offset: 3 | expect: 2/5'   => array(
				array(
					'per_page' => 4,
					'offset'   => 3,
				),
				2,
			),
			'per_page: N/A | offset: 2 | expect: 3/5' => array(
				array( 'offset' => 2 ),
				3,
			),
			'per_page: 2 | offset: 2 | expect: 2/5'   => array(
				array(
					'offset'   => 2,
					'per_page' => 2,
				),
				2,
			),
		);
	}

	/**
	 * GET Workflows: Test pagination.
	 *
	 * @dataProvider dataprovider_pagination
	 *
	 * @return void
	 */
	public function test_get_workflows_pagination( $args, $expected_count ): void {
		// Create and set authenticated user.
		$jpcrm_admin_id = $this->create_wp_jpcrm_admin();
		wp_set_current_user( $jpcrm_admin_id );

		// Create 5 workflows.
		for ( $i = 0; $i < 5; $i++ ) {
			$this->create_workflow(
				array(
					'name' => sprintf( 'Workflow %d', $i ),
				)
			);
		}

		// Make request.
		$request = new WP_REST_Request(
			WP_REST_Server::READABLE,
			'/jetpack-crm/v4/automation/workflows'
		);
		foreach ( $args as $key => $value ) {
			$request->set_param( $key, $value );
		}
		$response = rest_do_request( $request );
		$this->assertSame( 200, $response->get_status() );

		$response_data = $response->get_data();
		$this->assertIsArray( $response_data );
		$this->assertCount( $expected_count, $response_data );
	}

	/**
	 * GET Workflows: Test that we return an empty array if we do not have any results.
	 *
	 * @return void
	 */
	public function test_get_workflows_return_empty(): void {
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

		// Verify we get an empty array if we do not have any results.
		$response_data = $response->get_data();
		$this->assertIsArray( $response_data );
		$this->assertCount( 0, $response_data );
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
	 * GET Workflow: Test that we get a 404 if ID does not exist.
	 *
	 * @return void
	 */
	public function test_get_workflow_return_404_if_id_do_not_exist() {
		// Create and set authenticated user.
		$jpcrm_admin_id = $this->create_wp_jpcrm_admin();
		wp_set_current_user( $jpcrm_admin_id );

		// Make request.
		$request = new WP_REST_Request(
			WP_REST_Server::READABLE,
			'/jetpack-crm/v4/automation/workflows/123'
		);

		$response = rest_do_request( $request );
		$this->assertSame( 404, $response->get_status() );
	}

	/**
	 * PUT (Single) Workflow: Test that we can successfully update an existing workflow.
	 *
	 * @return void
	 */
	public function test_update_workflow_success() {
		// Create and set authenticated user.
		$jpcrm_admin_id = $this->create_wp_jpcrm_admin();
		wp_set_current_user( $jpcrm_admin_id );

		// Create a workflow that we will update later.
		$workflow = $this->create_workflow();

		// Define values to use for our update request and to verify that the workflow was updated.
		$update_data = array(
			'name'         => 'my updated name',
			'description'  => 'my updated description',
			'category'     => 'jpcrm/updated-category',
			'active'       => false,
			'triggers'     => array( 'my_updated_trigger' ),
			'initial_step' => 'updated_step_2',
			'steps'        => array(
				'updated_step_1' => array(
					'slug'           => 'my_updated_step_1',
					'next_step_true' => 'updated_step_2',
				),
				'updated_step_2' => array(
					'slug' => 'my_updated_step_2',
				),
			),
		);

		// Make request.
		$request = new WP_REST_Request(
			'PUT',
			sprintf( '/jetpack-crm/v4/automation/workflows/%d', $workflow->get_id() )
		);
		foreach ( $update_data as $param => $value ) {
			$request->set_param( $param, $value );
		}
		$response = rest_do_request( $request );
		$this->assertSame( 200, $response->get_status() );

		// Verify that all the values we passed are returned as the updated workflow.
		$response_data = $response->get_data();
		$this->assertIsArray( $response_data );
		foreach ( $update_data as $param => $value ) {
			$this->assertSame(
				$value,
				$response_data[ $param ],
				sprintf( 'The following param failed: %s', $param )
			);
		}

		// Verify that all the values we passed were persisted in the database.
		$repo             = new Workflow_Repository();
		$fetched_workflow = ( $repo->find( $response_data['id'] ) )->to_array();
		$this->assertIsArray( $response_data );
		foreach ( $update_data as $param => $value ) {
			$this->assertSame(
				$value,
				$fetched_workflow[ $param ],
				sprintf( 'The following param failed: %s', $param )
			);
		}
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
