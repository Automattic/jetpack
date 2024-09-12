<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Automation\Tests;

use Automattic\Jetpack\CRM\Automation\Automation_Workflow;
use Automattic\Jetpack\CRM\Automation\Triggers\WP_User_Created;
use Automattic\Jetpack\CRM\Tests\JPCRM_Base_Integration_Test_Case;

require_once __DIR__ . '../../tools/class-automation-faker.php';

/**
 * Test Automation Workflow functionalities
 *
 * @covers Automattic\Jetpack\CRM\Automation
 */
class WP_User_Trigger_Test extends JPCRM_Base_Integration_Test_Case {

	/** @var Automation_Faker */
	private $automation_faker;

	public function setUp(): void {
		parent::setUp();
		$this->automation_faker = Automation_Faker::instance();
	}

	/**
	 * @testdox Test the create WP User trigger executes the workflow with an action
	 */
	public function test_wp_user_created_trigger() {

		$workflow_data = $this->automation_faker->workflow_without_initial_step_customize_trigger( 'jpcrm/wp_user_created' );

		$trigger = new WP_User_Created();

		// Build a PHPUnit mock Automation_Workflow.
		$workflow = $this->getMockBuilder( Automation_Workflow::class )
			->setConstructorArgs( array( $workflow_data ) )
			->onlyMethods( array( 'execute' ) )
			->getMock();

		// Init the WP_User_Created trigger.
		$trigger->init( $workflow );

		// We expect the workflow to be executed on  event with the WP User data.
		$workflow->expects( $this->once() )
		->method( 'execute' )
		->with(
			$trigger,
			$this->callback(
				function ( $object ) {
					return $object->get_data() instanceof \WP_User;
				}
			)
		);

		// User data captured from the WP User data creation.
		$this->add_wp_user();
	}
}
