<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Automation\Tests;

use Automattic\Jetpack\CRM\Automation\Automation_Engine;
use Automattic\Jetpack\CRM\Automation\Automation_Workflow;
use Automattic\Jetpack\CRM\Automation\Triggers\Company_Deleted;
use Automattic\Jetpack\CRM\Automation\Triggers\Company_New;
use Automattic\Jetpack\CRM\Automation\Triggers\Company_Status_Updated;
use Automattic\Jetpack\CRM\Automation\Triggers\Company_Updated;
use WorDBless\BaseTestCase;

require_once __DIR__ . '../../tools/class-automation-faker.php';

/**
 * Test Automation Workflow functionalities
 *
 * @covers Automattic\Jetpack\CRM\Automation
 */
class Company_Trigger_Test extends BaseTestCase {

	private $automation_faker;

	public function setUp(): void {
		parent::setUp();
		$this->automation_faker = Automation_Faker::instance();
	}

	/**
	 * @testdox Test the company updated trigger executes the workflow with an action
	 */
	public function test_company_updated_trigger() {

		$workflow_data = $this->automation_faker->workflow_without_initial_step_customize_trigger( 'company_updated' );

		// Build a PHPUnit mock Company_Updated trigger.
		$trigger = $this->getMockBuilder( Company_Updated::class )
		->onlyMethods( array( 'execute_workflow' ) )
		->getMock();

		// Init the mocked trigger.
		$trigger->init( new Automation_Workflow( $workflow_data, new Automation_Engine() ) );

		// Fake event data.
		$company_data = $this->automation_faker->company_data();

		// We expect the trigger to be executed on execute_workflow event with the company data.
		$trigger->expects( $this->once() )
		->method( 'execute_workflow' )
		->with(
			$this->equalTo( $company_data )
		);

		// Run the company_update action.
		do_action( 'jpcrm_automation_company_update', $company_data );
	}

	/**
	 * @testdox Test the company status updated trigger executes the workflow with an action
	 */
	public function test_company_status_updated_trigger() {

		$workflow_data = $this->automation_faker->workflow_without_initial_step_customize_trigger( 'company_status_updated' );

		// Build a PHPUnit mock Company_Status_Updated trigger.
		$trigger = $this->getMockBuilder( Company_Status_Updated::class )
		->onlyMethods( array( 'execute_workflow' ) )
		->getMock();

		// Init the mocked trigger.
		$trigger->init( new Automation_Workflow( $workflow_data, new Automation_Engine() ) );

		// Fake event data.
		$company_data = $this->automation_faker->company_data();

		// We expect the trigger to be executed on execute_workflow event with the company data.
		$trigger->expects( $this->once() )
		->method( 'execute_workflow' )
		->with(
			$this->equalTo( $company_data )
		);

		// Run the company_status_update action.
		do_action( 'jpcrm_automation_company_status_update', $company_data );
	}

	/**
	 * @testdox Test the company new trigger executes the workflow with an action
	 */
	public function test_company_new_trigger() {

		$workflow_data = $this->automation_faker->workflow_without_initial_step_customize_trigger( 'company_new' );

		// Build a PHPUnit mock Company_New trigger.
		$trigger = $this->getMockBuilder( Company_New::class )
		->onlyMethods( array( 'execute_workflow' ) )
		->getMock();

		// Init the mocked trigger.
		$trigger->init( new Automation_Workflow( $workflow_data, new Automation_Engine() ) );

		// Fake event data.
		$company_data = $this->automation_faker->company_data();

		// We expect the trigger to be executed on execute_workflow event with the company data.
		$trigger->expects( $this->once() )
		->method( 'execute_workflow' )
		->with(
			$this->equalTo( $company_data )
		);

		// Run the company_new action.
		do_action( 'jpcrm_automation_company_new', $company_data );
	}

	/**
	 * @testdox Test the company deleted trigger executes the workflow with an action
	 */
	public function test_company_deleted_trigger() {

		$workflow_data = $this->automation_faker->workflow_without_initial_step_customize_trigger( 'company_delete' );

		// Build a PHPUnit mock Company_Deleted trigger.
		$trigger = $this->getMockBuilder( Company_Deleted::class )
		->onlyMethods( array( 'execute_workflow' ) )
		->getMock();

		// Init the mocked trigger.
		$trigger->init( new Automation_Workflow( $workflow_data, new Automation_Engine() ) );

		// Fake event data.
		$company_data = $this->automation_faker->company_data();

		// We expect the trigger to be executed on execute_workflow event with the company data.
		$trigger->expects( $this->once() )
		->method( 'execute_workflow' )
		->with(
			$this->equalTo( $company_data )
		);

		// Run the company_delete action.
		do_action( 'jpcrm_automation_company_delete', $company_data );
	}

}
