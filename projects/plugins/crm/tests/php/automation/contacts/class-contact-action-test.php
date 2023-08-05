<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Automation\Tests;

use Automatic\Jetpack\CRM\Automation\Tests\Mocks\Contact_Created_Trigger;
use Automattic\Jetpack\CRM\Automation\Actions\Add_Contact_Log;
use Automattic\Jetpack\CRM\Automation\Actions\Add_Remove_Contact_Tag;
use Automattic\Jetpack\CRM\Automation\Actions\Delete_Contact;
use Automattic\Jetpack\CRM\Automation\Actions\New_Contact;
use Automattic\Jetpack\CRM\Automation\Actions\Update_Contact;
use Automattic\Jetpack\CRM\Automation\Actions\Update_Contact_Status;
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
		$this->automation_faker = Automation_Faker::instance( $this );
		$this->automation_faker->reset_all();
	}

	/**
	 * @testdox Test the update contact status action executes the action
	 */
	public function test_update_contact_status_action() {

		$action_data = array(
			'slug'       => 'jpcrm/update_contact_status',
			'attributes' => array(
				'new_status' => 'Customer',
			),
		);

		// Fake event data.
		$contact_data = $this->automation_faker->contact_data();

		$contact_data_expected = $contact_data;

		$contact_data_expected['data']['status'] = 'Customer';

		$action_update_contact = new Update_Contact_Status( $action_data );

		global $zbs;

		DAL_contact_mock( $this, array( 'addUpdateContact' ) );

		$zbs->DAL->contacts->expects( $this->once() )
			->method( 'addUpdateContact' )
			->with(
				$this->equalTo( $contact_data_expected )
			);

		$action_update_contact->execute( $contact_data );
	}

	/**
	 * @testdox Test the update contact status action executes the action, within a workflow
	 */
	public function test_update_contact_status_action_with_workflow() {

		$action_data = array(
			'slug'       => 'jpcrm/update_contact_status',
			'attributes' => array(
				'new_status' => 'Customer',
			),
		);

		$automation = new Automation_Engine();
		$automation->register_trigger( Contact_Created_Trigger::class );
		$automation->register_step( 'jpcrm/update_contact_status', Update_Contact_Status::class );

		$workflow_data = $this->automation_faker->workflow_with_condition_customizable_trigger_action( 'jpcrm/contact_created', $action_data );

		$workflow = new Automation_Workflow( $workflow_data );
		$workflow->set_engine( $automation );

		$automation->add_workflow( $workflow );
		$automation->init_workflows();

		//Fake event data.
		$contact_data = $this->automation_faker->contact_data();

		$contact_data_expected = $this->automation_faker->contact_data();

		$contact_data_expected['data']['status'] = 'Customer';

		global $zbs;

		DAL_contact_mock( $this, array( 'addUpdateContact' ) );

		$zbs->DAL->contacts->expects( $this->once() )
				->method( 'addUpdateContact' )
				->with(
					$this->equalTo( $contact_data_expected )
				);

		$event_emitter = Event_Emitter::instance();
		$event_emitter->emit_event( 'contact_created', $contact_data );
	}

	/**
	 * @testdox Test the delete contact action executes the action
	 */
	public function test_delete_contact_action() {

		$action_data = array(
			'slug'       => 'jpcrm/delete_contact',
			'attributes' => array(
				'keep_orphans' => true,
				'value'        => 'Deleting contact',
			),
		);

		// Fake event data.
		$contact_data = $this->automation_faker->contact_data();

		$contact_data_expected = array(
			'id'          => 1,
			'saveOrphans' => true,
		);

		$action_delete_contact = new Delete_Contact( $action_data );

		global $zbs;

		DAL_contact_mock( $this, array( 'deleteContact' ) );

		$zbs->DAL->contacts->expects( $this->once() )
			->method( 'deleteContact' )
			->with(
				$this->equalTo( $contact_data_expected )
			);

		$action_delete_contact->execute( $contact_data );
	}

	/**
	 * @testdox Test the delete contact action executes the action, within a workflow
	 */
	public function test_delete_contact_action_with_workflow() {

		$action_data = array(
			'slug'       => 'jpcrm/delete_contact',
			'attributes' => array(
				'keep_orphans' => true,
				'value'        => 'Deleting contact',
			),
		);

		$automation = new Automation_Engine();
		$automation->register_trigger( Contact_Created_Trigger::class );
		$automation->register_step( 'jpcrm/delete_contact', Delete_Contact::class );

		$workflow_data = $this->automation_faker->workflow_with_condition_customizable_trigger_action( 'jpcrm/contact_created', $action_data );

		$workflow = new Automation_Workflow( $workflow_data );
		$workflow->set_engine( $automation );

		$automation->add_workflow( $workflow );
		$automation->init_workflows();

		// Fake event data.
		$contact_data = $this->automation_faker->contact_data();

		$contact_data_expected = array(
			'id'          => 1,
			'saveOrphans' => true,
		);
		global $zbs;

		DAL_contact_mock( $this, array( 'deleteContact' ) );

		$zbs->DAL->contacts->expects( $this->once() )
			->method( 'deleteContact' )
			->with(
				$this->equalTo( $contact_data_expected )
			);

		$event_emitter = Event_Emitter::instance();
		$event_emitter->emit_event( 'contact_created', $contact_data );
	}

	/**
	 * @testdox Test the add new contact action executes the action
	 */
	public function test_new_contact_action() {

		$action_data = array(
			'slug'       => 'jpcrm/new_contact',
			'attributes' => array(
				'id'    => -1,
				'data'  => array(
					'status' => 'lead',
					'name'   => 'Jane Doe',
					'email'  => 'janedoe@example.com',
				),
				'value' => 'Adding contact',
			),
		);

		$contact_data_expected = array(
			'id'    => -1,
			'data'  => array(
				'status' => 'lead',
				'name'   => 'Jane Doe',
				'email'  => 'janedoe@example.com',
			),
			'value' => 'Adding contact',
		);

		$action_add_contact = new New_Contact( $action_data );

		global $zbs;

		DAL_contact_mock( $this, array( 'addUpdateContact' ) );

		$zbs->DAL->contacts->expects( $this->once() )
			->method( 'addUpdateContact' )
			->with(
				$this->equalTo( $contact_data_expected )
			);

		$action_add_contact->execute( $contact_data_expected );
	}

	/**
	 * @testdox Test the add contact action executes the action, within a workflow
	 */
	public function test_add_contact_action_with_workflow() {

		$action_data = array(
			'slug'       => 'jpcrm/new_contact',
			'attributes' => array(
				'id'    => -1,
				'data'  => array(
					'status' => 'lead',
					'name'   => 'Jane Doe',
					'email'  => 'janedoe@example.com',
				),
				'value' => 'Adding contact',
			),
		);

		$automation = new Automation_Engine();
		$automation->register_trigger( Contact_Created_Trigger::class );
		$automation->register_step( 'jpcrm/new_contact', New_Contact::class );

		$workflow_data = $this->automation_faker->workflow_with_condition_customizable_trigger_action( 'jpcrm/contact_created', $action_data );
		$workflow      = new Automation_Workflow( $workflow_data );
		$workflow->set_engine( $automation );

		$automation->add_workflow( $workflow );
		$automation->init_workflows();

		$contact_data_expected = array(
			'id'    => -1,
			'data'  => array(
				'status' => 'lead',
				'name'   => 'Jane Doe',
				'email'  => 'janedoe@example.com',
			),
			'value' => 'Adding contact',
		);

		global $zbs;

		DAL_contact_mock( $this, array( 'addUpdateContact' ) );

		$zbs->DAL->contacts->expects( $this->once() )
			->method( 'addUpdateContact' )
			->with(
				$this->equalTo( $contact_data_expected )
			);

		$event_emitter = Event_Emitter::instance();
		$event_emitter->emit_event( 'contact_created', $contact_data_expected );
	}

	/**
	 * @testdox Test that the 'adding or removing a tag from / to a contact' action executes the action
	 */
	public function test_add_remove_contact_tag_action() {

		$action_data = array(
			'slug'       => 'jpcrm/add_remove_contact_tag',
			'attributes' => array(
				'id'        => 2,
				'tag_input' => array(
					'15',
					'13',
				),
				'mode'      => 'replace',
			),
		);

		$tag_data_expected = array(
			'id'        => 2,
			'tag_input' => array(
				'15',
				'13',
			),
			'mode'      => 'replace',
		);

		$action_add_remove_contact_tag = new Add_Remove_Contact_Tag( $action_data );

		global $zbs;

		DAL_contact_mock( $this, array( 'addUpdateContactTags' ) );

		$zbs->DAL->contacts->expects( $this->once() )
			->method( 'addUpdateContactTags' )
			->with(
				$this->equalTo( $tag_data_expected )
			);

		$action_add_remove_contact_tag->execute( $tag_data_expected );
	}

	/**
	 * @testdox Test that the 'adding or removing a tag from / to a contact' action executes the action, within a workflow
	 */
	public function test_add_remove_contact_tag_action_with_workflow() {

		$action_data = array(
			'slug'       => 'jpcrm/add_remove_contact_tag',
			'attributes' => array(
				'id'        => 2,
				'tag_input' => array(
					'15',
					'13',
				),
				'mode'      => 'replace',
			),
		);

		$automation = new Automation_Engine();

		$automation->register_trigger( Contact_Created_Trigger::class );
		$automation->register_step( 'jpcrm/add_remove_contact_tag', Add_Remove_Contact_Tag::class );

		$workflow_data = $this->automation_faker->workflow_with_condition_customizable_trigger_action( 'jpcrm/contact_created', $action_data );
		$workflow      = new Automation_Workflow( $workflow_data );
		$workflow->set_engine( $automation );

		$automation->add_workflow( $workflow );
		$automation->init_workflows();

		// Fake event data.
		$contact_data = $this->automation_faker->contact_data();

		$tag_data_expected = array(
			'id'        => 2,
			'tag_input' => array(
				'15',
				'13',
			),
			'mode'      => 'replace',
		);

		global $zbs;

		DAL_contact_mock( $this, array( 'addUpdateContactTags' ) );

		$zbs->DAL->contacts->expects( $this->once() )
			->method( 'addUpdateContactTags' )
			->with(
				$this->equalTo( $tag_data_expected )
			);

		$event_emitter = Event_Emitter::instance();
		$event_emitter->emit_event( 'contact_created', $contact_data );
	}

	/**
	 * @testdox Test that the 'adding a log to a contact' action executes the action
	 */
	public function test_add_contact_log_action() {

		$action_data = array(
			'slug'       => 'jpcrm/add_contact_log',
			'attributes' => array(
				'id'         => 2, // Added as expected by the workflow (should match contact ID)
				'objtypeid'  => 1, // Equivalent to ZBS_TYPE_CONTACT
				'objid'      => 2,
				'logid'      => -1,
				'logdate'    => -1,
				'notefields' => array(
					'type'      => 'note',
					'shortdesc' => 'Short description',
					'longdesc'  => 'Long description',
					'pinned'    => -1,
				),
				'owner'      => -1,
			),
		);

		$log_data_expected = array(
			'id'         => 2, // Added as expected by the workflow (should match contact ID)
			'objtypeid'  => 1, // Equivalent to ZBS_TYPE_CONTACT
			'objid'      => 2,
			'logid'      => -1,
			'logdate'    => -1,
			'notefields' => array(
				'type'      => 'note',
				'shortdesc' => 'Short description',
				'longdesc'  => 'Long description',
				'pinned'    => -1,
			),
			'owner'      => -1,
		);

		$action_add_log = new Add_Contact_Log( $action_data );

		global $zbs;

		DAL_contact_mock( $this, array( 'zeroBS_addUpdateObjLog' ) );

		$zbs->DAL->contacts->expects( $this->once() )
			->method( 'zeroBS_addUpdateObjLog' )
			->with(
				$this->equalTo( $log_data_expected )
			);

		$action_add_log->execute( $log_data_expected );
	}

	/**
	 * @testdox Test that the 'adding a log to a contact' action executes the action, within a workflow
	 */
	public function test_add_contact_log_action_with_workflow() {

		$action_data = array(
			'slug'       => 'jpcrm/add_contact_log',
			'attributes' => array(
				'id'         => 2, // Added as expected by the workflow (should match contact ID)
				'objtypeid'  => 1, // Equivalent to ZBS_TYPE_CONTACT
				'objid'      => 2,
				'logid'      => -1,
				'logdate'    => -1,
				'notefields' => array(
					'type'      => 'note',
					'shortdesc' => 'Short description',
					'longdesc'  => 'Long description',
					'pinned'    => -1,
				),
				'owner'      => -1,
			),
		);

		$automation = new Automation_Engine();

		$automation->register_trigger( Contact_Created_Trigger::class );
		$automation->register_step( 'jpcrm/add_contact_log', Add_Contact_Log::class );

		$workflow_data = $this->automation_faker->workflow_with_condition_customizable_trigger_action( 'jpcrm/contact_created', $action_data );
		$workflow      = new Automation_Workflow( $workflow_data );
		$workflow->set_engine( $automation );

		$automation->add_workflow( $workflow );
		$automation->init_workflows();

		// Fake event data.
		$contact_data = $this->automation_faker->contact_data();

		$log_data_expected = array(
			'id'         => 2, // Added as expected by the workflow (should match contact ID)
			'objtypeid'  => 1, // Equivalent to ZBS_TYPE_CONTACT
			'objid'      => 2,
			'logid'      => -1,
			'logdate'    => -1,
			'notefields' => array(
				'type'      => 'note',
				'shortdesc' => 'Short description',
				'longdesc'  => 'Long description',
				'pinned'    => -1,
			),
			'owner'      => -1,
		);

		global $zbs;

		DAL_contact_mock( $this, array( 'zeroBS_addUpdateObjLog' ) );

		$zbs->DAL->contacts->expects( $this->once() )
			->method( 'zeroBS_addUpdateObjLog' )
			->with(
				$this->equalTo( $log_data_expected )
			);

		$event_emitter = Event_Emitter::instance();
		$event_emitter->emit_event( 'contact_created', $contact_data );
	}

	/**
	 * @testdox Test the update contact action executes the action
	 */
	public function test_update_contact_action() {

		$action_data = array(
			'slug'       => 'jpcrm/update_contact',
			'attributes' => array(
				'id'   => 1,
				'data' => array(
					'status' => 'lead',
					'name'   => 'Jane Doe',
					'email'  => 'janedoe@example.com',
					'prefix' => 'Ms',
				),
			),
		);

		$contact_data = $this->automation_faker->contact_data();

		$contact_data_expected = array(
			'id'   => 1,
			'data' => array(
				'status' => 'lead',
				'name'   => 'Jane Doe',
				'email'  => 'janedoe@example.com',
				'prefix' => 'Ms',
			),
		);

		$action_add_log = new Update_Contact( $action_data );

		global $zbs;

		DAL_contact_mock( $this, array( 'addUpdateContact' ) );

		$zbs->DAL->contacts->expects( $this->once() )
			->method( 'addUpdateContact' )
			->with(
				$this->equalTo( $contact_data_expected )
			);

		$action_add_log->execute( $contact_data );
	}

	/**
	 * @testdox Test the update contact action executes the action, within a workflow
	 */
	public function test_update_contact_action_with_workflow() {

		$action_data = array(
			'slug'       => 'jpcrm/update_contact',
			'attributes' => array(
				'id'   => 1,
				'data' => array(
					'status' => 'lead',
					'name'   => 'Jane Doe',
					'email'  => 'janedoe@example.com',
					'prefix' => 'Ms',
				),
			),
		);

		$automation = new Automation_Engine();

		$automation->register_trigger( Contact_Created_Trigger::class );
		$automation->register_step( 'jpcrm/update_contact', Update_Contact::class );

		$workflow_data = $this->automation_faker->workflow_with_condition_customizable_trigger_action( 'jpcrm/contact_created', $action_data );
		$workflow      = new Automation_Workflow( $workflow_data );
		$workflow->set_engine( $automation );

		$automation->add_workflow( $workflow );
		$automation->init_workflows();

		// Fake event data.
		$contact_data = $this->automation_faker->contact_data();

		$contact_data_expected = array(
			'id'   => 1,
			'data' => array(
				'status' => 'lead',
				'name'   => 'Jane Doe',
				'email'  => 'janedoe@example.com',
				'prefix' => 'Ms',
			),
		);

		global $zbs;

		DAL_contact_mock( $this, array( 'addUpdateContact' ) );

		$zbs->DAL->contacts->expects( $this->once() )
			->method( 'addUpdateContact' )
			->with(
				$this->equalTo( $contact_data_expected )
			);

		$event_emitter = Event_Emitter::instance();
		$event_emitter->emit_event( 'contact_created', $contact_data );
	}

}
