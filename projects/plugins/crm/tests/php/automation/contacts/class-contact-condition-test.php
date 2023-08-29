<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Automation\Tests;

use Automattic\Jetpack\CRM\Automation\Automation_Exception;
use Automattic\Jetpack\CRM\Automation\Conditions\Contact_Field_Changed;
use Automattic\Jetpack\CRM\Automation\Conditions\Contact_Transitional_Status;
use Automattic\Jetpack\CRM\Tests\JPCRM_Base_Test_Case;

require_once __DIR__ . '../../tools/class-automation-faker.php';

/**
 * Test Automation Workflow functionalities
 *
 * @covers Automattic\Jetpack\CRM\Automation\Conditions\Contact_Field_Changed
 * @covers Automattic\Jetpack\CRM\Automation\Conditions\Contact_Transitional_Status
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

	/**
	 * @testdox Test the update contact field condition for the is operator.
	 */
	public function test_field_changed_is_operator() {
		$contact_field_changed_condition = $this->get_contact_field_changed_condition( 'is', 'customer' );
		$contact_data_type               = $this->automation_faker->contact_data( true );
		$contact_data                    = $contact_data_type->get_entity();

		// Testing when the condition has been met.
		$contact_data['status'] = 'customer';
		$contact_field_changed_condition->execute( $contact_data );
		$this->assertTrue( $contact_field_changed_condition->condition_met() );

		// Testing when the condition has not been met.
		$contact_data['status'] = 'lead';
		$contact_field_changed_condition->execute( $contact_data );
		$this->assertFalse( $contact_field_changed_condition->condition_met() );
	}

	/**
	 * @testdox Test the update contact field condition for the is_not operator.
	 */
	public function test_field_changed_is_not_operator() {
		$contact_field_changed_condition = $this->get_contact_field_changed_condition( 'is_not', 'customer' );
		$contact_data_type               = $this->automation_faker->contact_data( true );
		$contact_data                    = $contact_data_type->get_entity();

		// Testing when the condition has been met.
		$contact_data['status'] = 'lead';
		$contact_field_changed_condition->execute( $contact_data );
		$this->assertTrue( $contact_field_changed_condition->condition_met() );

		// Testing when the condition has not been met.
		$contact_data['status'] = 'customer';
		$contact_field_changed_condition->execute( $contact_data );
		$this->assertFalse( $contact_field_changed_condition->condition_met() );
	}

	/**
	 * @testdox Test if an exception is being correctly thrown for wrong operators.
	 */
	public function test_field_changed_invalid_operator_throws_exception() {
		$contact_field_changed_condition = $this->get_contact_field_changed_condition( 'wrong_operator', 'customer' );
		$contact_data_type               = $this->automation_faker->contact_data( true );

		$this->expectException( Automation_Exception::class );
		$this->expectExceptionCode( Automation_Exception::CONDITION_INVALID_OPERATOR );

		$contact_field_changed_condition->execute( $contact_data_type->get_entity() );
	}

	/**
	 * @testdox Test if an exception is being correctly thrown for wrong operators for transitional status.
	 */
	public function test_transitional_status_invalid_operator_throws_exception() {
		$contact_transitional_status_condition = $this->get_contact_transitional_status_condition( 'wrong_operator', 'old_status', 'new_status' );

		$this->expectException( Automation_Exception::class );
		$this->expectExceptionCode( Automation_Exception::CONDITION_INVALID_OPERATOR );

		$contact_data_type               = $this->automation_faker->contact_data( true );
		$contact_data                    = $contact_data_type->get_entity();
		$previous_contact_data           = $contact_data;
		$previous_contact_data['status'] = 'old_status';

		$contact_transitional_status_condition->execute( $contact_data, $previous_contact_data );
	}

	/**
	 * @testdox Test if transitional status correctly detects the correct statuses.
	 */
	public function test_transitional_status() {
		$contact_transitional_status_condition = $this->get_contact_transitional_status_condition( 'from_to', 'old_status', 'new_status' );
		$contact_data_type                     = $this->automation_faker->contact_data( true );
		$contact_data                          = $contact_data_type->get_entity();

		// Create a previous state of a contact.
		$previous_contact           = $contact_data;
		$previous_contact['status'] = 'old_status';

		// Testing when the condition has been met.
		$contact_data['status'] = 'new_status';
		$contact_transitional_status_condition->execute( $contact_data, $previous_contact );
		$this->assertTrue( $contact_transitional_status_condition->condition_met() );

		// Testing when the condition has been not been met for the to field.
		$contact_data['status'] = 'wrong_to';
		$contact_transitional_status_condition->execute( $contact_data, $previous_contact );
		$this->assertFalse( $contact_transitional_status_condition->condition_met() );

		// Testing when the condition has been not been met for the from field
		$contact_data['status']     = 'new_status';
		$previous_contact['status'] = 'wrong_from';
		$contact_transitional_status_condition->execute( $contact_data, $previous_contact );
		$this->assertFalse( $contact_transitional_status_condition->condition_met() );
	}

}
