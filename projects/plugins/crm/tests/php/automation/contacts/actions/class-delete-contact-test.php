<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Automation\Tests;

use Automattic\Jetpack\CRM\Automation\Actions\Delete_Contact;
use Automattic\Jetpack\CRM\Automation\Automation_Engine;
use Automattic\Jetpack\CRM\Automation\Automation_Workflow;
use Automattic\Jetpack\CRM\Automation\Conditions\Contact_Field_Changed;
use Automattic\Jetpack\CRM\Automation\Data_Types\Contact_Data;
use Automattic\Jetpack\CRM\Automation\Triggers\Contact_Updated;
use Automattic\Jetpack\CRM\Entities\Contact;
use Automattic\Jetpack\CRM\Tests\JPCRM_Base_Integration_Test_Case;

/**
 * Test Automation Workflow functionalities
 *
 * @covers Automattic\Jetpack\CRM\Automation\Actions\Delete_Contact
 */
class Delete_Contact_Test extends JPCRM_Base_Integration_Test_Case {

	/**
	 * A helper class to generate data for the automation tests.
	 *
	 * @since 6.2.0
	 *
	 * @var Automation_Faker
	 */
	private $automation_faker;

	/**
	 * {@inheritdoc}
	 */
	public function setUp(): void {
		parent::setUp();
		$this->automation_faker = Automation_Faker::instance();
		$this->automation_faker->reset_all();
	}

	/**
	 * @testdox Test the delete contact action executes the action.
	 */
	public function test_delete_contact_action() {
		global $zbs;

		// Create a contact and verify it was created.
		$contact_id = $this->add_contact();
		/** @var Contact $contact */
		$contact = $this->get_contact( $contact_id );

		// Setup action that is supposed to delete the contact.
		$action_delete_contact = new Delete_Contact(
			array(
				'slug'       => Delete_Contact::get_slug(),
				'attributes' => array(
					'keep_orphans' => true,
				),
			)
		);

		// Execute the action.
		$action_delete_contact->validate_and_execute( new Contact_Data( $contact ) );

		// Verify that the contact no longer exists.
		$contact = $zbs->DAL->contacts->getContact( $contact_id );
		$this->assertFalse( $contact );
	}

	/**
	 * @testdox Test the delete contact action executes the action, within a workflow
	 */
	public function test_delete_contact_action_with_workflow() {
		global $zbs;

		// Register dependencies.
		$automation = new Automation_Engine();
		$automation->register_trigger( Contact_Updated::class );
		$automation->register_step( Contact_Field_Changed::class );
		$automation->register_step( Delete_Contact::class );

		// Create a contact to verify it existed before we delete it.
		$contact_id = $this->add_contact( array( 'status' => 'Anything but lead' ) );
		$contact    = $zbs->DAL->contacts->getContact( $contact_id );
		$this->assertIsArray( $contact );

		$workflow_data = $this->automation_faker->workflow_with_condition_customizable_trigger_action(
			Contact_Updated::get_slug(),
			array(
				'slug'       => Delete_Contact::get_slug(),
				'attributes' => array(
					'keep_orphans' => true,
				),
			)
		);

		$workflow = new Automation_Workflow( $workflow_data );
		$workflow->set_engine( $automation );
		$automation->add_workflow( $workflow );
		$automation->init_workflows();

		// Change the status to "Lead" so the Contact Status Updated conditions defined in
		// Automation_Faker::workflow_with_condition_customizable_trigger_action() will be met.
		$zbs->DAL->contacts->addUpdateContact(
			array(
				'id'   => $contact_id,
				'data' => array(
					'status' => 'Lead',
				),
			)
		);

		// Verify that the contact no longer exists.
		$contact = $zbs->DAL->contacts->getContact( $contact_id );
		$this->assertFalse( $contact );
	}
}
