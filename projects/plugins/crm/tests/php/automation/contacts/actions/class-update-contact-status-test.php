<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Automation\Tests;

use Automattic\Jetpack\CRM\Automation\Actions\Update_Contact_Status;
use Automattic\Jetpack\CRM\Automation\Automation_Engine;
use Automattic\Jetpack\CRM\Automation\Automation_Workflow;
use Automattic\Jetpack\CRM\Automation\Conditions\Contact_Field_Changed;
use Automattic\Jetpack\CRM\Automation\Data_Types\Contact_Data;
use Automattic\Jetpack\CRM\Automation\Triggers\Contact_Created;
use Automattic\Jetpack\CRM\Tests\JPCRM_Base_Integration_Test_Case;

/**
 * Test Automation Workflow functionalities
 *
 * @covers Automattic\Jetpack\CRM\Automation\Actions\Update_Contact_Status
 */
class Update_Contact_Status_Test extends JPCRM_Base_Integration_Test_Case {

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
	 * @testdox Test the update contact status action executes the action.
	 */
	public function test_update_contact_status_action() {
		global $zbs;

		$contact_id = $this->add_contact( array( 'status' => 'Lead' ) );
		$contact    = $this->get_contact( $contact_id );
		$this->assertSame( 'Lead', $contact->status );

		$action_update_contact = new Update_Contact_Status(
			array(
				'slug'       => 'jpcrm/update_contact_status',
				'attributes' => array(
					'new_status' => 'Customer',
				),
			)
		);

		$action_update_contact->validate_and_execute( new Contact_Data( $contact ) );

		$contact = $zbs->DAL->contacts->getContact( $contact_id );
		$this->assertSame( 'Customer', $contact['status'] );
	}

	/**
	 * @testdox Test the update contact status action executes the action, within a workflow.
	 */
	public function test_update_contact_status_action_with_workflow() {
		global $zbs;

		$automation = new Automation_Engine();
		$automation->register_trigger( Contact_Created::class );
		$automation->register_step( Contact_Field_Changed::class );
		$automation->register_step( Update_Contact_Status::class );

		$workflow_data = $this->automation_faker->workflow_with_condition_customizable_trigger_action(
			Contact_Created::get_slug(),
			array(
				'slug'       => Update_Contact_Status::get_slug(),
				'attributes' => array(
					'new_status' => 'Customer',
				),
			)
		);

		$workflow = new Automation_Workflow( $workflow_data );
		$workflow->set_engine( $automation );

		$automation->add_workflow( $workflow );
		$automation->init_workflows();

		$contact_id = $this->add_contact( array( 'status' => 'Lead' ) );

		$contact = $zbs->DAL->contacts->getContact( $contact_id );
		$this->assertSame( 'Customer', $contact['status'] );
	}
}
