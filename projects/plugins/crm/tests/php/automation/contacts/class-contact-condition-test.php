<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Automation\Tests;

use Automattic\Jetpack\CRM\Automation\Automation_Exception;
use Automattic\Jetpack\CRM\Automation\Conditions\Contact_Field_Changed;
use Automattic\Jetpack\CRM\Automation\Conditions\Contact_Tag;
use Automattic\Jetpack\CRM\Automation\Conditions\Contact_Transitional_Status;
use Automattic\Jetpack\CRM\Automation\Data_Types\Contact_Data;
use Automattic\Jetpack\CRM\Entities\Contact;
use Automattic\Jetpack\CRM\Tests\JPCRM_Base_Test_Case;

require_once __DIR__ . '../../tools/class-automation-faker.php';

/**
 * Test Automation Workflow functionalities
 *
 * @covers Automattic\Jetpack\CRM\Automation\Conditions\Contact_Field_Changed
 * @covers Automattic\Jetpack\CRM\Automation\Conditions\Contact_Transitional_Status
 * @covers Automattic\Jetpack\CRM\Automation\Conditions\Contact_Tag
 */
class Contact_Condition_Test extends JPCRM_Base_Test_Case {

	private $automation_faker;

	public function setUp(): void {
		parent::setUp();
		$this->automation_faker = Automation_Faker::instance();
		$this->automation_faker->reset_all();
	}

	private function get_contact_field_changed_condition( $operator, $expected_value ) {
		$condition_data = array(
			'slug'       => 'jpcrm/condition/contact_field_changed',
			'attributes' => array(
				'field'    => 'status',
				'operator' => $operator,
				'value'    => $expected_value,
			),
		);

		return new Contact_Field_Changed( $condition_data );
	}

	private function get_contact_transitional_status_condition( $operator, $from_status, $to_status ) {
		$condition_data = array(
			'slug'       => 'jpcrm/condition/contact_status_transitional',
			'attributes' => array(
				'operator'            => $operator,
				'previous_status_was' => $from_status,
				'new_status_is'       => $to_status,
			),
		);

		return new Contact_Transitional_Status( $condition_data );
	}

	private function get_contact_tag_condition( $operator, $tag ) {
		$condition_data = array(
			'slug'       => 'jpcrm/condition/contact_tag',
			'attributes' => array(
				'operator' => $operator,
				'tag'      => $tag,
			),
		);

		return new Contact_Tag( $condition_data );
	}

	/**
	 * @testdox Test the update contact field condition for the is operator.
	 */
	public function test_field_changed_is_operator() {
		$contact_field_changed_condition = $this->get_contact_field_changed_condition( 'is', 'customer' );

		/** @var Contact $contact */
		$contact = $this->automation_faker->contact();

		// Any update on $contact instance will be reflected on $contact_data.
		$contact_data = new Contact_Data( $contact );

		// Testing when the condition has been met.
		$contact->status = 'customer';
		$contact_field_changed_condition->validate_and_execute( $contact_data );
		$this->assertTrue( $contact_field_changed_condition->condition_met() );

		// Testing when the condition has not been met.
		$contact->status = 'lead';
		$contact_field_changed_condition->validate_and_execute( $contact_data );
		$this->assertFalse( $contact_field_changed_condition->condition_met() );
	}

	/**
	 * @testdox Test the update contact field condition for the is_not operator.
	 */
	public function test_field_changed_is_not_operator() {
		$contact_field_changed_condition = $this->get_contact_field_changed_condition( 'is_not', 'customer' );

		/** @var Contact $contact */
		$contact = $this->automation_faker->contact();

		$contact_data = new Contact_Data( $contact );

		// Testing when the condition has been met.
		$contact->status = 'lead';
		$contact_field_changed_condition->validate_and_execute( $contact_data );
		$this->assertTrue( $contact_field_changed_condition->condition_met() );

		// Testing when the condition has not been met.
		$contact->status = 'customer';
		$contact_field_changed_condition->validate_and_execute( $contact_data );
		$this->assertFalse( $contact_field_changed_condition->condition_met() );
	}

	/**
	 * @testdox Test if an exception is being correctly thrown for wrong operators.
	 */
	public function test_field_changed_invalid_operator_throws_exception() {
		$contact_field_changed_condition = $this->get_contact_field_changed_condition( 'wrong_operator', 'customer' );

		/** @var Contact $contact */
		$contact = $this->automation_faker->contact();

		$this->expectException( Automation_Exception::class );
		$this->expectExceptionCode( Automation_Exception::CONDITION_INVALID_OPERATOR );

		$contact_field_changed_condition->validate_and_execute( new Contact_Data( $contact ) );
	}

	/**
	 * @testdox Test if an exception is being correctly thrown for wrong operators for transitional status.
	 */
	public function test_transitional_status_invalid_operator_throws_exception() {
		$contact_transitional_status_condition = $this->get_contact_transitional_status_condition( 'wrong_operator', 'old_status', 'new_status' );

		$this->expectException( Automation_Exception::class );
		$this->expectExceptionCode( Automation_Exception::CONDITION_INVALID_OPERATOR );

		/** @var Contact $contact */
		$contact = $this->automation_faker->contact();

		$previous_contact         = clone $contact;
		$previous_contact->status = 'old_status';

		$contact_data = new Contact_Data( $contact, $previous_contact );

		$contact_transitional_status_condition->validate_and_execute( $contact_data );
	}

