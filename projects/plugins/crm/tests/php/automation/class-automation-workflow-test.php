<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Automation\Tests;

use Automatic\Jetpack\CRM\Automation\Tests\Mocks\Contact_Created_Trigger;
use Automattic\Jetpack\CRM\Automation\Automation_Engine;
use Automattic\Jetpack\CRM\Automation\Automation_Logger;
use Automattic\Jetpack\CRM\Automation\Automation_Workflow;
use Automattic\Jetpack\CRM\Automation\Base_Trigger;
use Automattic\Jetpack\CRM\Automation\Data_Types\Contact_Data;
use Automattic\Jetpack\CRM\Automation\Tests\Mocks\Contact_Condition;
use Automattic\Jetpack\CRM\Automation\Tests\Mocks\Dummy_Step;
use Automattic\Jetpack\CRM\Automation\Triggers\Contact_Updated;
use Automattic\Jetpack\CRM\Automation\Workflow_Exception;
use Automattic\Jetpack\CRM\Entities\Contact;
use Automattic\Jetpack\CRM\Tests\JPCRM_Base_Test_Case;

require_once __DIR__ . '/tools/class-automation-faker.php';

/**
 * Test Automation Workflow functionalities.
 *
 * @since 6.2.0
 *
 * @covers Automattic\Jetpack\CRM\Automation
 */
class Automation_Workflow_Test extends JPCRM_Base_Test_Case {

	private $automation_faker;

	public function setUp(): void {
		parent::setUp();
		$this->automation_faker = Automation_Faker::instance();
		$this->automation_faker->reset_all();
	}

	/**
	 * @testdox Automation workflow initialization.
	 */
	public function test_automation_workflow_init() {

		$workflow_data = $this->automation_faker->basic_workflow();

		$workflow = new Automation_Workflow( $workflow_data );

		$this->assertEquals( 'Workflow Test: basic_workflow', $workflow->name );
	}

	/**
	 * @testdox Automation workflow with no triggers.
	 */
	public function test_automation_workflow_no_triggers() {
		$workflow_data = $this->automation_faker->empty_workflow();

		$workflow = new Automation_Workflow( $workflow_data );

		$this->assertCount( 0, $workflow->get_triggers() );
	}

	/**
	 * @testdox Automation workflow set initial step.
	 */
	public function test_automation_workflow_set_initial_step() {
		$workflow_data = $this->automation_faker->workflow_without_initial_step();

		$engine = new Automation_Engine();

		$workflow = new Automation_Workflow( $workflow_data );
		$workflow->set_engine( $engine );

		$workflow->set_steps(
			array(
				0 => array(
					'slug'       => 'dummy_step_123',
					'class_name' => Dummy_Step::class,
				),
			)
		);
		$workflow->set_initial_step( 0 );

		/** @var Contact $contact */
		$contact      = $this->automation_faker->contact();
		$contact_data = new Contact_Data( $contact );

		$automation_result = $workflow->execute( new Contact_Updated(), $contact_data );

		$this->assertTrue( $automation_result );
	}

	/**
	 * @testdox Automation workflow with multiple triggers.
	 */
	public function test_workflow_triggers() {
		$workflow_data = $this->automation_faker->basic_workflow();

		$workflow = new Automation_Workflow( $workflow_data );

		$workflow->add_trigger( 'jpcrm/contact_updated' );
		$workflow->add_trigger( 'jpcrm/contact_deleted' );

		$this->assertCount( 3, $workflow->get_triggers() );

		// Check if the triggers are added
		$triggers = $workflow->get_triggers();
		$this->assertEquals( Contact_Created_Trigger::get_slug(), $triggers[0] );
		$this->assertEquals( 'jpcrm/contact_updated', $triggers[1] );
		$this->assertEquals( 'jpcrm/contact_deleted', $triggers[2] );
	}

