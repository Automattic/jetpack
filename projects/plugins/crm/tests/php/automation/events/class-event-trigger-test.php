<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Automation\Tests;

use Automattic\Jetpack\CRM\Automation\Automation_Engine;
use Automattic\Jetpack\CRM\Automation\Automation_Workflow;
use Automattic\Jetpack\CRM\Automation\Triggers\Event_Created;
use Automattic\Jetpack\CRM\Automation\Triggers\Event_Deleted;
use Automattic\Jetpack\CRM\Automation\Triggers\Event_Updated;
use WorDBless\BaseTestCase;

require_once __DIR__ . '../../tools/class-automation-faker.php';

/**
 * Test Automation's event triggers
 *
 * @covers Automattic\Jetpack\CRM\Automation\Triggers\Event_Deleted
 * @covers Automattic\Jetpack\CRM\Automation\Triggers\Event_Created
 */
class Event_Trigger_Test extends BaseTestCase {

	private $automation_faker;

	public function setUp(): void {
		parent::setUp();
		$this->automation_faker = Automation_Faker::instance();
	}

	/**
	 * @testdox Test the event created trigger executes the workflow with an action
	 */
	public function test_event_created_trigger() {
		$workflow_data = $this->automation_faker->workflow_without_initial_step_customize_trigger( 'jpcrm/event_created' );

		// Build a PHPUnit mock Automation_Workflow
		$workflow = $this->getMockBuilder( Automation_Workflow::class )
			->setConstructorArgs( array( $workflow_data, new Automation_Engine() ) )
			->onlyMethods( array( 'execute' ) )
			->getMock();

		// Init the Event_Created trigger.
		$trigger = new Event_Created();
		$trigger->init( $workflow );

		// Fake event data.
		$event_data = $this->automation_faker->event_data();

		// We expect the workflow to be executed on event_created event with the event data.
		$workflow->expects( $this->once() )
		->method( 'execute' )
		->with(
			$this->equalTo( $trigger ),
			$this->equalTo( $event_data )
		);

		// Run the event_created action.
		do_action( 'jpcrm_event_created', $event_data );
	}

	/**
	 * @testdox Test the event deleted trigger executes the workflow with an action
	 */
	public function test_event_deleted_trigger() {
		$workflow_data = $this->automation_faker->workflow_without_initial_step_customize_trigger( 'jpcrm/event_deleted' );

		$trigger = new Event_Deleted();

		// Build a PHPUnit mock Automation_Workflow
		$workflow = $this->getMockBuilder( Automation_Workflow::class )
			->setConstructorArgs( array( $workflow_data, new Automation_Engine() ) )
			->onlyMethods( array( 'execute' ) )
			->getMock();

		// Init the Event_Deleted trigger.
		$trigger->init( $workflow );

		// Fake event data.
		$event_data = $this->automation_faker->event_data();

		// We expect the workflow to be executed on event_deleted event with the event data.
		$workflow->expects( $this->once() )
		->method( 'execute' )
		->with(
			$this->equalTo( $trigger ),
			$this->equalTo( $event_data )
		);

		// Run the event_deleted action.
		do_action( 'jpcrm_event_delete', $event_data );
	}

	/**
	 * @testdox Test the event updated trigger executes the workflow with an action
	 */
	public function test_event_updated_trigger() {
		$workflow_data = $this->automation_faker->workflow_without_initial_step_customize_trigger( 'jpcrm/event_updated' );

		$trigger = new Event_Updated();

		// Build a PHPUnit mock Automation_Workflow
		$workflow = $this->getMockBuilder( Automation_Workflow::class )
			->setConstructorArgs( array( $workflow_data, new Automation_Engine() ) )
			->onlyMethods( array( 'execute' ) )
			->getMock();

		// Init the Event_Updated trigger.
		$trigger->init( $workflow );

		// Fake event data.
		$event_data = $this->automation_faker->event_data();

		// We expect the workflow to be executed on event_updated event with the event data.
		$workflow->expects( $this->once() )
		->method( 'execute' )
		->with(
			$this->equalTo( $trigger ),
			$this->equalTo( $event_data )
		);

		// Run the event_updated action.
		do_action( 'jpcrm_event_update', $event_data );
	}
}
