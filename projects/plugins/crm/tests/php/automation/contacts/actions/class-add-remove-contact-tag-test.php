<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Automation\Tests;

use Automattic\Jetpack\CRM\Automation\Actions\Add_Remove_Contact_Tag;
use Automattic\Jetpack\CRM\Automation\Automation_Engine;
use Automattic\Jetpack\CRM\Automation\Automation_Workflow;
use Automattic\Jetpack\CRM\Automation\Conditions\Contact_Field_Changed;
use Automattic\Jetpack\CRM\Automation\Data_Types\Contact_Data;
use Automattic\Jetpack\CRM\Automation\Triggers\Contact_Created;
use Automattic\Jetpack\CRM\Tests\JPCRM_Base_Integration_Test_Case;

/**
 * Test Automation Workflow functionalities
 *
 * @covers Automattic\Jetpack\CRM\Automation\Actions\Add_Remove_Contact_Tag
 */
class Add_Remove_Contact_Tag_Test extends JPCRM_Base_Integration_Test_Case {

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
	 * @testdox Test that the 'adding or removing a tag from / to a contact' action executes the action.
	 */
	public function test_add_remove_contact_tag_action() {
		global $zbs;

		// Create a contact and tag.
		$contact_id = $this->add_contact();
		$contact    = $this->get_contact( $contact_id );

		$tag_id = $zbs->DAL->addUpdateTag(
			array(
				'data' => array(
					'objtype' => ZBS_TYPE_CONTACT,
					'name'    => 'Test tag',
				),
			)
		);

		// Setup action that is supposed to add our new tag to the contact.
		$action_add_remove_contact_tag = new Add_Remove_Contact_Tag(
			array(
				'slug'       => Add_Remove_Contact_Tag::get_slug(),
				'attributes' => array(
					'mode'      => 'replace',
					'tag_input' => array(
						$tag_id,
					),
				),
			)
		);

		$contact_data = new Contact_Data( $contact );

		// Execute the action.
		$action_add_remove_contact_tag->validate_and_execute( $contact_data );

		// Verify that our contact has the tag.
		$contact = $zbs->DAL->contacts->getContact( $contact_id, array( 'withTags' => true ) );
		$this->assertSame( 'Test tag', $contact['tags'][0]['name'] );
	}

	/**
	 * @testdox Test that adding or removing a tag action executes the action, within a workflow.
	 */
	public function test_add_remove_contact_tag_action_with_workflow() {
		global $zbs;

		// Register dependencies.
		$automation = new Automation_Engine();
		$automation->register_trigger( Contact_Created::class );
		$automation->register_step( Contact_Field_Changed::class );
		$automation->register_step( Add_Remove_Contact_Tag::class );

		// Create a tag for our workflow.
		$tag_id = $zbs->DAL->addUpdateTag(
			array(
				'data' => array(
					'objtype' => ZBS_TYPE_COMPANY,
					'name'    => 'Test tag',
				),
			)
		);

		// Create a workflow that adds the tag to newly created contacts.
		$workflow_data = $this->automation_faker->workflow_with_condition_customizable_trigger_action(
			Contact_Created::get_slug(),
			array(
				'slug'           => Add_Remove_Contact_Tag::get_slug(),
				'attributes'     => array(
					'mode'      => 'replace',
					'tag_input' => array(
						$tag_id,
					),
				),
				'next_step_true' => null,
			)
		);

		$workflow = new Automation_Workflow( $workflow_data );
		$workflow->set_engine( $automation );
		$automation->add_workflow( $workflow );
		$automation->init_workflows();

		// Create a new contact to trigger the workflow.
		$contact_id = $this->add_contact();

		// Verify that our contact has the tag.
		$contact = $zbs->DAL->contacts->getContact( $contact_id, array( 'withTags' => true ) );
		$this->assertSame( 'Test tag', $contact['tags'][0]['name'] );
	}
}
