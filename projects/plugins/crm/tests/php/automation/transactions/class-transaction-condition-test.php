<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Automation\Tests;

use Automattic\Jetpack\CRM\Automation\Automation_Exception;
use Automattic\Jetpack\CRM\Automation\Conditions\Transaction_Field;
use Automattic\Jetpack\CRM\Automation\Data_Types\Transaction_Data;
use Automattic\Jetpack\CRM\Entities\Transaction;
use Automattic\Jetpack\CRM\Tests\JPCRM_Base_Test_Case;

require_once __DIR__ . '../../tools/class-automation-faker.php';

/**
 * Test Automation Transaction Condition functionalities
 *
 * @covers Automattic\Jetpack\CRM\Automation
 */
class Transaction_Condition_Test extends JPCRM_Base_Test_Case {

	private $automation_faker;

	public function setUp(): void {
		parent::setUp();
		$this->automation_faker = Automation_Faker::instance();
		$this->automation_faker->reset_all();
	}

	private function get_transaction_field_condition( $operator, $expected_value ) {
		$condition_data = array(
			'slug'       => 'jpcrm/condition/transaction_field',
			'attributes' => array(
				'field'    => 'status',
				'operator' => $operator,
				'value'    => $expected_value,
			),
		);

		return new Transaction_Field( $condition_data );
	}

	/**
	 * @testdox Test the update transaction field condition for the is operator.
	 */
	public function test_field_changed_is_operator() {
		$transaction_field_changed_condition = $this->get_transaction_field_condition( 'is', 'paid' );

		/** @var Transaction $transaction */
		$transaction      = $this->automation_faker->transaction();
		$transaction_data = new Transaction_Data( $transaction );

		// Testing when the condition has been met.
		$transaction->status = 'paid';
		$transaction_field_changed_condition->validate_and_execute( $transaction_data );
		$this->assertTrue( $transaction_field_changed_condition->condition_met() );

		// Testing when the condition has not been met.
		$transaction->status = 'draft';
		$transaction_field_changed_condition->validate_and_execute( $transaction_data );
		$this->assertFalse( $transaction_field_changed_condition->condition_met() );
	}

	/**
	 * @testdox Test the update transaction field condition for the is_not operator.
	 */
	public function test_field_changed_is_not_operator() {
		$transaction_field_changed_condition = $this->get_transaction_field_condition( 'is_not', 'paid' );

		/** @var Transaction $transaction */
		$transaction      = $this->automation_faker->transaction();
		$transaction_data = new Transaction_Data( $transaction );

		// Testing when the condition has been met.
		$transaction->status = 'draft';
		$transaction_field_changed_condition->validate_and_execute( $transaction_data );
		$this->assertTrue( $transaction_field_changed_condition->condition_met() );

		// Testing when the condition has not been met.
		$transaction->status = 'paid';
		$transaction_field_changed_condition->validate_and_execute( $transaction_data );
		$this->assertFalse( $transaction_field_changed_condition->condition_met() );
	}

	/**
	 * @testdox Test the update transaction field condition for the contains operator.
	 */
	public function test_field_changed_contains_operator() {
		$transaction_field_changed_condition = $this->get_transaction_field_condition( 'contains', 'ai' );

		/** @var Transaction $transaction */
		$transaction      = $this->automation_faker->transaction();
		$transaction_data = new Transaction_Data( $transaction );

		// Testing when the condition has been met.
		$transaction->status = 'paid';
		$transaction_field_changed_condition->validate_and_execute( $transaction_data );
		$this->assertTrue( $transaction_field_changed_condition->condition_met() );

		// Testing when the condition has not been met.
		$transaction->status = 'draft';
		$transaction_field_changed_condition->validate_and_execute( $transaction_data );
		$this->assertFalse( $transaction_field_changed_condition->condition_met() );
	}

	/**
	 * @testdox Test the update transaction field condition for the does_not_contain operator.
	 */
	public function test_field_changed_does_not_contain_operator() {
		$transaction_field_changed_condition = $this->get_transaction_field_condition( 'does_not_contain', 'ai' );

		/** @var Transaction $transaction */
		$transaction      = $this->automation_faker->transaction();
		$transaction_data = new Transaction_Data( $transaction );

		// Testing when the condition has been met.
		$transaction->status = 'draft';
		$transaction_field_changed_condition->validate_and_execute( $transaction_data );
		$this->assertTrue( $transaction_field_changed_condition->condition_met() );

		// Testing when the condition has not been met.
		$transaction->status = 'paid';
		$transaction_field_changed_condition->validate_and_execute( $transaction_data );
		$this->assertFalse( $transaction_field_changed_condition->condition_met() );
	}

	/**
	 * @testdox Test if an exception is being correctly thrown for wrong operators.
	 */
	public function test_field_changed_invalid_operator_throws_exception() {
		$transaction_field_changed_condition = $this->get_transaction_field_condition( 'wrong_operator', 'paid' );

		/** @var Transaction $transaction */
		$transaction      = $this->automation_faker->transaction();
		$transaction_data = new Transaction_Data( $transaction );

		$this->expectException( Automation_Exception::class );
		$this->expectExceptionCode( Automation_Exception::CONDITION_INVALID_OPERATOR );

		$transaction_field_changed_condition->validate_and_execute( $transaction_data );
	}
}
