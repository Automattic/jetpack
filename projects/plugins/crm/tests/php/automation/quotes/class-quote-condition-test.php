<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Automation\Tests;

use Automattic\Jetpack\CRM\Automation\Automation_Exception;
use Automattic\Jetpack\CRM\Automation\Conditions\Quote_Status_Changed;
use WorDBless\BaseTestCase;

require_once __DIR__ . '../../tools/class-automation-faker.php';

/**
 * Test Automation Quote Conditions.
 *
 * @covers Automattic\Jetpack\CRM\Automation\Conditions\Quote_Status_Changed
 */
class Quote_Condition_Test extends BaseTestCase {

	private $automation_faker;

	public function setUp(): void {
		parent::setUp();
		$this->automation_faker = Automation_Faker::instance();
		$this->automation_faker->reset_all();
	}

	private function get_quote_status_changed_condition( $operator, $expected_value ) {
		$condition_data = array(
			'slug'       => 'jpcrm/condition/quote_status_changed',
			'attributes' => array(
				'operator' => $operator,
				'value'    => $expected_value,
			),
		);
		return new Quote_Status_Changed( $condition_data );
	}

	/**
	 * @testdox Test the update quote status condition for the is operator.
	 */
	public function test_status_changed_is_operator() {
		$quote_status_changed_condition = $this->get_quote_status_changed_condition( 'is', 'accepted' );
		$quote_data                     = $this->automation_faker->quote_data();

		// Testing when the condition has been met.
		$quote_data['data']['accepted'] = '1';
		$quote_data['data']['template'] = '1';
		$quote_status_changed_condition->execute( $quote_data );
		$this->assertTrue( $quote_status_changed_condition->condition_met() );

		// Testing when the condition has not been met.
		$quote_data['data']['accepted'] = '0';
		$quote_data['data']['template'] = '0';
		$quote_status_changed_condition->execute( $quote_data );
		$this->assertFalse( $quote_status_changed_condition->condition_met() );
	}

	/**
	 * @testdox Test the update quote status condition for the is_not operator.
	 */
	public function test_status_changed_is_not_operator() {
		$quote_status_changed_condition = $this->get_quote_status_changed_condition( 'is_not', 'accepted' );
		$quote_data                     = $this->automation_faker->quote_data();

		// Testing when the condition has been met.
		$quote_data['data']['accepted'] = '0';
		$quote_data['data']['template'] = '0';
		$quote_status_changed_condition->execute( $quote_data );
		$this->assertTrue( $quote_status_changed_condition->condition_met() );

		// Testing when the condition has not been met.
		$quote_data['data']['accepted'] = '1';
		$quote_data['data']['template'] = '1';
		$quote_status_changed_condition->execute( $quote_data );
		$this->assertFalse( $quote_status_changed_condition->condition_met() );
	}

	/**
	 * @testdox Test if an exception is being correctly thrown for wrong operators.
	 */
	public function test_status_changed_invalid_operator_throws_exception() {
		$quote_status_changed_condition = $this->get_quote_status_changed_condition( 'wrong_operator', 'draft' );
		$quote_data                     = $this->automation_faker->quote_data();

		$this->expectException( Automation_Exception::class );
		$this->expectExceptionCode( Automation_Exception::CONDITION_INVALID_OPERATOR );

		$quote_status_changed_condition->execute( $quote_data );
	}

}