	/**
	 * @testdox Test if transitional status correctly detects the correct statuses.
	 */
	public function test_transitional_status() {
		$contact_transitional_status_condition = $this->get_contact_transitional_status_condition( 'from_to', 'old_status', 'new_status' );

		/** @var Contact $contact */
		$contact = $this->automation_faker->contact();

		// Create a previous state of a contact.
		$previous_contact = clone $contact;

		$contact_data = new Contact_Data( $contact, $previous_contact );

		// Testing when the condition has been met.
		$contact->status          = 'new_status';
		$previous_contact->status = 'old_status';

		$contact_transitional_status_condition->validate_and_execute( $contact_data );
		$this->assertTrue( $contact_transitional_status_condition->condition_met() );

		// Testing when the condition has been not been met for the to field.
		$contact->status = 'wrong_to';
		$contact_transitional_status_condition->validate_and_execute( $contact_data );
		$this->assertFalse( $contact_transitional_status_condition->condition_met() );

		// Testing when the condition has been not been met for the from field
		$contact->status          = 'new_status';
		$previous_contact->status = 'wrong_from';
		$contact_transitional_status_condition->validate_and_execute( $contact_data );
		$this->assertFalse( $contact_transitional_status_condition->condition_met() );
	}

	/**
	 * @testdox Test contact tag added condition.
	 */
	public function test_contact_tag_added() {
		$contact_tag_condition = $this->get_contact_tag_condition( 'tag_added', 'Tag Added' );

		/** @var Contact $contact */
		$contact = $this->automation_faker->contact();

		// Create a previous state of a contact.
		$previous_contact = clone $contact;

		$contact_data = new Contact_Data( $contact, $previous_contact );

		// Generate the next tag id.
		$tag_id = end( $contact->tags )['id'] + 1;

		// Testing when the condition has been not been met because the contact does not have said tag.
		$contact_tag_condition->validate_and_execute( $contact_data );
		$this->assertFalse( $contact_tag_condition->condition_met() );

		// Testing when the condition has been met.
		$contact->tags[] = array(
			'id'          => $tag_id,
			'objtype'     => ZBS_TYPE_CONTACT,
			'name'        => 'Tag Added',
			'slug'        => 'tag-added',
			'created'     => 1692663412,
			'lastupdated' => 1692663412,
		);
		$contact_tag_condition->validate_and_execute( $contact_data );
		$this->assertTrue( $contact_tag_condition->condition_met() );

		// Testing when the condition has been not been met because the previous contact already had said tag.
		$previous_contact->tags[] = array(
			'id'          => $tag_id,
			'objtype'     => ZBS_TYPE_CONTACT,
			'name'        => 'Tag Added',
			'slug'        => 'tag-added',
			'created'     => 1692663412,
			'lastupdated' => 1692663412,
		);

		$contact_tag_condition->validate_and_execute( $contact_data );
		$this->assertFalse( $contact_tag_condition->condition_met() );
	}

	/**
	 * @testdox Test contact tag removed condition.
	 */
	public function test_contact_tag_removed() {
		$contact_tag_condition = $this->get_contact_tag_condition( 'tag_removed', 'Tag to be removed' );

		/** @var Contact $contact */
		$contact          = $this->automation_faker->contact();
		$previous_contact = clone $contact;

		$contact_data = new Contact_Data( $contact, $previous_contact );

		$tag_id = end( $contact->tags )['id'] + 1;

		// Testing when the condition has been not been met because the previous contact does not have said tag.
		$contact_tag_condition->validate_and_execute( $contact_data );
		$this->assertFalse( $contact_tag_condition->condition_met() );

		// Testing when the condition has been met.
		$previous_contact->tags[] = array(
			'id'          => $tag_id,
			'objtype'     => ZBS_TYPE_CONTACT,
			'name'        => 'Tag to be removed',
			'slug'        => 'tag-to-be-removed',
			'created'     => 1692663412,
			'lastupdated' => 1692663412,
		);
		$contact_tag_condition->validate_and_execute( $contact_data );
		$this->assertTrue( $contact_tag_condition->condition_met() );

		// Testing when the condition has been not been met because the current contact still has said tag.
		$contact->tags[] = array(
			'id'          => $tag_id,
			'objtype'     => ZBS_TYPE_CONTACT,
			'name'        => 'Tag to be removed',
			'slug'        => 'tag-to-be-removed',
			'created'     => 1692663412,
			'lastupdated' => 1692663412,
		);
		$contact_tag_condition->validate_and_execute( $contact_data );
		$this->assertFalse( $contact_tag_condition->condition_met() );
	}

	/**
	 * @testdox Test contact has tag condition.
	 */
	public function test_contact_has_tag() {
		$contact_tag_condition = $this->get_contact_tag_condition( 'has_tag', 'Some Tag' );

		/** @var Contact $contact */
		$contact          = $this->automation_faker->contact();
		$previous_contact = clone $contact;

		$contact_data = new Contact_Data( $contact, $previous_contact );

		// Generate the next tag id.
		$tag_id = end( $contact->tags )['id'] + 1;

		// Testing when the condition has been not been met because the contact does not have said tag.
		$contact_tag_condition->validate_and_execute( $contact_data );
		$this->assertFalse( $contact_tag_condition->condition_met() );

		// Testing when the condition has been met.
		$contact->tags[] = array(
			'id'          => $tag_id,
			'objtype'     => ZBS_TYPE_CONTACT,
			'name'        => 'Some Tag',
			'slug'        => 'some-tag',
			'created'     => 1692663412,
			'lastupdated' => 1692663412,
		);
		$contact_tag_condition->validate_and_execute( $contact_data );

		$this->assertTrue( $contact_tag_condition->condition_met() );
	}
}
