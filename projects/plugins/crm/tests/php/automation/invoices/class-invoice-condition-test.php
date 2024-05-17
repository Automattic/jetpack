<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Automation\Tests;

use Automattic\Jetpack\CRM\Automation\Automation_Exception;
use Automattic\Jetpack\CRM\Automation\Conditions\Invoice_Field_Contains;
use Automattic\Jetpack\CRM\Automation\Conditions\Invoice_Status_Changed;
use Automattic\Jetpack\CRM\Automation\Data_Types\Invoice_Data;
use Automattic\Jetpack\CRM\Entities\Invoice;
use Automattic\Jetpack\CRM\Tests\JPCRM_Base_Test_Case;

require_once __DIR__ . '../../tools/class-automation-faker.php';

/**
 * Test Automation Invoice Conditions.
 *
 * @covers Automattic\Jetpack\CRM\Automation\Conditions\Invoice_Status_Changed
 * @covers Automattic\Jetpack\CRM\Automation\Conditions\Invoice_Field_Contains
 */
class Invoice_Condition_Test extends JPCRM_Base_Test_Case {

	private $automation_faker;

	public function setUp(): void {
		parent::setUp();
		$this->automation_faker = Automation_Faker::instance();
		$this->automation_faker->reset_all();
	}

	private function get_invoice_status_changed_condition( $operator, $expected_value ) {
		$condition_data = array(
			'slug'       => 'jpcrm/condition/invoice_status_changed',
			'attributes' => array(
				'field'    => 'status',
				'operator' => $operator,
				'value'    => $expected_value,
			),
		);

		return new Invoice_Status_Changed( $condition_data );
	}

	private function get_invoice_field_contains_condition( $field, $operator, $expected_value ) {
		$condition_data = array(
			'slug'       => 'jpcrm/condition/invoice_field_contains',
			'attributes' => array(
				'field'    => $field,
				'operator' => $operator,
				'value'    => $expected_value,
			),
		);

		return new Invoice_Field_Contains( $condition_data );
	}

	/**
	 * @testdox Test the update invoice status condition for the is operator.
	 */
	public function test_status_changed_is_operator() {
		$invoice_status_changed_condition = $this->get_invoice_status_changed_condition( 'is', 'paid' );

		/** @var Invoice $invoice */
		$invoice      = $this->automation_faker->invoice();
		$invoice_data = new Invoice_Data( $invoice );

		// Testing when the condition has been met.
		$invoice->status = 'paid';
		$invoice_status_changed_condition->validate_and_execute( $invoice_data );
		$this->assertTrue( $invoice_status_changed_condition->condition_met() );

		// Testing when the condition has not been met.
		$invoice->status = 'unpaid';
		$invoice_status_changed_condition->validate_and_execute( $invoice_data );
		$this->assertFalse( $invoice_status_changed_condition->condition_met() );
	}

	/**
	 * @testdox Test the update invoice status condition for the is_not operator.
	 */
	public function test_status_changed_is_not_operator() {
		$invoice_status_changed_condition = $this->get_invoice_status_changed_condition( 'is_not', 'paid' );

		/** @var Invoice $invoice */
		$invoice      = $this->automation_faker->invoice();
		$invoice_data = new Invoice_Data( $invoice );

		// Testing when the condition has been met.
		$invoice->status = 'unpaid';
		$invoice_status_changed_condition->validate_and_execute( $invoice_data );
		$this->assertTrue( $invoice_status_changed_condition->condition_met() );

		// Testing when the condition has not been met.
		$invoice->status = 'paid';
		$invoice_status_changed_condition->validate_and_execute( $invoice_data );
		$this->assertFalse( $invoice_status_changed_condition->condition_met() );
	}

	/**
	 * @testdox Test if an exception is being correctly thrown for wrong operators.
	 */
	public function test_status_changed_invalid_operator_throws_exception() {
		$invoice_status_changed_condition = $this->get_invoice_status_changed_condition( 'wrong_operator', 'paid' );

		/** @var Invoice $invoice */
		$invoice      = $this->automation_faker->invoice();
		$invoice_data = new Invoice_Data( $invoice );

		$this->expectException( Automation_Exception::class );
		$this->expectExceptionCode( Automation_Exception::CONDITION_INVALID_OPERATOR );

		$invoice_status_changed_condition->validate_and_execute( $invoice_data );
	}

	/**
	 * @testdox Test the update invoice field contains condition for the contains operator.
	 */
	public function test_field_contains_contains_operator() {
		$invoice_field_contains_condition = $this->get_invoice_field_contains_condition( 'status', 'contains', 'ai' );

		/** @var Invoice $invoice */
		$invoice      = $this->automation_faker->invoice();
		$invoice_data = new Invoice_Data( $invoice );

		// Testing when the condition has been met.
		$invoice->status = 'paid';
		$invoice_field_contains_condition->validate_and_execute( $invoice_data );
		$this->assertTrue( $invoice_field_contains_condition->condition_met() );

		// Testing when the condition has not been met.
		$invoice->status = 'draft';
		$invoice_field_contains_condition->validate_and_execute( $invoice_data );
		$this->assertFalse( $invoice_field_contains_condition->condition_met() );
	}

	/**
	 * @testdox Test the update invoice field contains condition for the does_not_contain operator.
	 */
	public function test_field_contains_does_not_contain_operator() {
		$invoice_field_contains_condition = $this->get_invoice_field_contains_condition( 'status', 'does_not_contain', 'ai' );

		/** @var Invoice $invoice */
		$invoice      = $this->automation_faker->invoice();
		$invoice_data = new Invoice_Data( $invoice );

		// Testing when the condition has been met.
		$invoice->status = 'draft';
		$invoice_field_contains_condition->validate_and_execute( $invoice_data );
		$this->assertTrue( $invoice_field_contains_condition->condition_met() );

		// Testing when the condition has not been met.
		$invoice->status = 'paid';
		$invoice_field_contains_condition->validate_and_execute( $invoice_data );
		$this->assertFalse( $invoice_field_contains_condition->condition_met() );
	}

	/**
	 * @testdox Test if an exception is being correctly thrown for wrong operators.
	 */
	public function test_field_contains_invalid_operator_throws_exception() {
		$invoice_field_contains_condition = $this->get_invoice_field_contains_condition( 'status', 'wrong_operator', 'paid' );

		/** @var Invoice $invoice */
		$invoice      = $this->automation_faker->invoice();
		$invoice_data = new Invoice_Data( $invoice );

		$this->expectException( Automation_Exception::class );
		$this->expectExceptionCode( Automation_Exception::CONDITION_INVALID_OPERATOR );

		$invoice_field_contains_condition->validate_and_execute( $invoice_data );
	}
}
