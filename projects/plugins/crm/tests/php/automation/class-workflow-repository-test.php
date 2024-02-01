<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Automation\Tests;

use Automattic\Jetpack\CRM\Automation\Automation_Workflow;
use Automattic\Jetpack\CRM\Automation\Workflow\Workflow_Repository;
use Automattic\Jetpack\CRM\Tests\JPCRM_Base_Integration_Test_Case;

require_once __DIR__ . '/tools/class-automation-faker.php';

/**
 * Test Automation Engine
 *
 * @covers Automattic\Jetpack\CRM\Automation
 */
class Workflow_Repository_Test extends JPCRM_Base_Integration_Test_Case {

	/**
	 * @testdox Workflow Repository instance creation
	 */
	public function test_workflow_repository_instance() {
		$workflow_repo = new Workflow_Repository();

		$this->assertInstanceOf( Workflow_Repository::class, $workflow_repo );
	}

	/**
	 * @testdox Persist a Workflow instance to the DB
	 */
	public function test_persist_workflow() {

		$workflow_data = Automation_Faker::instance()->workflow_with_condition_action();

		$workflow = new Automation_Workflow( $workflow_data );

		$repo = new Workflow_Repository();
		$repo->persist( $workflow );

		$workflow_persisted = $repo->find( $workflow->get_id() );

		$this->assertEquals( $workflow->to_array(), $workflow_persisted->to_array() );
	}

	/**
	 * @testdox Retrieve all the Workflows
	 */
	public function test_retrieve_all_workflows() {
		$workflow_data = Automation_Faker::instance()->workflow_with_condition_action();
		$workflow_1    = new Automation_Workflow( $workflow_data );

		$workflow_data['name'] = 'Workflow 2';
		$workflow_2            = new Automation_Workflow( $workflow_data );

		$workflow_data['name'] = 'Workflow 3';
		$workflow_3            = new Automation_Workflow( $workflow_data );

		$repo = new Workflow_Repository();
		$repo->persist( $workflow_1 );
		$repo->persist( $workflow_2 );
		$repo->persist( $workflow_3 );

		$workflows_persisted = array(
			$workflow_1->get_id() => $workflow_1,
			$workflow_2->get_id() => $workflow_2,
			$workflow_3->get_id() => $workflow_3,
		);

		$workflows = $repo->find_all();

		$this->assertCount( 3, $workflows );

		foreach ( $workflows as $workflow ) {
			$this->assertInstanceOf( Automation_Workflow::class, $workflow );
			$this->assertEquals( $workflows_persisted[ $workflow->get_id() ]->to_array(), $workflow->to_array() );
		}
	}

	/**
	 * @testdox Delete a Workflow by ID
	 */
	public function test_delete_workflow() {
		$workflow_data = Automation_Faker::instance()->workflow_with_condition_action();
		$workflow      = new Automation_Workflow( $workflow_data );

		$repo = new Workflow_Repository();
		$repo->persist( $workflow );

		$workflow_persisted = $repo->find( $workflow->get_id() );

		// Check that it was persisted well
		$this->assertEquals( $workflow->to_array(), $workflow_persisted->to_array() );

		// Delete the workflow. We pass the same because it should be updated with the ID.
		$repo->delete( $workflow );

		// It should not be found anymore
		$workflow_persisted = $repo->find( $workflow->get_id() );

		$this->assertFalse( $workflow_persisted );
	}

