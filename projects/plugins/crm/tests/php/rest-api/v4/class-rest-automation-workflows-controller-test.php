<?php

namespace Automattic\Jetpack\CRM\Tests;

use Automatic\Jetpack\CRM\Automation\Tests\Mocks\Contact_Created_Trigger;
use Automattic\Jetpack\CRM\Automation\Automation_Engine;
use Automattic\Jetpack\CRM\Automation\Automation_Workflow;
use Automattic\Jetpack\CRM\Automation\Tests\Automation_Faker;
use Automattic\Jetpack\CRM\Automation\Tests\Mocks\Contact_Condition;
use Automattic\Jetpack\CRM\Automation\Tests\Mocks\Dummy_Step;
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
	 * @var Automation_Faker Automation Faker instance.
	 */
	private $automation_faker;

	/**
	 * Set up the test.
	 *
	 * @return void
	 */
	public function set_up(): void {
		parent::set_up();
		$this->automation_faker = Automation_Faker::instance();

		// Register mock steps, so we can test the API without duplicating declaration every
		// time we use Automation_Faker data.
		$engine = Automation_Engine::instance();
		$engine->register_step( Contact_Condition::class );
		$engine->register_step( Dummy_Step::class );

		// Make sure the default test trigger is registered.
		// @todo Figure out why we have to check if it already exists.
		// Initial exploration doesn't seem to leak any information to the next test
		// (which is indirectly confirmed by the steps above not complaining).
		if ( ! isset( $engine->get_registered_triggers()[ Contact_Created_Trigger::get_slug() ] ) ) {
			$engine->register_trigger( Contact_Created_Trigger::class );
		}
	}

	/**
	 * DataProvider: Roles.
	 */
	public function dataprovider_user_roles(): array {
		return array(
			'subscriber'    => array( 'subscriber', false ),
			'administrator' => array( 'administrator', true ),
			'zerobs_admin'  => array( 'zerobs_admin', true ),
		);
	}

	/**
	 * Auth: Test that specific roles has access to the API.
	 *
	 * We use the simple "get all workflows" endpoint to test this since
	 * all endpoints currently share the same auth logic.
	 *
	 * @see REST_Automation_Workflows_Controller::get_items_permissions_check()
	 *
	 * @dataProvider dataprovider_user_roles
	 */
	public function test_role_access( $role, $expectation ) {
		// Create and set authenticated user.
		$jpcrm_admin_id = $this->create_wp_jpcrm_admin( array( 'role' => $role ) );
		wp_set_current_user( $jpcrm_admin_id );

		// Make request.
		$request  = new WP_REST_Request(
			WP_REST_Server::READABLE,
			'/jetpack-crm/v4/automation/workflows'
		);
		$response = rest_do_request( $request );

		if ( $expectation ) {
			$this->assertSame(
				200,
				$response->get_status(),
				sprintf( 'Role should be allowed: %s', $role )
			);
		} else {
			$this->assertSame(
				403,
				$response->get_status(),
				sprintf( 'Role should not be allowed: %s', $role )
			);
		}
	}

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

		$response_data = $this->prune_multiple_workflows( $response->get_data() );
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

		$response_data = $this->prune_workflow_response( $response->get_data() );
		$this->assertIsArray( $response_data );

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
			// We re-use the same trigger twice to verify that we can update the triggers data.
			// We could also use two unique triggers, but this makes it, so we don't have to
			// register more triggers to run the test.
			'triggers'     => array(
				Contact_Created_Trigger::get_slug(),
				Contact_Created_Trigger::get_slug(),
			),
			'initial_step' => 'updated_step_2',
			'steps'        => array(
				'updated_step_1' => array(
					'slug'            => Contact_Condition::get_slug(),
					'next_step_true'  => 'updated_step_2',
					'next_step_false' => null,
					'attributes'      => array(),
				),
				'updated_step_2' => array(
					'slug'            => Contact_Condition::get_slug(),
					'next_step_true'  => null,
					'next_step_false' => null,
					'attributes'      => array(),
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
		$response_data = $this->prune_workflow_response( $response->get_data() );
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
	 * Prune workflow API response data for comparisons purposes.
	 *
	 * @see prune_workflow_response
	 *
	 * @param array[] $workflows The returned workflows we wish to prune for direct comparison.
	 * @return array The pruned workflows.
	 */
	protected function prune_multiple_workflows( $workflows ) {
		foreach ( $workflows as $index => $workflow ) {
			$workflows[ $index ] = $this->prune_workflow_response( $workflow );
		}

		return $workflows;
	}

	/**
	 * Prune workflow API response data for comparisons.
	 *
	 * The API endpoint will add additional data to workflow objects that we do not
	 * necessarily care about (e.g.: "attribute_definitions"), so this method will
	 * prune those data to make it easier to compare the original workflow and
	 * the response.
	 *
	 * @since 6.2.0
	 *
	 * @param array $workflow_data The returned workflow data.
	 * @return array The pruned workflow data.
	 */
	protected function prune_workflow_response( array $workflow_data ): array {
		$static_step_fields = array(
			'id',
			'title',
			'description',
			'category',
			'step_type',
			'attribute_definitions',
		);

		if ( ! empty( $workflow_data['steps'] ) && is_array( $workflow_data['steps'] ) ) {
			foreach ( $workflow_data['steps'] as $index => $step ) {
				foreach ( $static_step_fields as $field ) {
					if ( isset( $step[ $field ] ) ) {
						unset( $step[ $field ] );
					}
				}

				$workflow_data['steps'][ $index ] = $step;
			}
		}

		// Revert the triggers to their original format.
		// We populate workflows with full trigger objects, but the Automation_Workflow class itself
		// only stores the trigger slug, so we have to reduce the trigger object from API responses to
		// slugs before we're able to do direct comparisons.
		if ( ! empty( $workflow_data['triggers'] ) && is_array( $workflow_data['triggers'] ) ) {
			foreach ( $workflow_data['triggers'] as $index => $trigger ) {
				$workflow_data['triggers'][ $index ] = $workflow_data['triggers'][ $index ]['slug'];
			}
		}

		return $workflow_data;
	}

	/**
	 * DELETE Workflow: Test that we can successfully delete a workflow.
	 *
	 * @return void
	 */
	public function test_delete_workflow_success() {
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
			WP_REST_Server::DELETABLE,
			sprintf( '/jetpack-crm/v4/automation/workflows/%d', $workflow->get_id() )
		);

		$response = rest_do_request( $request );
		$this->assertSame( 204, $response->get_status() );

		// Verify that the workflow was deleted.
		$repo = new Workflow_Repository();
		$this->assertFalse( $repo->find( $workflow->get_id() ) );
	}

	/**
	 * DELETE Workflow: Test that we return a 404 if the workflow does not exist.
	 *
	 * @return void
	 */
	public function test_delete_workflow_return_404_if_id_do_not_exist() {
		// Create and set authenticated user.
		$jpcrm_admin_id = $this->create_wp_jpcrm_admin();
		wp_set_current_user( $jpcrm_admin_id );

		// Make request.
		$request = new WP_REST_Request(
			WP_REST_Server::DELETABLE,
			'/jetpack-crm/v4/automation/workflows/%d'
		);

		$response = rest_do_request( $request );
		$this->assertSame( 404, $response->get_status() );
	}

	/**
	 * POST (Single) Workflow: Test that we can successfully create a workflow.
	 *
	 * @return void
	 */
	public function test_create_workflow_success() {
		// Create and set authenticated user.
		$jpcrm_admin_id = $this->create_wp_jpcrm_admin();
		wp_set_current_user( $jpcrm_admin_id );

		$workflow_data = Automation_Faker::instance()->workflow_with_condition_action();

		// Make request.
		$request = new WP_REST_Request( 'POST', '/jetpack-crm/v4/automation/workflows' );
		foreach ( $workflow_data as $param => $value ) {
			$request->set_param( $param, $value );
		}
		$response = rest_do_request( $request );
		$this->assertSame( 200, $response->get_status() );

		// Verify that all our parameters are returned in the created workflow.
		$response_data = $this->prune_workflow_response( $response->get_data() );
		$this->assertIsArray( $response_data );
		foreach ( $workflow_data as $param => $value ) {
			$this->assertSame(
				$value,
				$response_data[ $param ],
				sprintf( 'The following param failed: %s', $param )
			);
		}

		// Verify that all of our parameters were persisted in the database.
		$repo             = new Workflow_Repository();
		$fetched_workflow = ( $repo->find( $response_data['id'] ) )->to_array();
		$this->assertIsArray( $response_data );
		foreach ( $workflow_data as $param => $value ) {
			$this->assertEquals(
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
			$this->automation_faker->workflow_with_condition_action()
		);

		$workflow_data['triggers'] = array( Contact_Created_Trigger::get_slug() );

		$workflow = new Automation_Workflow( $workflow_data );

		$repo = new Workflow_Repository();
		$repo->persist( $workflow );

		return $workflow;
	}
}
