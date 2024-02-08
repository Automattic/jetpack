<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Automation\Tests;

use Automattic\Jetpack\CRM\Automation\Automation_Engine;
use Automattic\Jetpack\CRM\Automation\Automation_Workflow;
use Automattic\Jetpack\CRM\Automation\Data_Types\Transaction_Data;
use Automattic\Jetpack\CRM\Automation\Triggers\Transaction_Created;
use Automattic\Jetpack\CRM\Automation\Triggers\Transaction_Updated;
use Automattic\Jetpack\CRM\Entities\Transaction;
use Automattic\Jetpack\CRM\Tests\JPCRM_Base_Test_Case;

require_once __DIR__ . '../../tools/class-automation-faker.php';

/**
 * Test Automation's transaction triggers
 *
 * @covers Automattic\Jetpack\CRM\Automation\Triggers\Transaction_Updated
 * @covers Automattic\Jetpack\CRM\Automation\Triggers\Transaction_Created
 */
class Transaction_Trigger_Test extends JPCRM_Base_Test_Case {

	private $automation_faker;

	public function setUp(): void {
		parent::setUp();
		$this->automation_faker = Automation_Faker::instance();
	}

	/**
	 * @testdox Test the transaction created trigger executes the workflow with an action
	 */
	public function test_transaction_created_trigger() {
		$workflow_data = $this->automation_faker->workflow_without_initial_step_customize_trigger( 'jpcrm/transaction_created' );

		// Build a PHPUnit mock Automation_Workflow
		$workflow = $this->getMockBuilder( Automation_Workflow::class )
			->setConstructorArgs( array( $workflow_data, new Automation_Engine() ) )
			->onlyMethods( array( 'execute' ) )
			->getMock();

		// Init the Transaction_Created trigger.
		$trigger = new Transaction_Created();
		$trigger->init( $workflow );

		/** @var Transaction $transaction */
		$transaction      = $this->automation_faker->transaction();
		$transaction_data = new Transaction_Data( $transaction );

		// We expect the workflow to be executed on transaction_created transaction with the transaction data.
		$workflow->expects( $this->once() )
		->method( 'execute' )
		->with(
			$trigger,
			$transaction_data
		);

		// Run the transaction_created action.
		do_action( 'jpcrm_transaction_created', $transaction );
	}

	/**
	 * @testdox Test the transaction updated trigger executes the workflow with an action
	 */
	public function test_transaction_updated_trigger() {
		$workflow_data = $this->automation_faker->workflow_without_initial_step_customize_trigger( 'jpcrm/transaction_updated' );

		$trigger = new Transaction_Updated();

		// Build a PHPUnit mock Automation_Workflow
		$workflow = $this->getMockBuilder( Automation_Workflow::class )
			->setConstructorArgs( array( $workflow_data, new Automation_Engine() ) )
			->onlyMethods( array( 'execute' ) )
			->getMock();

		// Init the Transaction_Updated trigger.
		$trigger->init( $workflow );

		/** @var Transaction $transaction */
		$transaction      = $this->automation_faker->transaction();
		$transaction_data = new Transaction_Data( $transaction );

		// We expect the workflow to be executed on transaction_updated transaction with the transaction data.
		$workflow->expects( $this->once() )
		->method( 'execute' )
		->with(
			$trigger,
			$transaction_data
		);

		// Run the transaction_updated action.
		do_action( 'jpcrm_transaction_updated', $transaction );
	}
}
