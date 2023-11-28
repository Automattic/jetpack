<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Automation\Tests;

use Automattic\Jetpack\CRM\Automation\Automation_Workflow;
use Automattic\Jetpack\CRM\Automation\Data_Types\Invoice_Data;
use Automattic\Jetpack\CRM\Automation\Triggers\Invoice_Created;
use Automattic\Jetpack\CRM\Automation\Triggers\Invoice_Deleted;
use Automattic\Jetpack\CRM\Automation\Triggers\Invoice_Status_Updated;
use Automattic\Jetpack\CRM\Automation\Triggers\Invoice_Updated;
use Automattic\Jetpack\CRM\Entities\Invoice;
use Automattic\Jetpack\CRM\Tests\JPCRM_Base_Test_Case;

require_once __DIR__ . '../../tools/class-automation-faker.php';

/**
 * Test Automation Workflow functionalities
 *
 * @covers Automattic\Jetpack\CRM\Automation
 */
class Invoice_Trigger_Test extends JPCRM_Base_Test_Case {

	private $automation_faker;

	public function setUp(): void {
		parent::setUp();
		$this->automation_faker = Automation_Faker::instance();
	}

	/**
	 * @testdox Test the invoice updated trigger executes the workflow with an action
	 */
	public function test_invoice_updated_trigger() {

		$workflow_data = $this->automation_faker->workflow_without_initial_step_customize_trigger( 'jpcrm/invoice_updated' );

		$trigger = new Invoice_Updated();

		// Build a PHPUnit mock Automation_Workflow
		$workflow = $this->getMockBuilder( Automation_Workflow::class )
			->setConstructorArgs( array( $workflow_data ) )
			->onlyMethods( array( 'execute' ) )
			->getMock();

		// Init the Invoice_Updated trigger.
		$trigger->init( $workflow );

		/** @var Invoice $invoice */
		$invoice      = $this->automation_faker->invoice();
		$invoice_data = new Invoice_Data( $invoice );

		// We expect the workflow to be executed on invoice_update event with the invoice data
		$workflow->expects( $this->once() )
		->method( 'execute' )
		->with(
			$trigger,
			$invoice_data
		);

		// Run the invoice_update action.
		do_action( 'jpcrm_invoice_updated', $invoice );
	}

	/**
	 * @testdox Test the invoice status updated trigger executes the workflow with an action
	 */
	public function test_invoice_status_updated_trigger() {

		$workflow_data = $this->automation_faker->workflow_without_initial_step_customize_trigger( 'jpcrm/invoice_status_updated' );

		$trigger = new Invoice_Status_Updated();

		// Build a PHPUnit mock Automation_Workflow
		$workflow = $this->getMockBuilder( Automation_Workflow::class )
			->setConstructorArgs( array( $workflow_data ) )
			->onlyMethods( array( 'execute' ) )
			->getMock();

		// Init the Invoice_Updated trigger.
		$trigger->init( $workflow );

		/** @var Invoice $invoice */
		$invoice      = $this->automation_faker->invoice();
		$invoice_data = new Invoice_Data( $invoice );

		// We expect the workflow to be executed on invoice_status_update event with the invoice data
		$workflow->expects( $this->once() )
		->method( 'execute' )
		->with(
			$trigger,
			$invoice_data
		);

		// Run the invoice_status_update action.
		do_action( 'jpcrm_invoice_status_updated', $invoice );
	}

	/**
	 * @testdox Test the invoice new trigger executes the workflow with an action
	 */
	public function test_invoice_created_trigger() {

		$workflow_data = $this->automation_faker->workflow_without_initial_step_customize_trigger( 'jpcrm/invoice_created' );

		$trigger = new Invoice_Created();

		// Build a PHPUnit mock Automation_Workflow
		$workflow = $this->getMockBuilder( Automation_Workflow::class )
			->setConstructorArgs( array( $workflow_data ) )
			->onlyMethods( array( 'execute' ) )
			->getMock();

		// Init the Invoice_Created trigger.
		$trigger->init( $workflow );

		/** @var Invoice $invoice */
		$invoice      = $this->automation_faker->invoice();
		$invoice_data = new Invoice_Data( $invoice );

		// We expect the workflow to be executed on invoice_created event with the invoice data
		$workflow->expects( $this->once() )
		->method( 'execute' )
		->with(
			$trigger,
			$invoice_data
		);

		// Run the invoice_created action.
		do_action( 'jpcrm_invoice_created', $invoice );
	}

	/**
	 * @testdox Test the invoice deleted trigger executes the workflow with an action
	 */
	public function test_invoice_deleted_trigger() {

		$workflow_data = $this->automation_faker->workflow_without_initial_step_customize_trigger( 'jpcrm/invoice_deleted' );

		$trigger = new Invoice_Deleted();

		// Build a PHPUnit mock Automation_Workflow
		$workflow = $this->getMockBuilder( Automation_Workflow::class )
			->setConstructorArgs( array( $workflow_data ) )
			->onlyMethods( array( 'execute' ) )
			->getMock();

		// Init the Invoice_Deleted trigger.
		$trigger->init( $workflow );

		/** @var Invoice $invoice */
		$invoice      = $this->automation_faker->invoice();
		$invoice_data = new Invoice_Data( $invoice );

		// We expect the workflow to be executed on invoice_deleted event with the invoice data
		$workflow->expects( $this->once() )
		->method( 'execute' )
		->with(
			$trigger,
			$invoice_data
		);

		// Run the invoice_deleted action.
		do_action( 'jpcrm_invoice_deleted', $invoice );
	}
}
