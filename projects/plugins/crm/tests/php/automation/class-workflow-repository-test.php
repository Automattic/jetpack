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
	public function test_retrieve_all_workflow() {
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
}