	/**
	 * @testdox Testing turn on/off the workflow, to activate/deactivate it.
	 */
	public function test_workflow_turn_on_off() {
		$workflow_data = $this->automation_faker->basic_workflow();

		$workflow = new Automation_Workflow( $workflow_data );

		$workflow->turn_on();
		$this->assertTrue( $workflow->is_active() );

		$workflow->turn_off();
		$this->assertFalse( $workflow->is_active() );
	}

	/**
	 * @testdox Testing the workflow execution if it's not active.
	 */
	public function test_workflow_execution_not_active() {

		$automation = new Automation_Engine();
		$automation->set_automation_logger( Automation_Logger::instance() );
		$automation->register_trigger( Contact_Created_Trigger::class );

		$workflow_data = $this->automation_faker->workflow_without_initial_step();

		// Build a PHPUnit mock Automation_Workflow
		$workflow = $this->getMockBuilder( Automation_Workflow::class )
			->setConstructorArgs( array( $workflow_data ) )
			->onlyMethods( array( 'execute' ) )
			->getMock();
		$workflow->set_engine( $automation );

		// Turn off the workflow
		$workflow->turn_off();

		// Add and init the workflows
		$automation->add_workflow( $workflow );
		$automation->init_workflows();

		// We don't expect the workflow to be executed
		$workflow->expects( $this->never() )
				->method( 'execute' );

		// Fake contact data
		$contact_data = $this->automation_faker->contact();

		// Emit the contact_created event with the fake contact data
		$event_emitter = Event_Emitter::instance();
		$event_emitter->emit_event( 'contact_created', $contact_data );
	}

	/**
	 * @testdox Test an automation workflow execution on contact_created event.
	 */
	public function test_workflow_execution_on_contact_created() {

		$logger = Automation_Logger::instance( true );

		$automation = new Automation_Engine();
		$automation->set_automation_logger( $logger );
		$automation->register_trigger( Contact_Created_Trigger::class );

		$workflow_data = $this->automation_faker->workflow_without_initial_step();

		// Build a PHPUnit mock Automation_Workflow
		$workflow = $this->getMockBuilder( Automation_Workflow::class )
						->setConstructorArgs( array( $workflow_data ) )
						->onlyMethods( array( 'execute' ) )
						->getMock();
		$workflow->set_engine( $automation );

		// Add and init the workflows
		$automation->add_workflow( $workflow );
		$automation->init_workflows();

		// Fake event data
		$contact = $this->automation_faker->contact( false );

		// We expect the workflow to be executed on contact_created event with the contact data
		$workflow->expects( $this->once() )
			->method( 'execute' )
			->with(
				$this->logicalAnd(
					$this->isInstanceOf( Base_Trigger::class ),
					$this->callback(
						function ( $trigger ) {
							return $trigger::get_slug() === Contact_Created_Trigger::get_slug();
						}
					)
				),
				new Contact_Data( $contact )
			);

		// Emit the contact_created event with the fake contact data
		$event_emitter = Event_Emitter::instance();
		$event_emitter->emit_event( 'contact_created', $contact );
	}

	/**
	 * @testdox Test an automation workflow execution with a dummy action.
	 */
	public function test_workflow_execution_with_dummy_action() {

		$logger = Automation_Logger::instance( true );

		$automation = new Automation_Engine();
		$automation->set_automation_logger( $logger );
		$automation->register_trigger( Contact_Created_Trigger::class );
		$automation->register_step( Dummy_Step::class );

		$workflow_data = $this->automation_faker->workflow_without_initial_step();

		$workflow = new Automation_Workflow( $workflow_data );
		$workflow->set_logger( $logger );
		$workflow->set_engine( $automation );
		$workflow->set_steps(
			array(
				0 => array(
					'slug' => 'dummy_step',
				),
			)
		);
		$workflow->set_initial_step( 0 );

		// Add and init the workflows
		$automation->add_workflow( $workflow );
		$automation->init_workflows();

		// Fake event data
		$contact_data = $this->automation_faker->contact();

		// Emit the contact_created event with the fake contact data
		$event_emitter = Event_Emitter::instance();
		$event_emitter->emit_event( 'contact_created', $contact_data );

		// Check the execution log
		$log       = $logger->get_log();
		$total_log = count( $log );

		$this->assertGreaterThan( 4, $total_log );

		$this->assertEquals( 'Workflow execution finished: No more steps found.', $log[ $total_log - 1 ][1] );
		$this->assertEquals( 'Dummy step executed', $log[ $total_log - 3 ][1] );
	}

