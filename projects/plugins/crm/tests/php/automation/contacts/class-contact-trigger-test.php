<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Automation\Tests;

use Automattic\Jetpack\CRM\Automation\Automation_Engine;
use Automattic\Jetpack\CRM\Automation\Automation_Workflow;
use Automattic\Jetpack\CRM\Automation\Triggers\Contact_Before_Deleted;
use Automattic\Jetpack\CRM\Automation\Triggers\Contact_Deleted;
use Automattic\Jetpack\CRM\Automation\Triggers\Contact_Email_Updated;
use Automattic\Jetpack\CRM\Automation\Triggers\Contact_New;
use Automattic\Jetpack\CRM\Automation\Triggers\Contact_Status_Updated;
use Automattic\Jetpack\CRM\Automation\Triggers\Contact_Updated;
use WorDBless\BaseTestCase;

require_once __DIR__ . '../../tools/class-automation-faker.php';

/**
 * Test Automation Workflow functionalities
 *
 * @covers Automattic\Jetpack\CRM\Automation
 */
class Contact_Trigger_Test extends BaseTestCase {

	private $automation_faker;

	public function setUp(): void {
		parent::setUp();
		$this->automation_faker = Automation_Faker::instance();
	}

	/**
	 * @testdox Test the contact updated trigger executes the workflow with an action
	 */
	public function test_contact_updated_trigger() {

		$workflow_data = $this->automation_faker->workflow_without_initial_step_customize_trigger( 'contact_updated' );

		// Build a PHPUnit mock Contact_Updated trigger.
		$trigger = $this->getMockBuilder( Contact_Updated::class )
		->onlyMethods( array( 'execute_workflow' ) )
		->getMock();

		// Init the mocked trigger.
		$trigger->init( new Automation_Workflow( $workflow_data, new Automation_Engine() ) );

		// Fake event data.
		$contact_data = $this->automation_faker->contact_data();

		// We expect the trigger to be executed on execute_workflow event with the contact data.
		$trigger->expects( $this->once() )
		->method( 'execute_workflow' )
		->with(
			$this->equalTo( $contact_data )
		);

		// Run the contact_update action.
		do_action( 'jpcrm_automation_contact_update', $contact_data );
	}

	/**
	 * @testdox Test the contact status updated trigger executes the workflow with an action
	 */
	public function test_contact_status_updated_trigger() {

		$workflow_data = $this->automation_faker->workflow_without_initial_step_customize_trigger( 'contact_status_updated' );

		// Build a PHPUnit mock Contact_Status_Updated trigger.
		$trigger = $this->getMockBuilder( Contact_Status_Updated::class )
		->onlyMethods( array( 'execute_workflow' ) )
		->getMock();

		// Init the mocked trigger.
		$trigger->init( new Automation_Workflow( $workflow_data, new Automation_Engine() ) );

		// Fake event data.
		$contact_data = $this->automation_faker->contact_data();

		// We expect the trigger to be executed on execute_workflow event with the contact data.
		$trigger->expects( $this->once() )
		->method( 'execute_workflow' )
		->with(
			$this->equalTo( $contact_data )
		);

		// Run the contact_status_update action.
		do_action( 'jpcrm_automation_contact_status_update', $contact_data );
	}

	/**
	 * @testdox Test the contact new trigger executes the workflow with an action
	 */
	public function test_contact_new_trigger() {

		$workflow_data = $this->automation_faker->workflow_without_initial_step_customize_trigger( 'contact_new' );

		// Build a PHPUnit mock Contact_New trigger.
		$trigger = $this->getMockBuilder( Contact_New::class )
		->onlyMethods( array( 'execute_workflow' ) )
		->getMock();

		// Init the mocked trigger.
		$trigger->init( new Automation_Workflow( $workflow_data, new Automation_Engine() ) );

		// Fake event data.
		$contact_data = $this->automation_faker->contact_data();

		// We expect the trigger to be executed on execute_workflow event with the contact data.
		$trigger->expects( $this->once() )
		->method( 'execute_workflow' )
		->with(
			$this->equalTo( $contact_data )
		);

		// Run the contact_new action.
		do_action( 'jpcrm_automation_contact_new', $contact_data );
	}

	/**
	 * @testdox Test the contact email updated trigger executes the workflow with an action
	 */
	public function test_contact_email_updated_trigger() {

		$workflow_data = $this->automation_faker->workflow_without_initial_step_customize_trigger( 'contact_email_updated' );

		// Build a PHPUnit mock Contact_New trigger.
		$trigger = $this->getMockBuilder( Contact_Email_Updated::class )
		->onlyMethods( array( 'execute_workflow' ) )
		->getMock();

		// Init the mocked trigger.
		$trigger->init( new Automation_Workflow( $workflow_data, new Automation_Engine() ) );

		// Fake event data.
		$contact_data = $this->automation_faker->contact_data();

		// We expect the trigger to be executed on execute_workflow event with the contact data.
		$trigger->expects( $this->once() )
		->method( 'execute_workflow' )
		->with(
			$this->equalTo( $contact_data )
		);

		// Run the contact_email_updated action.
		do_action( 'jpcrm_automation_contact_email_update', $contact_data );
	}

	/**
	 * @testdox Test the contact email updated trigger executes the workflow with an action
	 */
	public function test_contact_deleted_trigger() {

		$workflow_data = $this->automation_faker->workflow_without_initial_step_customize_trigger( 'contact_deleted' );

		// Build a PHPUnit mock Contact_Deleted trigger.
		$trigger = $this->getMockBuilder( Contact_Deleted::class )
		->onlyMethods( array( 'execute_workflow' ) )
		->getMock();

		// Init the mocked trigger.
		$trigger->init( new Automation_Workflow( $workflow_data, new Automation_Engine() ) );

		// Fake event data.
		$contact_data = $this->automation_faker->contact_data();

		// We expect the trigger to be executed on execute_workflow event with the contact data.
		$trigger->expects( $this->once() )
		->method( 'execute_workflow' )
		->with(
			$this->equalTo( $contact_data )
		);

		// Run the contact_deleted action.
		do_action( 'jpcrm_automation_contact_delete', $contact_data );
	}

	/**
	 * @testdox Test the contact email updated trigger executes the workflow with an action
	 */
	public function test_contact_before_deleted_trigger() {

		$workflow_data = $this->automation_faker->workflow_without_initial_step_customize_trigger( 'contact_before_deleted' );

		// Build a PHPUnit mock Contact_Deleted trigger.
		$trigger = $this->getMockBuilder( Contact_Before_Deleted::class )
		->onlyMethods( array( 'execute_workflow' ) )
		->getMock();

		// Init the mocked trigger.
		$trigger->init( new Automation_Workflow( $workflow_data, new Automation_Engine() ) );

		// Fake event data.
		$contact_data = $this->automation_faker->contact_data();

		// We expect the trigger to be executed on execute_workflow event with the contact data.
		$trigger->expects( $this->once() )
		->method( 'execute_workflow' )
		->with(
			$this->equalTo( $contact_data )
		);

		// Run the contact_before_deleted action.
		do_action( 'jpcrm_automation_contact_before_delete', $contact_data );
	}

}
