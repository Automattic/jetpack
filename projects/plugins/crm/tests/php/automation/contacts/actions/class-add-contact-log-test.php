<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Automation\Tests;

use Automattic\Jetpack\CRM\Automation\Actions\Add_Contact_Log;
use Automattic\Jetpack\CRM\Automation\Automation_Engine;
use Automattic\Jetpack\CRM\Automation\Automation_Workflow;
use Automattic\Jetpack\CRM\Automation\Conditions\Contact_Field_Changed;
use Automattic\Jetpack\CRM\Automation\Data_Types\Contact_Data;
use Automattic\Jetpack\CRM\Automation\Triggers\Contact_Created;
use Automattic\Jetpack\CRM\Tests\JPCRM_Base_Integration_Test_Case;

/**
 * Test Automation Workflow functionalities
 *
 * @covers Automattic\Jetpack\CRM\Automation\Actions\Add_Contact_Log
 */
class Add_Contact_Log_Test extends JPCRM_Base_Integration_Test_Case {

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
	 * @testdox Test that the 'adding a log to a contact' action executes the action.
	 */
	public function test_add_contact_log_action() {
		global $zbs;

		// Create a contact.
		$contact_id = $this->add_contact();
		$contact    = $this->get_contact( $contact_id );

		// Prepare
		$action = new Add_Contact_Log(
			array(
				'slug'       => Add_Contact_Log::get_slug(),
				'attributes' => array(
					'type'              => 'test-type',
					'short-description' => 'Short description',
					'long-description'  => 'Long description',
				),
			)
		);

		$contact_data = new Contact_Data( $contact );

		// Execute the action.
		$action->validate_and_execute( $contact_data );

		// Verify that our contact has a log.
		$logs = $zbs->DAL->logs->getLogsForObj(
			array(
				'objtype'  => ZBS_TYPE_CONTACT,
				'objid'    => $contact_id,
				'notetype' => 'test-type',
			)
		);
		$this->assertCount( 1, $logs );

		$test_log = current( $logs );
		$this->assertSame( 'Short description', $test_log['shortdesc'] );
		$this->assertSame( 'Long description', $test_log['longdesc'] );
	}

	/**
	 * @testdox Test that the 'adding a log to a contact' action executes the action, within a workflow.
	 */
	public function test_add_contact_log_action_with_workflow() {
		global $zbs;

		// Register dependencies.
		$automation = new Automation_Engine();
		$automation->register_trigger( Contact_Created::class );
		$automation->register_step( Contact_Field_Changed::class );
		$automation->register_step( Add_Contact_Log::class );

		// Setup action that is supposed to update newly created contacts.
		$workflow_data = $this->automation_faker->workflow_with_condition_customizable_trigger_action(
			Contact_Created::get_slug(),
			array(
				'slug'       => Add_Contact_Log::get_slug(),
				'attributes' => array(
					'type'              => 'test-type',
					'short-description' => 'Short description',
					'long-description'  => 'Long description',
				),
			)
		);

		$workflow = new Automation_Workflow( $workflow_data );
		$workflow->set_engine( $automation );
		$automation->add_workflow( $workflow );
		$automation->init_workflows();

		// Create a new contact to trigger our workflow.
		$contact_id = $this->add_contact();

		// Verify that our contact has a log.
		$logs = $zbs->DAL->logs->getLogsForObj(
			array(
				'objtype'  => ZBS_TYPE_CONTACT,
				'objid'    => $contact_id,
				'notetype' => 'test-type',
			)
		);
		$this->assertCount( 1, $logs );

		$test_log = current( $logs );
		$this->assertSame( 'Short description', $test_log['shortdesc'] );
		$this->assertSame( 'Long description', $test_log['longdesc'] );
	}
}
