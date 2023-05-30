<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Automation\Tests;

use Automatic\Jetpack\CRM\Automation\Tests\Mocks\Contact_Created_Trigger;
use Automattic\Jetpack\CRM\Automation\Actions\Update_Contact;
use Automattic\Jetpack\CRM\Automation\Automation_Engine;
use Automattic\Jetpack\CRM\Automation\Automation_Workflow;
use WorDBless\BaseTestCase;

require_once __DIR__ . '../../tools/class-automation-faker.php';
require_once __DIR__ . '../../mocks/mock-zbs-dal.php';

/**
 * Test Automation Workflow functionalities
 *
 * @covers Automattic\Jetpack\CRM\Automation
 */
class Contact_Action_Test extends BaseTestCase {

	private $automation_faker;

	public function setUp(): void {
		parent::setUp();
		$this->automation_faker = Automation_Faker::instance();
		DAL_addUpdateContact_mock( $this );
	}

	/**
	 * @testdox Test the update contact action executes the action
	 */
	public function test_update_contact_action() {

		$action_data = array(
			'name'        => 'update_contact',
			'title'       => 'Update Contact Action',
			'description' => 'Test: Testing the update contact action',
			'type'        => 'dummy',
			'category'    => 'testing',
			'attributes'  => array(
				'name'        => 'update_contact',
				'title'       => 'Update Contact Action',
				'description' => 'Test: Testing the update contact action',
				'type'        => 'dummy',
				'category'    => 'testing',
				'new_status'  => 'Customer',
			),
		);

		// Fake event data.
		$contact_data = $this->automation_faker->contact_data();

		$contact_data_expected = array(
			'id'   => 1,
			'data' => array(
				'status' => 'Customer',
				'name'   => 'John Doe',
				'email'  => 'johndoe@example.com',
			),
		);

		$action_update_contact = new Update_Contact( $action_data );

		global $zbs;
		$zbs->DAL->contacts->expects( $this->once() )
			->method( 'addUpdateContact' )
			->with(
				$this->equalTo( $contact_data_expected )
			);

		$action_update_contact->execute( $contact_data );
	}

	/**
	 * @testdox Test the update contact action executes the action, within a workflow
	 */
	public function test_update_contact_action_with_workflow() {

		$action_data = array(
			'name'        => 'update_contact',
			'title'       => 'Update Contact Action',
			'description' => 'Test: Testing the update contact action',
			'type'        => 'dummy',
			'category'    => 'testing',
			'attributes'  => array(
				'name'        => 'update_contact',
				'title'       => 'Update Contact Action',
				'description' => 'Test: Testing the update contact action',
				'type'        => 'dummy',
				'category'    => 'testing',
				'new_status'  => 'Customer',
			),
		);

		$automation = new Automation_Engine();
		$automation->register_trigger( 'contact_created', Contact_Created_Trigger::class );
		$automation->register_step( 'update_contact', Update_Contact::class );

		$workflow_data = $this->automation_faker->workflow_with_condition_customizable_trigger_action( 'contact_created', $action_data );

		$workflow = new Automation_Workflow( $workflow_data, $automation );

		$automation->add_workflow( $workflow );
		$automation->init_workflows();

		// Fake event data.
		$contact_data = $this->automation_faker->contact_data();

		$contact_data_expected = array(
			'id'   => 1,
			'data' => array(
				'status' => 'Customer',
				'name'   => 'John Doe',
				'email'  => 'johndoe@example.com',
			),
		);

		global $zbs;
		$zbs->DAL->contacts->expects( $this->once() )
				->method( 'addUpdateContact' )
				->with(
					$this->equalTo( $contact_data_expected )
				);

		$event_emitter = Event_Emitter::instance();
		$event_emitter->emit_event( 'contact_created', $contact_data );
	}

}
