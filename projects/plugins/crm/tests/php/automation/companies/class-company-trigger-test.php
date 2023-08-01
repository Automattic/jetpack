<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Automation\Tests;

use Automattic\Jetpack\CRM\Automation\Automation_Engine;
use Automattic\Jetpack\CRM\Automation\Automation_Workflow;
use Automattic\Jetpack\CRM\Automation\Triggers\Company_Created;
use Automattic\Jetpack\CRM\Automation\Triggers\Company_Deleted;
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

		$workflow_data = $this->automation_faker->workflow_without_initial_step_customize_trigger( 'jpcrm/company_updated' );

		$trigger = new Company_Updated();

		// Build a PHPUnit mock Automation_Workflow
		$workflow = $this->getMockBuilder( Automation_Workflow::class )
			->setConstructorArgs( array( $workflow_data, new Automation_Engine() ) )
			->onlyMethods( array( 'execute' ) )
			->getMock();

		// Init the Company_Updated trigger.
		$trigger->init( $workflow );

		// Fake event data.
		$company_data = $this->automation_faker->company_data();

		// We expect the workflow to be executed on company_update event with the company data
		$workflow->expects( $this->once() )
		->method( 'execute' )
		->with(
			$this->equalTo( $trigger ),
			$this->equalTo( $company_data )
		);

		// Run the company_update action.
		do_action( 'jpcrm_automation_company_update', $company_data );
	}

	/**
	 * @testdox Test the company status updated trigger executes the workflow with an action
	 */
	public function test_company_status_updated_trigger() {

		$workflow_data = $this->automation_faker->workflow_without_initial_step_customize_trigger( 'jpcrm/company_status_updated' );

		$trigger = new Company_Status_Updated();

		// Build a PHPUnit mock Automation_Workflow
		$workflow = $this->getMockBuilder( Automation_Workflow::class )
			->setConstructorArgs( array( $workflow_data, new Automation_Engine() ) )
			->onlyMethods( array( 'execute' ) )
			->getMock();

		// Init the Company_Status_Updated trigger.
		$trigger->init( $workflow );

		// Fake event data.
		$company_data = $this->automation_faker->company_data();

		// We expect the workflow to be executed on company_status_update event with the company data
		$workflow->expects( $this->once() )
		->method( 'execute' )
		->with(
			$this->equalTo( $trigger ),
			$this->equalTo( $company_data )
		);

		// Run the company_status_update action.
		do_action( 'jpcrm_automation_company_status_update', $company_data );
	}

	/**
	 * @testdox Test the company new trigger executes the workflow with an action
	 */
	public function test_company_created_trigger() {

		$workflow_data = $this->automation_faker->workflow_without_initial_step_customize_trigger( 'jpcrm/company_created' );

		$trigger = new Company_Created();

		// Build a PHPUnit mock Automation_Workflow
		$workflow = $this->getMockBuilder( Automation_Workflow::class )
			->setConstructorArgs( array( $workflow_data, new Automation_Engine() ) )
			->onlyMethods( array( 'execute' ) )
			->getMock();

		// Init the Company_Created trigger.
		$trigger->init( $workflow );

		// Fake event data.
		$company_data = $this->automation_faker->company_data();

		// We expect the workflow to be executed on company_created event with the company data
		$workflow->expects( $this->once() )
		->method( 'execute' )
		->with(
			$this->equalTo( $trigger ),
			$this->equalTo( $company_data )
		);

		// Notify the company_created event.
		do_action( 'jpcrm_automation_company_created', $company_data );
	}

	/**
	 * @testdox Test the company deleted trigger executes the workflow with an action
	 */
	public function test_company_deleted_trigger() {

		$workflow_data = $this->automation_faker->workflow_without_initial_step_customize_trigger( 'jpcrm/company_deleted' );

		$trigger = new Company_Deleted();

		// Build a PHPUnit mock Automation_Workflow
		$workflow = $this->getMockBuilder( Automation_Workflow::class )
			->setConstructorArgs( array( $workflow_data, new Automation_Engine() ) )
			->onlyMethods( array( 'execute' ) )
			->getMock();

		// Init the Company_Deleted trigger.
		$trigger->init( $workflow );

		// Fake event data.
		$company_data = $this->automation_faker->company_data();

		// We expect the workflow to be executed on company_deleted event with the company data
		$workflow->expects( $this->once() )
		->method( 'execute' )
		->with(
			$this->equalTo( $trigger ),
			$this->equalTo( $company_data )
		);

		// Run the company_deleted action.
		do_action( 'jpcrm_automation_company_delete', $company_data );
	}

}
