<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Automation\Tests;

use Automattic\Jetpack\CRM\Automation\Actions\Update_Contact;
use Automattic\Jetpack\CRM\Automation\Automation_Engine;
use Automattic\Jetpack\CRM\Automation\Automation_Workflow;
use Automattic\Jetpack\CRM\Automation\Conditions\Contact_Field_Changed;
use Automattic\Jetpack\CRM\Automation\Data_Types\Contact_Data;
use Automattic\Jetpack\CRM\Automation\Triggers\Contact_Created;
use Automattic\Jetpack\CRM\Tests\JPCRM_Base_Integration_Test_Case;

/**
 * Test Automation Workflow functionalities
 *
 * @covers Automattic\Jetpack\CRM\Automation\Actions\Update_Contact
 */
class Update_Contact_Test extends JPCRM_Base_Integration_Test_Case {

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
	 * @testdox Test the update contact action executes the action.
	 */
	public function test_update_contact_action() {
		global $zbs;

		// Create a contact that we can later update to verify the action works.
		$contact_id = $this->add_contact(
			array(
				'fname' => 'This is definitely not a real first name',
			)
		);
		$contact    = $this->get_contact( $contact_id );
		$this->assertSame( 'This is definitely not a real first name', $contact->fname );

		// Define what happens when the action is executed.
		$action = new Update_Contact(
			array(
				'slug'       => Update_Contact::get_slug(),
				'attributes' => array(
					'fname' => 'Samantha',
				),
			)
		);

		// Execute action.
		$action->validate_and_execute( new Contact_Data( $contact ) );

		// Fetch the contact again and verify the update was successful.
		$contact = $zbs->DAL->contacts->getContact( $contact_id );
		$this->assertSame( 'Samantha', $contact['fname'] );
	}

	/**
	 * @testdox Test the update contact action executes the action, within a workflow.
	 */
	public function test_update_contact_action_with_workflow() {
		global $zbs;

		// Register dependencies.
		$automation = new Automation_Engine();
		$automation->register_trigger( Contact_Created::class );
		$automation->register_step( Contact_Field_Changed::class );
		$automation->register_step( Update_Contact::class );

		// Setup action that is supposed to update newly created contacts.
		$workflow_data = $this->automation_faker->workflow_with_condition_customizable_trigger_action(
			Contact_Created::get_slug(),
			array(
				'slug'       => Update_Contact::get_slug(),
				'attributes' => array(
					'fname'  => 'Samantha',
					'prefix' => 'Ms',
				),
			)
		);

		$workflow = new Automation_Workflow( $workflow_data );
		$workflow->set_engine( $automation );
		$automation->add_workflow( $workflow );
		$automation->init_workflows();

		// Create a new contact with a first name and prefix that we expect to be modified.
		$contact_id = $this->add_contact(
			array(
				'fname'  => 'This is definitely not a real first name',
				'prefix' => 'Mr',
				// Adding a last name to ensure its still the same after the update.
				'lname'  => 'Manhatten',
			)
		);

		// Verify that the contact was updated.
		$contact = $zbs->DAL->contacts->getContact( $contact_id );
		$this->assertIsArray( $contact );
		$this->assertSame( 'Samantha', $contact['fname'] );
		$this->assertSame( 'Manhatten', $contact['lname'] );
		$this->assertSame( 'Ms', $contact['prefix'] );
	}
}
