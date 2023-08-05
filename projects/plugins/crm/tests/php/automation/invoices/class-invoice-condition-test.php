<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Automation\Tests;

use Automattic\Jetpack\CRM\Automation\Automation_Exception;
use Automattic\Jetpack\CRM\Automation\Conditions\Invoice_Status_Changed;
use WorDBless\BaseTestCase;

require_once __DIR__ . '../../tools/class-automation-faker.php';

/**
 * Test Automation Invoice Conditions.
 *
 * @covers Automattic\Jetpack\CRM\Automation\Conditions\Invoice_Status_Changed
 */
class Invoice_Condition_Test extends BaseTestCase {

	private $automation_faker;

	public function setUp(): void {
		parent::setUp();
		$this->automation_faker = Automation_Faker::instance( $this );
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

	/**
	 * @testdox Test the update invoice status condition for the is operator.
	 */
	public function test_status_changed_is_operator() {
		$invoice_status_changed_condition = $this->get_invoice_status_changed_condition( 'is', 'paid' );
		$invoice_data                     = $this->automation_faker->invoice_data();

		// Testing when the condition has been met.
		$invoice_data['data']['status'] = 'paid';
		$invoice_status_changed_condition->execute( $invoice_data );
		$this->assertTrue( $invoice_status_changed_condition->condition_met() );

		// Testing when the condition has not been met.
		$invoice_data['data']['status'] = 'unpaid';
		$invoice_status_changed_condition->execute( $invoice_data );
		$this->assertFalse( $invoice_status_changed_condition->condition_met() );
	}

	/**
	 * @testdox Test the update invoice status condition for the is_not operator.
	 */
	public function test_status_changed_is_not_operator() {
		$invoice_status_changed_condition = $this->get_invoice_status_changed_condition( 'is_not', 'paid' );
		$invoice_data                     = $this->automation_faker->invoice_data();

		// Testing when the condition has been met.
		$invoice_data['data']['status'] = 'unpaid';
		$invoice_status_changed_condition->execute( $invoice_data );
		$this->assertTrue( $invoice_status_changed_condition->condition_met() );

		// Testing when the condition has not been met.
		$invoice_data['data']['status'] = 'paid';
		$invoice_status_changed_condition->execute( $invoice_data );
		$this->assertFalse( $invoice_status_changed_condition->condition_met() );
	}

	/**
	 * @testdox Test if an exception is being correctly thrown for wrong operators.
	 */
	public function test_status_changed_invalid_operator_throws_exception() {
		$invoice_status_changed_condition = $this->get_invoice_status_changed_condition( 'wrong_operator', 'paid' );
		$invoice_data                     = $this->automation_faker->invoice_data();

		$this->expectException( Automation_Exception::class );
		$this->expectExceptionMessage( 'Invalid operator: wrong_operator' );

		$invoice_status_changed_condition->execute( $invoice_data );
	}

}
