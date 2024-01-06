<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Automation\Tests;

use Automattic\Jetpack\CRM\Automation\Automation_Workflow;
use Automattic\Jetpack\CRM\Automation\Data_Types\Contact_Data;
use Automattic\Jetpack\CRM\Automation\Triggers\Contact_Before_Deleted;
use Automattic\Jetpack\CRM\Automation\Triggers\Contact_Created;
use Automattic\Jetpack\CRM\Automation\Triggers\Contact_Deleted;
use Automattic\Jetpack\CRM\Automation\Triggers\Contact_Email_Updated;
use Automattic\Jetpack\CRM\Automation\Triggers\Contact_Status_Updated;
use Automattic\Jetpack\CRM\Automation\Triggers\Contact_Updated;
use Automattic\Jetpack\CRM\Entities\Contact;
use Automattic\Jetpack\CRM\Tests\JPCRM_Base_Test_Case;

require_once __DIR__ . '../../tools/class-automation-faker.php';

/**
 * Test Automation Workflow functionalities
 *
 * @covers Automattic\Jetpack\CRM\Automation
 */
class Contact_Trigger_Test extends JPCRM_Base_Test_Case {

	private $automation_faker;

	public function setUp(): void {
		parent::setUp();
		$this->automation_faker = Automation_Faker::instance();
		$this->automation_faker->reset_all();
	}

	/**
	 * @testdox Test the contact updated trigger executes the workflow with an action
	 */
	public function test_contact_updated_trigger() {

		$workflow_data = $this->automation_faker->workflow_without_initial_step_customize_trigger( 'jpcrm/contact_updated' );

		$trigger = new Contact_Updated();

		// Build a PHPUnit mock Automation_Workflow
		$workflow = $this->getMockBuilder( Automation_Workflow::class )
			->setConstructorArgs( array( $workflow_data ) )
			->onlyMethods( array( 'execute' ) )
			->getMock();

		// Init the Contact_Updated trigger.
		$trigger->init( $workflow );

		// Fake event data.
		/** @var Contact $contact */
		$contact = $this->automation_faker->contact();

		$contact_data = new Contact_Data( $contact );

		// We expect the workflow to be executed on contact_update event with the contact data
		$workflow->expects( $this->once() )
		->method( 'execute' )
		->with(
			$trigger,
			$contact_data
		);

		// Run the contact_update action.
		do_action( 'jpcrm_contact_updated', $contact );
	}

	/**
	 * @testdox Test the contact status updated trigger executes the workflow with an action
	 */
	public function test_contact_status_updated_trigger() {

		$workflow_data = $this->automation_faker->workflow_without_initial_step_customize_trigger( 'jpcrm/contact_status_updated' );

		$trigger = new Contact_Status_Updated();

		// Build a PHPUnit mock Automation_Workflow
		$workflow = $this->getMockBuilder( Automation_Workflow::class )
			->setConstructorArgs( array( $workflow_data ) )
			->onlyMethods( array( 'execute' ) )
			->getMock();

		// Init the Contact_Status_Updated trigger.
		$trigger->init( $workflow );

		// Fake event data.
		/** @var Contact $contact */
		$contact          = $this->automation_faker->contact();
		$previous_contact = clone $contact;

		$contact_data = new Contact_Data( $contact, $previous_contact );

		$previous_contact->status = 'Refused';

		// We expect the workflow to be executed on contact_status_update event with the contact data
		$workflow->expects( $this->once() )
		->method( 'execute' )
		->with(
			$trigger,
			$contact_data
		);

		// Run the contact_status_update action.
		do_action( 'jpcrm_contact_status_updated', $contact, $previous_contact );
	}