	/**
	 * @testdox Ensure that we throw an error if a workflow is executed without an engine.
	 */
	public function test_workflow_execution_without_engine() {
		$workflow_data = $this->automation_faker->basic_workflow();
		$workflow      = new Automation_Workflow( $workflow_data );

		$this->expectException( Workflow_Exception::class );
		$this->expectExceptionCode( Workflow_Exception::MISSING_ENGINE_INSTANCE );

		$workflow->execute( new Contact_Created_Trigger(), null );
	}

	/**
	 * @testdox Test an automation workflow execution with condition => true.
	 */
	public function test_workflow_execution_with_condition_true() {
		$logger = Automation_Logger::instance( true );
		$logger->reset_log();

		$automation = new Automation_Engine();
		$automation->set_automation_logger( $logger );
		$automation->register_trigger( Contact_Created_Trigger::class );
		$automation->register_step( Contact_Condition::class );
		$automation->register_step( Dummy_Step::class );

		$workflow_data = $this->automation_faker->workflow_with_condition_action();

		$workflow = new Automation_Workflow( $workflow_data );

		$automation->add_workflow( $workflow );
		$automation->init_workflows();

		// Fake event data
		$contact_data = $this->automation_faker->contact();

		// Emit the contact_created event with the fake contact data
		$event_emitter = Event_Emitter::instance();
		$event_emitter->emit_event( 'contact_created', $contact_data );

		// Check the execution log
		$log       = $logger->get_log();
		$total_log = count( $log );

		$this->assertGreaterThan( 7, $total_log );

		$this->assertEquals( 'Condition met?: true', $log[ $total_log - 6 ][1] );
		$this->assertEquals( '[contact_status] Step executed!', $log[ $total_log - 5 ][1] );
		$this->assertEquals( 'Workflow execution finished: No more steps found.', $log[ $total_log - 1 ][1] );
	}

	/**
	 * @testdox Test an automation workflow execution with condition => false.
	 */
	public function test_workflow_execution_with_condition_false() {
		$logger = Automation_Logger::instance( true );
		$logger->reset_log();

		$automation = new Automation_Engine();
		$automation->set_automation_logger( $logger );
		$automation->register_trigger( Contact_Created_Trigger::class );
		$automation->register_step( Contact_Condition::class );
		$automation->register_step( Dummy_Step::class );

		$workflow_data = $this->automation_faker->workflow_with_condition_action();

		$workflow = new Automation_Workflow( $workflow_data );
		$workflow->set_engine( $automation );

		$automation->add_workflow( $workflow );
		$automation->init_workflows();

		// Fake event data. Set status to customer to make the condition false
		/** @var Contact $contact */
		$contact         = $this->automation_faker->contact();
		$contact->status = 'customer';

		// Emit the contact_created event with the fake contact data
		$event_emitter = Event_Emitter::instance();
		$event_emitter->emit_event( 'contact_created', $contact );

		// Check the execution log
		$log       = $logger->get_log();
		$total_log = count( $log );

		$this->assertGreaterThan( 6, $total_log );

		$this->assertEquals( 'Workflow execution finished: No more steps found.', $log[ $total_log - 1 ][1] );
		$this->assertEquals( 'Condition met?: false', $log[ $total_log - 3 ][1] );
	}
}