	/**
	 * @testdox Find by active workflows using a criteria.
	 */
	public function test_find_by_with_one_criteria() {
		$workflow_data = Automation_Faker::instance()->workflow_with_condition_action();
		$workflow_1    = new Automation_Workflow( $workflow_data );

		$workflow_data['name'] = 'Workflow 2';
		$workflow_2            = new Automation_Workflow( $workflow_data );

		$workflow_data['name'] = 'Workflow 3';
		$workflow_3            = new Automation_Workflow( $workflow_data );

		$workflow_1->turn_on();
		$workflow_2->turn_off();
		$workflow_3->turn_on();

		$repo = new Workflow_Repository();
		$repo->persist( $workflow_1 );
		$repo->persist( $workflow_2 );
		$repo->persist( $workflow_3 );

		$workflows_persisted = array(
			$workflow_1->get_id() => $workflow_1,
			$workflow_2->get_id() => $workflow_2,
			$workflow_3->get_id() => $workflow_3,
		);

		$workflows = $repo->find_by(
			array(
				'active' => true,
			)
		);

		// It should return 2 workflows
		$this->assertCount( 2, $workflows );

		// And they should match with the ones we persisted
		foreach ( $workflows as $workflow ) {
			$this->assertInstanceOf( Automation_Workflow::class, $workflow );
			$this->assertEquals( $workflows_persisted[ $workflow->get_id() ]->to_array(), $workflow->to_array() );
		}
	}

	/**
	 * @testdox Find by workflows using two criterias.
	 */
	public function test_find_by_with_two_criterias() {
		$workflow_data = Automation_Faker::instance()->workflow_with_condition_action();
		$workflow_1    = new Automation_Workflow( $workflow_data );

		$workflow_data['name'] = 'Workflow 2';
		$workflow_2            = new Automation_Workflow( $workflow_data );

		$workflow_data['name'] = 'Workflow 3';
		$workflow_3            = new Automation_Workflow( $workflow_data );

		$workflow_1->turn_on();
		$workflow_2->turn_off();
		$workflow_3->turn_on();
		$workflow_3->set_category( 'category_1' );

		$repo = new Workflow_Repository();
		$repo->persist( $workflow_1 );
		$repo->persist( $workflow_2 );
		$repo->persist( $workflow_3 );

		$workflows_persisted = array(
			$workflow_1->get_id() => $workflow_1,
			$workflow_2->get_id() => $workflow_2,
			$workflow_3->get_id() => $workflow_3,
		);

		$workflows = $repo->find_by(
			array(
				'active'   => true,
				'category' => 'category_1',
			)
		);

		// It should return 1 workflow #3
		$this->assertCount( 1, $workflows );

		// And they should match with the ones we persisted
		foreach ( $workflows as $workflow ) {
			$this->assertInstanceOf( Automation_Workflow::class, $workflow );
			$this->assertEquals( $workflows_persisted[ $workflow->get_id() ]->to_array(), $workflow->to_array() );
		}
	}

	/**
	 * DataProvider for pagination tests.
	 *
	 * These scenarios assume that we always have 5 workflows when defining expectations.
	 *
	 * @return array Pagination criteria.
	 */
	public function dataprovider_pagination_criteria() {
		return array(
			'return all if we provide default arguments' => array(
				array(
					'limit'  => 0,
					'offset' => 0,
				),
				5,
			),
			'return a specific amount if we provide a limit' => array(
				array(
					'limit'  => 3,
					'offset' => 0,
				),
				3,
			),
			'return the remaining workflows if we provide an offset' => array(
				array(
					'limit'  => 0,
					'offset' => 1,
				),
				4,
			),
			'return the last two workflows if we use a combination of limit and workflow' => array(
				array(
					'limit'  => 3,
					'offset' => 3,
				),
				2,
			),
		);
	}

	/**
	 * Find by pagination criteria.
	 *
	 * @dataProvider dataprovider_pagination_criteria
	 *
	 * @since 6.2.0
	 *
	 * @param array $args Dynamic criteria for pagination.
	 * @param int $expected_count The expected number of returned workflows.
	 */
	public function test_find_by_pagination( array $args, int $expected_count ) {
		$workflow_data = Automation_Faker::instance()->workflow_with_condition_action();
		$repo          = new Workflow_Repository();

		// Create 5 workflows.
		for ( $i = 0; $i < 5; $i++ ) {
			$workflow_data['name'] = sprintf( 'Workflow %d', $i );
			$workflow              = new Automation_Workflow( $workflow_data );
			$repo->persist( $workflow );
		}

		$this->assertCount(
			$expected_count,
			$repo->find_by(
				array(),
				'id',
				$args['limit'],
				$args['offset']
			)
		);
	}
}