	/**
	 * @testdox Test the contact new trigger executes the workflow with an action
	 */
	public function test_contact_created_trigger() {

		$workflow_data = $this->automation_faker->workflow_without_initial_step_customize_trigger( 'jpcrm/contact_created' );

		$trigger = new Contact_Created();

		// Build a PHPUnit mock Automation_Workflow
		$workflow = $this->getMockBuilder( Automation_Workflow::class )
			->setConstructorArgs( array( $workflow_data ) )
			->onlyMethods( array( 'execute' ) )
			->getMock();

		// Init the Contact_Created trigger.
		$trigger->init( $workflow );

		// Fake event data.
		/** @var Contact $contact */
		$contact = $this->automation_faker->contact();

		$contact_data = new Contact_Data( $contact );

		// We expect the workflow to be executed on contact_created event with the contact data
		$workflow->expects( $this->once() )
		->method( 'execute' )
		->with(
			$trigger,
			$contact_data
		);

		// Run the contact_created action.
		do_action( 'jpcrm_contact_created', $contact );
	}

	/**
	 * @testdox Test the contact email updated trigger executes the workflow with an action
	 */
	public function test_contact_email_updated_trigger() {

		$workflow_data = $this->automation_faker->workflow_without_initial_step_customize_trigger( 'jpcrm/contact_email_updated' );

		$trigger = new Contact_Email_Updated();

		// Build a PHPUnit mock Automation_Workflow
		$workflow = $this->getMockBuilder( Automation_Workflow::class )
			->setConstructorArgs( array( $workflow_data ) )
			->onlyMethods( array( 'execute' ) )
			->getMock();

		// Init the Contact_Email_Updated trigger.
		$trigger->init( $workflow );

		// Fake contact data
		/** @var Contact $contact */
		$contact = $this->automation_faker->contact();

		$contact_data = new Contact_Data( $contact );

		// We expect the workflow to be executed on contact_email_update event with the contact data
		$workflow->expects( $this->once() )
		->method( 'execute' )
		->with(
			$trigger,
			$contact_data
		);

		// Run the contact_email_update action.
		do_action( 'jpcrm_contact_email_updated', $contact );
	}

	/**
	 * @testdox Test the contact deleted trigger executes the workflow with an action
	 */
	public function test_contact_deleted_trigger() {

		$workflow_data = $this->automation_faker->workflow_without_initial_step_customize_trigger( 'jpcrm/contact_deleted' );

		$trigger = new Contact_Deleted();

		// Build a PHPUnit mock Automation_Workflow
		$workflow = $this->getMockBuilder( Automation_Workflow::class )
			->setConstructorArgs( array( $workflow_data ) )
			->onlyMethods( array( 'execute' ) )
			->getMock();

		// Init the Contact_Deleted trigger.
		$trigger->init( $workflow );

		// Fake event data.
		/** @var Contact $contact */
		$contact = $this->automation_faker->contact();

		$contact_data = new Contact_Data( $contact );

		// We expect the workflow to be executed on contact_deleted event with the contact data
		$workflow->expects( $this->once() )
		->method( 'execute' )
		->with(
			$trigger,
			$contact_data
		);

		// Run the contact_deleted action.
		do_action( 'jpcrm_contact_deleted', $contact );
	}

	/**
	 * @testdox Test the contact before deleted trigger executes the workflow with an action
	 */
	public function test_contact_before_deleted_trigger() {

		$workflow_data = $this->automation_faker->workflow_without_initial_step_customize_trigger( 'jpcrm/contact_before_deleted' );

		$trigger = new Contact_Before_Deleted();

		// Build a PHPUnit mock Automation_Workflow
		$workflow = $this->getMockBuilder( Automation_Workflow::class )
			->setConstructorArgs( array( $workflow_data ) )
			->onlyMethods( array( 'execute' ) )
			->getMock();

		// Init the Contact_Before_Deleted trigger.
		$trigger->init( $workflow );

		/** @var Contact $contact */
		$contact = $this->automation_faker->contact();

		$contact_data = new Contact_Data( $contact );

		// We expect the workflow to be executed on contact_before_deleted event with the contact data
		$workflow->expects( $this->once() )
		->method( 'execute' )
		->with(
			$trigger,
			$contact_data
		);

		// Run the contact_before_deleted action.
		do_action( 'jpcrm_contact_before_deleted', $contact );
	}
}
