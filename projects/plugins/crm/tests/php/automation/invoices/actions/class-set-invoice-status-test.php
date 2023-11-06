<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Automation\Tests;

use Automattic\Jetpack\CRM\Automation\Actions\Set_Invoice_Status;
use Automattic\Jetpack\CRM\Automation\Automation_Engine;
use Automattic\Jetpack\CRM\Automation\Automation_Workflow;
use Automattic\Jetpack\CRM\Automation\Triggers\Invoice_Created;
use Automattic\Jetpack\CRM\Tests\JPCRM_Base_Integration_Test_Case;

/**
 * Test Automation Workflow functionalities
 *
 * @covers Automattic\Jetpack\CRM\Automation\Actions\Set_Invoice_Status_Test
 */
class Set_Invoice_Status_Test extends JPCRM_Base_Integration_Test_Case {

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
	 * @testdox Test the set invoice status action executes the action, within a workflow.
	 */
	public function test_set_invoice_status_action_with_workflow() {
		global $zbs;

		$automation = new Automation_Engine();
		$automation->register_trigger( Invoice_Created::class );
		$automation->register_step( Set_Invoice_Status::class );

		$workflow_data = array(
			'name'         => 'Set Invoice Action Workflow Test',
			'description'  => 'This is a test',
			'category'     => 'Test',
			'active'       => true,
			'triggers'     => array(
				Invoice_Created::get_slug(),
			),
			'initial_step' => 0,
			'steps'        => array(
				0 => array(
					'slug'           => Set_Invoice_Status::get_slug(),
					'attributes'     => array(
						'new_status' => 'Paid',
					),
					'next_step_true' => null,
				),
			),
		);

		$workflow = new Automation_Workflow( $workflow_data );
		$workflow->set_engine( $automation );

		$automation->add_workflow( $workflow );
		$automation->init_workflows();

		$invoice_id = $this->add_invoice( array( 'status' => 'Draft' ) );

		$invoice = $zbs->DAL->invoices->getInvoice( $invoice_id );
		$this->assertSame( 'Paid', $invoice['status'] );
	}
}
