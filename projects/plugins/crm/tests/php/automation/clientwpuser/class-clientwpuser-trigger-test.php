<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\CRM\Automation\Tests;

use Automattic\Jetpack\CRM\Automation\Automation_Workflow;
use Automattic\Jetpack\CRM\Automation\Triggers\ClientWPUser_Created;
use Automattic\Jetpack\CRM\Tests\JPCRM_Base_Test_Case;

require_once __DIR__ . '../../tools/class-automation-faker.php';

/**
 * Test Automation Workflow functionalities
 *
 * @covers Automattic\Jetpack\CRM\Automation
 */
class ClientWPUser_Trigger_Test extends JPCRM_Base_Test_Case {

	private $automation_faker;

	public function setUp(): void {
		parent::setUp();
		$this->automation_faker = Automation_Faker::instance();
	}

	/**
	 * @testdox Test the create WP User trigger executes the workflow with an action
	 */
	public function test_wp_user_created_trigger() {

		$workflow_data = $this->automation_faker->workflow_without_initial_step_customize_trigger( 'jpcrm/clientwpuser_created' );

		$trigger = new ClientWPUser_Created();

		// Build a PHPUnit mock Automation_Workflow.
		$workflow = $this->getMockBuilder( Automation_Workflow::class )
			->setConstructorArgs( array( $workflow_data ) )
			->onlyMethods( array( 'execute' ) )
			->getMock();

		// Init the ClientWPUser_Created trigger.
		$trigger->init( $workflow );

		// Initial user data captured from the WP User data creation.
		$clientuser_data = $this->automation_faker->clientwpuser_data();

		// Asserting that the data type is able to get created properly.
		$clientwpuser_data = $this->automation_faker->clientwpuser_data( true );
		$this->assertTrue( $clientwpuser_data->isDisplayNameSet() );

		// We expect the workflow to be executed on clientwpuser_created event with the WP User data.
		$workflow->expects( $this->once() )
		->method( 'execute' )
		->with(
			$this->equalTo( $trigger ),
			$this->equalTo( $clientuser_data )
		);

		// Run the clientwpuser_created action.
		do_action( 'jpcrm_clientwpuser_created', $clientuser_data );
	}
}
