<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Automation\Tests;

use Automattic\Jetpack\CRM\Automation\Automation_Engine;
use Automattic\Jetpack\CRM\Automation\Automation_Workflow;
use Automattic\Jetpack\CRM\Automation\Data_Types\Task_Data;
use Automattic\Jetpack\CRM\Automation\Triggers\Task_Created;
use Automattic\Jetpack\CRM\Automation\Triggers\Task_Deleted;
use Automattic\Jetpack\CRM\Automation\Triggers\Task_Updated;
use Automattic\Jetpack\CRM\Entities\Task;
use Automattic\Jetpack\CRM\Tests\JPCRM_Base_Test_Case;

require_once __DIR__ . '../../tools/class-automation-faker.php';

/**
 * Test Automation's task triggers
 *
 * @covers Automattic\Jetpack\CRM\Automation\Triggers\Task_Created
 * @covers Automattic\Jetpack\CRM\Automation\Triggers\Task_Deleted
 * @covers Automattic\Jetpack\CRM\Automation\Triggers\Task_Updated
 */
class Task_Trigger_Test extends JPCRM_Base_Test_Case {

	private $automation_faker;

	public function setUp(): void {
		parent::setUp();
		$this->automation_faker = Automation_Faker::instance();
	}

	/**
	 * @testdox Test the task created trigger executes the workflow with an action
	 */
	public function test_task_created_trigger() {
		$workflow_data = $this->automation_faker->workflow_without_initial_step_customize_trigger( 'jpcrm/task_created' );

		// Build a PHPUnit mock Automation_Workflow
		$workflow = $this->getMockBuilder( Automation_Workflow::class )
			->setConstructorArgs( array( $workflow_data ) )
			->onlyMethods( array( 'execute' ) )
			->getMock();

		// Init the Task_Created trigger.
		$trigger = new Task_Created();
		$trigger->init( $workflow );

		/** @var Task $task */
		$task = $this->automation_faker->task();

		$task_data = new Task_Data( $task );

		// We expect the workflow to be executed on task_created event with the task data.
		$workflow->expects( $this->once() )
		->method( 'execute' )
		->with(
			$trigger,
			$task_data
		);

		// Run the task_created action.
		do_action( 'jpcrm_task_created', $task );
	}

	/**
	 * @testdox Test the task deleted trigger executes the workflow with an action
	 */
	public function test_task_deleted_trigger() {
		$workflow_data = $this->automation_faker->workflow_without_initial_step_customize_trigger( 'jpcrm/task_deleted' );

		$trigger = new Task_Deleted();

		// Build a PHPUnit mock Automation_Workflow
		$workflow = $this->getMockBuilder( Automation_Workflow::class )
			->setConstructorArgs( array( $workflow_data ) )
			->onlyMethods( array( 'execute' ) )
			->getMock();

		// Init the Task_Deleted trigger.
		$trigger->init( $workflow );

		/** @var Task $task */
		$task = $this->automation_faker->task();

		$task_data = new Task_Data( $task );

		// We expect the workflow to be executed on task_deleted event with the task data.
		$workflow->expects( $this->once() )
		->method( 'execute' )
		->with(
			$trigger,
			$task_data
		);

		// Run the task_deleted action.
		do_action( 'jpcrm_task_delete', $task );
	}

	/**
	 * @testdox Test the task updated trigger executes the workflow with an action
	 */
	public function test_task_updated_trigger() {
		$workflow_data = $this->automation_faker->workflow_without_initial_step_customize_trigger( 'jpcrm/task_updated' );

		$trigger = new Task_Updated();

		// Build a PHPUnit mock Automation_Workflow
		$workflow = $this->getMockBuilder( Automation_Workflow::class )
			->setConstructorArgs( array( $workflow_data ) )
			->onlyMethods( array( 'execute' ) )
			->getMock();
		$workflow->set_engine( new Automation_Engine() );

		// Init the Task_Updated trigger.
		$trigger->init( $workflow );

		/** @var Task $task */
		$task = $this->automation_faker->task();

		$task_data = new Task_Data( $task );

		// We expect the workflow to be executed on task_updated event with the task data.
		$workflow->expects( $this->once() )
		->method( 'execute' )
		->with(
			$trigger,
			$task_data
		);

		// Run the task_updated action.
		do_action( 'jpcrm_task_updated', $task );
	}
}
